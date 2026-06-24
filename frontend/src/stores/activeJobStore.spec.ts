import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jobsApi } from '../api/jobsApi';
import { useActiveJobStore } from './activeJobStore';

vi.mock('../api/jobsApi', () => ({
  jobsApi: {
    getJob: vi.fn(),
    cancelJob: vi.fn(),
  },
}));

describe('activeJobStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('ignores stale poll responses after switching jobs', async () => {
    const store = useActiveJobStore();

    vi.mocked(jobsApi.getJob)
      .mockResolvedValueOnce({
        id: 'job-1',
        createdAt: new Date().toISOString(),
        status: 'in_progress',
        urls: [],
      })
      .mockResolvedValueOnce({
        id: 'job-2',
        createdAt: new Date().toISOString(),
        status: 'completed',
        urls: [],
      });

    store.setActiveJob('job-1');
    store.setActiveJob('job-2');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.jobDetail?.id).toBe('job-2');
  });

  it('stops polling for terminal statuses', async () => {
    const store = useActiveJobStore();

    vi.mocked(jobsApi.getJob).mockResolvedValue({
      id: 'job-1',
      createdAt: new Date().toISOString(),
      status: 'completed',
      urls: [],
    });

    store.setActiveJob('job-1');
    await new Promise((resolve) => setTimeout(resolve, 50));

    const callsAfterFirst = vi.mocked(jobsApi.getJob).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const callsAfterWait = vi.mocked(jobsApi.getJob).mock.calls.length;

    expect(callsAfterWait).toBe(callsAfterFirst);
  });
});
