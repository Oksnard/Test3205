import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import pLimit from 'p-limit';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { JobsRepository } from './jobs.repository';
import { JobDetail, JobEntity, JobSummary } from './types/job.types';
import { UrlCheckerService } from './url-checker.service';

const CONCURRENCY_PER_JOB = 5;

@Injectable()
export class JobsService {
  constructor(
    private readonly repository: JobsRepository,
    private readonly urlChecker: UrlCheckerService,
  ) {}

  createJob(urls: string[]): CreateJobResponseDto {
    const normalized = this.normalizeUrls(urls);
    const job = this.repository.create(normalized);

    void this.processJob(job.id);

    return { jobId: job.id };
  }

  listJobs(): JobSummary[] {
    return this.repository.findAll();
  }

  getJob(id: string): JobDetail {
    const job = this.repository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return this.repository.toDetail(job);
  }

  cancelJob(id: string): JobDetail {
    const job = this.repository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (this.isTerminalStatus(job.status)) {
      return this.repository.toDetail(job);
    }

    this.repository.updateJob(id, (current) => {
      current.cancelled = true;
      current.status = 'cancelled';
      current.abortController.abort();

      current.urls = current.urls.map((urlResult) =>
        urlResult.status === 'pending'
          ? { ...urlResult, status: 'cancelled' }
          : urlResult,
      );
    });

    const updated = this.repository.findById(id);
    if (!updated) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return this.repository.toDetail(updated);
  }

  private normalizeUrls(urls: string[]): string[] {
    const trimmed = urls.map((url) => url.trim()).filter((url) => url.length > 0);
    if (trimmed.length === 0) {
      throw new BadRequestException('At least one URL is required');
    }
    return trimmed;
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.repository.findById(jobId);
    if (!job) {
      return;
    }

    this.repository.updateJob(jobId, (current) => {
      current.status = 'in_progress';
    });

    const limit = pLimit(CONCURRENCY_PER_JOB);
    const currentJob = this.repository.findById(jobId);
    if (!currentJob) {
      return;
    }

    const tasks = currentJob.urls.map((_, index) =>
      limit(() => this.processUrl(jobId, index)),
    );

    await Promise.all(tasks);
    this.finalizeJob(jobId);
  }

  private async processUrl(jobId: string, index: number): Promise<void> {
    const job = this.repository.findById(jobId);
    if (!job || job.cancelled) {
      return;
    }

    const urlEntry = job.urls[index];
    if (!urlEntry || urlEntry.status !== 'pending') {
      return;
    }

    const startedAt = new Date();

    this.repository.updateJob(jobId, (current) => {
      if (current.cancelled || current.urls[index]?.status !== 'pending') {
        return;
      }
      current.urls[index] = {
        ...current.urls[index],
        status: 'in_progress',
        startedAt: startedAt.toISOString(),
      };
    });

    const refreshed = this.repository.findById(jobId);
    if (!refreshed || refreshed.cancelled) {
      return;
    }

    try {
      const outcome = await this.urlChecker.checkUrl(
        urlEntry.url,
        refreshed.abortController.signal,
      );

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      this.repository.updateJob(jobId, (current) => {
        if (current.cancelled) {
          return;
        }

        const entry = current.urls[index];
        if (!entry || entry.status !== 'in_progress') {
          return;
        }

        const hasError = outcome.errorMessage !== null;
        current.urls[index] = {
          ...entry,
          status: hasError ? 'error' : 'success',
          httpStatus: outcome.httpStatus,
          errorMessage: outcome.errorMessage,
          finishedAt: finishedAt.toISOString(),
          durationMs,
        };
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.repository.updateJob(jobId, (current) => {
          const entry = current.urls[index];
          if (!entry || entry.status === 'cancelled') {
            return;
          }
          current.urls[index] = {
            ...entry,
            status: 'cancelled',
            finishedAt: new Date().toISOString(),
            durationMs: new Date().getTime() - startedAt.getTime(),
          };
        });
        return;
      }

      const finishedAt = new Date();
      const message =
        error instanceof Error ? error.message : 'Unexpected processing error';

      this.repository.updateJob(jobId, (current) => {
        const entry = current.urls[index];
        if (!entry) {
          return;
        }
        current.urls[index] = {
          ...entry,
          status: 'error',
          errorMessage: message,
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
        };
      });
    }
  }

  private finalizeJob(jobId: string): void {
    this.repository.updateJob(jobId, (current) => {
      if (current.cancelled) {
        current.status = 'cancelled';
        return;
      }

      const stats = this.repository.computeStats(current.urls);
      const allDone =
        stats.pending === 0 && stats.inProgress === 0;

      if (allDone) {
        current.status = stats.error === current.urls.length ? 'failed' : 'completed';
      }
    });
  }

  private isTerminalStatus(status: JobEntity['status']): boolean {
    return (
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'failed'
    );
  }
}
