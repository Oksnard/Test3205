import { JobsRepository } from '../src/jobs/jobs.repository';

describe('JobsRepository', () => {
  it('creates and retrieves jobs', () => {
    const repository = new JobsRepository();
    const job = repository.create(['https://example.com']);

    expect(repository.findById(job.id)?.id).toBe(job.id);
    expect(repository.findAll()).toHaveLength(1);
  });

  it('computes stats correctly', () => {
    const repository = new JobsRepository();
    const job = repository.create(['https://a.example', 'https://b.example']);

    repository.updateJob(job.id, (current) => {
      current.urls[0] = { ...current.urls[0], status: 'success' };
      current.urls[1] = { ...current.urls[1], status: 'error' };
    });

    const summary = repository.toSummary(repository.findById(job.id)!);
    expect(summary.stats.success).toBe(1);
    expect(summary.stats.error).toBe(1);
  });
});
