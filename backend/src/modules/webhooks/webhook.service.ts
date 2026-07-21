import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from '../../common/dto';
import { generateToken, hmacSha256 } from '../../common/utils';

@Injectable()
export class WebhookService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhooks') private webhookQueue: Queue,
  ) {}

  async create(workspaceId: string, dto: CreateWebhookDto) {
    const secret = generateToken(32);
    return this.prisma.webhook.create({
      data: {
        url: dto.url,
        events: dto.events,
        secret,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { logs: true } } },
    });
  }

  async update(workspaceId: string, webhookId: string, dto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, workspaceId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url: dto.url,
        events: dto.events,
        isActive: dto.isActive,
      },
    });
  }

  async delete(workspaceId: string, webhookId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, workspaceId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    await this.prisma.webhook.delete({ where: { id: webhookId } });
    return { message: 'Webhook deleted' };
  }

  async getLogs(workspaceId: string, webhookId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, workspaceId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Trigger webhooks for a specific event in a workspace.
   * Enqueues delivery jobs for each matching webhook.
   */
  async trigger(workspaceId: string, event: string, payload: Record<string, any>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        workspaceId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      const body = JSON.stringify(payload);
      const signature = hmacSha256(body, webhook.secret);

      await this.webhookQueue.add('deliver', {
        webhookId: webhook.id,
        url: webhook.url,
        event,
        payload: body,
        signature,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }
}
