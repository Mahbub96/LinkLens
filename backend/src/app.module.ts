import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Database
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { LinkModule } from './modules/links/link.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CampaignModule } from './modules/campaigns/campaign.module';
import { QrModule } from './modules/qr/qr.module';
import { DomainModule } from './modules/domains/domain.module';
import { WebhookModule } from './modules/webhooks/webhook.module';
import { ApiKeyModule } from './modules/api-keys/api-key.module';
import { WorkerModule } from './modules/workers/worker.module';
import { HealthModule } from './modules/health/health.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute for management API
    }]),

    // BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: new URL(config.get<string>('REDIS_URL', 'redis://localhost:6379')).hostname,
          port: Number(new URL(config.get<string>('REDIS_URL', 'redis://localhost:6379')).port) || 6379,
        },
      }),
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    AuthModule,
    WorkspaceModule,
    LinkModule,
    RedirectModule,
    AnalyticsModule,
    CampaignModule,
    QrModule,
    DomainModule,
    WebhookModule,
    ApiKeyModule,
    WorkerModule,
    HealthModule,
  ],
  providers: [
    // Global JWT Auth Guard
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global Rate Limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
