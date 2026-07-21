import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClickEventProcessor } from './click-event.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'click-events' }),
  ],
  providers: [ClickEventProcessor],
})
export class WorkerModule {}
