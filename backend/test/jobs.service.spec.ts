import { NotFoundException } from '@nestjs/common';
import { JobsRepository } from '../src/jobs/jobs.repository';
import { JobsService } from '../src/jobs/jobs.service';
import { UrlCheckerService } from '../src/jobs/url-checker.service';

const longDelay = async (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 30_000));

function createChecker(
  fetchFn: () => Promise<Response>,
  delayFn: () => Promise<void>,
): UrlCheckerService {
  return new UrlCheckerService({ fetchFn, delayFn });
}

describe('JobsService', () => {
  let repository: JobsRepository;
  let service: JobsService;

  beforeEach(() => {
    repository = new JobsRepository();
    service = new JobsService(
      repository,
      createChecker(
        async () => new Response(null, { status: 200 }),
        longDelay,
      ),
    );
  });

  it('creates a job and returns jobId', () => {
    const result = service.createJob(['https://example.com']);
    expect(result.jobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('lists created jobs', async () => {
    const { jobId } = service.createJob(['https://example.com']);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const jobs = service.listJobs();
    expect(jobs.some((job) => job.id === jobId)).toBe(true);
  });

  it('throws when job is missing', () => {
    expect(() =>
      service.getJob('00000000-0000-4000-8000-000000000000'),
    ).toThrow(NotFoundException);
  });

  it('cancels pending URLs', async () => {
    const slowService = new JobsService(
      new JobsRepository(),
      createChecker(
        async () => new Response(null, { status: 200 }),
        longDelay,
      ),
    );
    const urls = Array.from({ length: 10 }, (_, i) => `https://example-${i}.com`);
    const { jobId } = slowService.createJob(urls);

    await new Promise((resolve) => setTimeout(resolve, 20));
    const detail = slowService.cancelJob(jobId);

    expect(detail.status).toBe('cancelled');
    expect(detail.urls.filter((url) => url.status === 'cancelled').length).toBeGreaterThan(0);
  });

  it('processes URLs with success status', async () => {
    const fastService = new JobsService(
      new JobsRepository(),
      createChecker(
        async () => new Response(null, { status: 200 }),
        async () => undefined,
      ),
    );
    const { jobId } = fastService.createJob(['https://example.com']);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const detail = fastService.getJob(jobId);
    expect(detail.urls[0]?.status).toBe('success');
    expect(detail.urls[0]?.httpStatus).toBe(200);
  });
});
