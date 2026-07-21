import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { extractClientIp, isExpired, isNotYetActive, parseUtmParams } from '../../common/utils';
import UAParser from 'ua-parser-js';
import * as bcrypt from 'bcrypt';

export interface ClickEventPayload {
  linkId: string;
  workspaceId: string;
  ip: string;
  userAgent: string;
  referrer: string;
  url: string;
  timestamp: string;
  headers: Record<string, string>;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue('click-events') private clickQueue: Queue,
  ) {}

  /**
   * The Hot Path: Resolve a link and return the redirect target.
   * 1. Look up in Redis (O(1))
   * 2. Fallback to PostgreSQL on cache miss
   * 3. Evaluate match rules (Geo, Device, OS, etc.)
   * 4. Queue click event asynchronously
   * 5. Return redirect URL
   */
  async resolve(domain: string, slug: string, req: any): Promise<{ url: string; statusCode: number }> {
    // 1. Redis lookup (Hot Path)
    let linkData = await this.redis.getCachedLink(domain, slug);

    // 2. Cache miss → PostgreSQL
    if (!linkData) {
      const link = await this.prisma.link.findUnique({
        where: { domainHost_slug: { domainHost: domain, slug } },
        include: { rules: { orderBy: { priority: 'asc' } } },
      });

      if (!link) throw new NotFoundException('Link not found');

      linkData = {
        id: link.id,
        destinationUrl: link.destinationUrl,
        workspaceId: link.workspaceId,
        isEnabled: link.isEnabled,
        isProtected: link.isProtected,
        password: link.password,
        expiresAt: link.expiresAt?.toISOString(),
        activatesAt: link.activatesAt?.toISOString(),
        maxClicks: link.maxClicks,
        totalClicks: link.totalClicks,
        rules: link.rules,
      };

      // Cache for next time
      await this.redis.cacheLink(domain, slug, linkData);
    }

    // 3. Validate link status
    if (!linkData.isEnabled) throw new NotFoundException('Link is disabled');
    if (isExpired(linkData.expiresAt)) throw new NotFoundException('Link has expired');
    if (isNotYetActive(linkData.activatesAt)) throw new NotFoundException('Link is not yet active');
    if (linkData.maxClicks && linkData.totalClicks >= linkData.maxClicks) {
      throw new NotFoundException('Link has reached maximum clicks');
    }

    // 4. Evaluate match rules for dynamic routing
    const ip = extractClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const language = req.headers['accept-language']?.split(',')[0] || '';

    let targetUrl = linkData.destinationUrl;
    const rules = linkData.rules || [];

    for (const rule of rules) {
      const match = this.evaluateRule(rule, { ip, device, os, browser, language, userAgent });
      if (match) {
        targetUrl = rule.targetUrl;
        break;
      }
    }

    // 5. Queue click event asynchronously (Cold Path)
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const eventPayload: ClickEventPayload = {
      linkId: linkData.id,
      workspaceId: linkData.workspaceId,
      ip,
      userAgent,
      referrer,
      url: req.url,
      timestamp: new Date().toISOString(),
      headers: {
        'accept-language': language,
      },
    };

    await this.clickQueue.add('process-click', eventPayload, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });

    // 6. Increment click count (fire-and-forget)
    this.prisma.link.update({
      where: { id: linkData.id },
      data: { totalClicks: { increment: 1 } },
    }).catch((err) => this.logger.error('Failed to increment click count', err));

    return { url: targetUrl, statusCode: 302 };
  }

  /** Verify password for protected links. */
  async verifyPassword(domain: string, slug: string, password: string): Promise<boolean> {
    const linkData = await this.redis.getCachedLink(domain, slug);
    if (!linkData?.password) return true;
    return bcrypt.compare(password, linkData.password);
  }

  // ─── Rule Evaluation Engine ───

  private evaluateRule(
    rule: { conditionType: string; conditionValue: string },
    context: { ip: string; device: any; os: any; browser: any; language: string; userAgent: string },
  ): boolean {
    try {
      const condition = JSON.parse(rule.conditionValue);

      switch (rule.conditionType) {
        case 'GEO':
          // Geo matching will be handled by the worker after MaxMind lookup
          // For now, return false (geo rules are evaluated server-side in worker)
          return false;

        case 'DEVICE':
          return this.matchDevice(condition, context.device);

        case 'OS':
          return this.matchOS(condition, context.os);

        case 'BROWSER':
          return this.matchBrowser(condition, context.browser);

        case 'LANGUAGE':
          return condition.languages?.some(
            (lang: string) => context.language.toLowerCase().startsWith(lang.toLowerCase()),
          ) ?? false;

        case 'AB_TEST':
          // Weighted random distribution
          const weight = condition.weight || 50;
          return Math.random() * 100 < weight;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private matchDevice(condition: any, device: any): boolean {
    if (condition.types) {
      const deviceType = (device.type || 'desktop').toLowerCase();
      return condition.types.some((t: string) => t.toLowerCase() === deviceType);
    }
    return false;
  }

  private matchOS(condition: any, os: any): boolean {
    if (condition.names) {
      const osName = (os.name || '').toLowerCase();
      return condition.names.some((n: string) => osName.includes(n.toLowerCase()));
    }
    return false;
  }

  private matchBrowser(condition: any, browser: any): boolean {
    if (condition.names) {
      const browserName = (browser.name || '').toLowerCase();
      return condition.names.some((n: string) => browserName.includes(n.toLowerCase()));
    }
    return false;
  }
}
