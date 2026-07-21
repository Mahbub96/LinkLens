import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClickHouseService } from '../../database/clickhouse.service';
import { RedisService } from '../../database/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { anonymizeIp, parseUtmParams } from '../../common/utils';
import { ClickEventPayload } from '../redirect/redirect.service';
import UAParser from 'ua-parser-js';
import { randomUUID } from 'crypto';

/**
 * Cold Path Worker – Processes click events asynchronously.
 * 1. Parse user-agent for device/browser/OS
 * 2. Parse UTM parameters
 * 3. Score traffic quality (bot detection)
 * 4. Optionally anonymize IP (GDPR)
 * 5. Batch insert into ClickHouse
 * 6. Publish to real-time feed
 */
@Processor('click-events', { concurrency: 10 })
export class ClickEventProcessor extends WorkerHost {
  private readonly logger = new Logger(ClickEventProcessor.name);
  private batch: Record<string, any>[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_INTERVAL = 2000; // 2 seconds

  constructor(
    private clickhouse: ClickHouseService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ClickEventPayload>) {
    try {
      const payload = job.data;
      const parser = new UAParser(payload.userAgent);
      const device = parser.getDevice();
      const os = parser.getOS();
      const browser = parser.getBrowser();
      const utmParams = parseUtmParams(payload.referrer || payload.url);

      // Bot detection heuristic
      const isBot = this.detectBot(payload.userAgent);
      const trafficScore = isBot ? 10 : 90;

      // Check workspace GDPR settings
      let ip = payload.ip;
      try {
        const workspace = await this.prisma.workspace.findUnique({
          where: { id: payload.workspaceId },
          select: { anonymizeIps: true },
        });
        if (workspace?.anonymizeIps) {
          ip = anonymizeIp(ip);
        }
      } catch {
        // Non-critical – proceed with original IP
      }

      const event = {
        event_id: randomUUID(),
        link_id: payload.linkId,
        workspace_id: payload.workspaceId,
        timestamp: payload.timestamp,
        ip_address: ip,
        country: '',
        region: '',
        city: '',
        asn: 0,
        isp: '',
        is_vpn: 0,
        is_tor: 0,
        is_proxy: 0,
        user_agent: payload.userAgent,
        device: device.type || 'desktop',
        browser: browser.name || 'Unknown',
        browser_version: browser.version || '',
        os: os.name || 'Unknown',
        screen_resolution: '',
        hardware_concurrency: 0,
        device_memory: 0,
        hardware_signature: '',
        timezone: payload.headers?.['accept-language'] || '',
        timezone_mismatch: 0,
        referrer: payload.referrer,
        ...utmParams,
        traffic_score: trafficScore,
        is_bot: isBot ? 1 : 0,
      };

      // Add to batch
      this.batch.push(event);

      // Flush if batch is full
      if (this.batch.length >= this.BATCH_SIZE) {
        await this.flushBatch();
      } else if (!this.batchTimer) {
        // Set timer for partial batches
        this.batchTimer = setTimeout(() => this.flushBatch(), this.BATCH_INTERVAL);
      }

      // Publish to real-time feed
      await this.redis.publish('click-feed', JSON.stringify({
        linkId: payload.linkId,
        workspaceId: payload.workspaceId,
        country: event.country,
        device: event.device,
        browser: event.browser,
        os: event.os,
        referrer: event.referrer,
        timestamp: event.timestamp,
        isBot: event.is_bot,
      }));

    } catch (err) {
      this.logger.error(`Failed to process click event: ${err.message}`, err.stack);
      throw err; // BullMQ will retry
    }
  }

  private async flushBatch() {
    if (this.batch.length === 0) return;
    const events = [...this.batch];
    this.batch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await this.clickhouse.insertClickEvents(events);
      this.logger.log(`Flushed ${events.length} click events to ClickHouse`);
    } catch (err) {
      this.logger.error(`Failed to flush batch to ClickHouse: ${err.message}`);
      // Put back in batch for retry
      this.batch.unshift(...events);
    }
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
      /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
      /wget/i, /curl/i, /python-requests/i, /axios/i, /node-fetch/i,
    ];
    return botPatterns.some((p) => p.test(userAgent));
  }
}
