import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  JobDetail,
  JobEntity,
  JobStats,
  JobSummary,
  UrlCheckResult,
} from './types/job.types';

@Injectable()
export class JobsRepository {
  private readonly jobs = new Map<string, JobEntity>();

  create(urls: string[]): JobEntity {
    const id = uuidv4();
    const urlResults: UrlCheckResult[] = urls.map((url) => ({
      url,
      status: 'pending',
      httpStatus: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      durationMs: null,
    }));

    const job: JobEntity = {
      id,
      createdAt: new Date(),
      status: 'pending',
      urls: urlResults,
      cancelled: false,
      abortController: new AbortController(),
    };

    this.jobs.set(id, job);
    return job;
  }

  findAll(): JobSummary[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((job) => this.toSummary(job));
  }

  findById(id: string): JobEntity | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updater: (job: JobEntity) => void): JobEntity | undefined {
    const job = this.jobs.get(id);
    if (!job) {
      return undefined;
    }
    updater(job);
    this.jobs.set(id, job);
    return job;
  }

  toSummary(job: JobEntity): JobSummary {
    return {
      id: job.id,
      createdAt: job.createdAt.toISOString(),
      status: job.status,
      urlCount: job.urls.length,
      stats: this.computeStats(job.urls),
    };
  }

  toDetail(job: JobEntity): JobDetail {
    return {
      id: job.id,
      createdAt: job.createdAt.toISOString(),
      status: job.status,
      urls: job.urls.map((url) => ({ ...url })),
    };
  }

  computeStats(urls: UrlCheckResult[]): JobStats {
    return urls.reduce<JobStats>(
      (stats, url) => {
        switch (url.status) {
          case 'success':
            stats.success += 1;
            break;
          case 'error':
            stats.error += 1;
            break;
          case 'pending':
            stats.pending += 1;
            break;
          case 'in_progress':
            stats.inProgress += 1;
            break;
          case 'cancelled':
            stats.cancelled += 1;
            break;
        }
        return stats;
      },
      { success: 0, error: 0, pending: 0, inProgress: 0, cancelled: 0 },
    );
  }
}
