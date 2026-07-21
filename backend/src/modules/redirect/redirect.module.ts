import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedirectService } from './redirect.service';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'click-events' }),
  ],
  providers: [RedirectService],
  controllers: [RedirectController],
  exports: [RedirectService],
})
export class RedirectModule {}
