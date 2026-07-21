import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('webhooks', { concurrency: 5 })
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const { webhookId, url, event, payload, signature } = job.data;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-256': `sha256=${signature}`,
          'X-LinkLens-Event': event,
        },
        body: payload,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const responseText = await response.text();

      await this.prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload,
          statusCode: response.status,
          response: responseText.slice(0, 1000),
          success: response.ok,
        },
      });

      if (!response.ok) {
        this.logger.warn(`Webhook delivery failed: ${url} returned ${response.status}`);
        throw new Error(`Webhook returned ${response.status}`);
      }

      this.logger.log(`Webhook delivered: ${event} → ${url}`);
    } catch (err) {
      await this.prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload,
          statusCode: 0,
          response: err.message,
          success: false,
        },
      });
      throw err; // BullMQ will retry
    }
  }
}
