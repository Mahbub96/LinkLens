import { Module } from '@nestjs/common';
import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';

@Module({
  providers: [DomainService],
  controllers: [DomainController],
  exports: [DomainService],
})
export class DomainModule {}
