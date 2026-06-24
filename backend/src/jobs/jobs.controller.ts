import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { JobsService } from './jobs.service';
import { JobDetail, JobSummary } from './types/job.types';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createJob(@Body() dto: CreateJobDto): CreateJobResponseDto {
    return this.jobsService.createJob(dto.urls);
  }

  @Get()
  listJobs(): JobSummary[] {
    return this.jobsService.listJobs();
  }

  @Get(':id')
  getJob(@Param('id', ParseUUIDPipe) id: string): JobDetail {
    return this.jobsService.getJob(id);
  }

  @Delete(':id')
  cancelJob(@Param('id', ParseUUIDPipe) id: string): JobDetail {
    return this.jobsService.cancelJob(id);
  }
}
