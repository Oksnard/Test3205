import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';
import { UrlCheckerService } from './url-checker.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsRepository, UrlCheckerService],
})
export class JobsModule {}
