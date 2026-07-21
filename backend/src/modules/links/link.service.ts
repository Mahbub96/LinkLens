import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { CreateLinkDto, UpdateLinkDto } from '../../common/dto';
import { generateSlug, paginate, isValidUrl } from '../../common/utils';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LinkService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(workspaceId: string, dto: CreateLinkDto) {
    if (!isValidUrl(dto.destinationUrl)) {
      throw new BadRequestException('Invalid destination URL');
    }

    const slug = dto.slug || generateSlug();
    const domain = dto.domainHost || 'default';

    // Check slug uniqueness within domain
    const existing = await this.prisma.link.findUnique({
      where: { domainHost_slug: { domainHost: domain, slug } },
    });
    if (existing) throw new ConflictException('Slug already taken for this domain');

    // Hash password if protected
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const link = await this.prisma.link.create({
      data: {
        slug,
        destinationUrl: dto.destinationUrl,
        title: dto.title,
        workspaceId,
        domainHost: domain,
        isProtected: !!dto.password,
        password: hashedPassword,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        activatesAt: dto.activatesAt ? new Date(dto.activatesAt) : undefined,
        maxClicks: dto.maxClicks,
        campaignId: dto.campaignId,
        rules: dto.rules
          ? {
              create: dto.rules.map((r, i) => ({
                conditionType: r.conditionType,
                conditionValue: r.conditionValue,
                targetUrl: r.targetUrl,
                priority: r.priority ?? i,
              })),
            }
          : undefined,
      },
      include: { rules: true },
    });

    // Cache in Redis for hot-path redirect
    await this.cacheLinkToRedis(link);

    return link;
  }

  async findAll(workspaceId: string, page = 1, limit = 20, search?: string) {
    const where: any = { workspaceId };
    if (search) {
      where.OR = [
        { slug: { contains: search, mode: 'insensitive' } },
        { destinationUrl: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.link.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { rules: true, campaign: true, _count: { select: { qrCodes: true } } },
      }),
      this.prisma.link.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(workspaceId: string, linkId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id: linkId, workspaceId },
      include: { rules: true, campaign: true, qrCodes: true },
    });
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }

  async update(workspaceId: string, linkId: string, dto: UpdateLinkDto) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) throw new NotFoundException('Link not found');

    let hashedPassword = link.password;
    if (dto.password !== undefined) {
      hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    }

    const updated = await this.prisma.link.update({
      where: { id: linkId },
      data: {
        destinationUrl: dto.destinationUrl,
        title: dto.title,
        isEnabled: dto.isEnabled,
        isArchived: dto.isArchived,
        isProtected: dto.password ? true : dto.password === '' ? false : undefined,
        password: hashedPassword,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        activatesAt: dto.activatesAt ? new Date(dto.activatesAt) : undefined,
        maxClicks: dto.maxClicks,
        campaignId: dto.campaignId,
      },
      include: { rules: true },
    });

    // Update Redis cache
    await this.cacheLinkToRedis(updated);

    return updated;
  }

  async delete(workspaceId: string, linkId: string) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) throw new NotFoundException('Link not found');

    await this.prisma.link.delete({ where: { id: linkId } });
    await this.redis.invalidateLink(link.domainHost, link.slug);

    return { message: 'Link deleted' };
  }

  async duplicate(workspaceId: string, linkId: string) {
    const original = await this.prisma.link.findFirst({
      where: { id: linkId, workspaceId },
      include: { rules: true },
    });
    if (!original) throw new NotFoundException('Link not found');

    return this.create(workspaceId, {
      destinationUrl: original.destinationUrl,
      title: original.title ? `${original.title} (copy)` : undefined,
      domainHost: original.domainHost,
      expiresAt: original.expiresAt?.toISOString(),
      maxClicks: original.maxClicks ?? undefined,
      campaignId: original.campaignId ?? undefined,
      rules: original.rules.map((r) => ({
        conditionType: r.conditionType,
        conditionValue: r.conditionValue,
        targetUrl: r.targetUrl,
        priority: r.priority,
      })),
    });
  }

  async addRule(workspaceId: string, linkId: string, rule: { conditionType: string; conditionValue: string; targetUrl: string; priority?: number }) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) throw new NotFoundException('Link not found');

    const created = await this.prisma.matchRule.create({
      data: {
        linkId,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue,
        targetUrl: rule.targetUrl,
        priority: rule.priority ?? 0,
      },
    });

    // Refresh cache
    const updatedLink = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: { rules: true },
    });
    if (updatedLink) await this.cacheLinkToRedis(updatedLink);

    return created;
  }

  async deleteRule(workspaceId: string, linkId: string, ruleId: string) {
    const link = await this.prisma.link.findFirst({ where: { id: linkId, workspaceId } });
    if (!link) throw new NotFoundException('Link not found');

    await this.prisma.matchRule.delete({ where: { id: ruleId } });

    // Refresh cache
    const updatedLink = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: { rules: true },
    });
    if (updatedLink) await this.cacheLinkToRedis(updatedLink);

    return { message: 'Rule deleted' };
  }

  // ─── Redis Cache Helper ───

  private async cacheLinkToRedis(link: any) {
    const data = {
      id: link.id,
      destinationUrl: link.destinationUrl,
      workspaceId: link.workspaceId,
      isEnabled: link.isEnabled,
      isProtected: link.isProtected,
      password: link.password,
      expiresAt: link.expiresAt,
      activatesAt: link.activatesAt,
      maxClicks: link.maxClicks,
      totalClicks: link.totalClicks,
      rules: link.rules || [],
    };
    await this.redis.cacheLink(link.domainHost, link.slug, data);
  }
}
