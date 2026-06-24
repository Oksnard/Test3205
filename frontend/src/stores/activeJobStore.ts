import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { jobsApi } from '../api/jobsApi';
import type { JobDetail, JobStatus } from '../types/job';
import { getErrorMessage } from '../utils/errors';

const TERMINAL_STATUSES: JobStatus[] = ['completed', 'cancelled', 'failed'];
const POLL_INTERVAL_MS = 1500;

export const useActiveJobStore = defineStore('activeJob', () => {
  const activeJobId = ref<string | null>(null);
  const jobDetail = ref<JobDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollGeneration = 0;

  const isTerminal = computed(() => {
    if (!jobDetail.value) {
      return false;
    }
    return TERMINAL_STATUSES.includes(jobDetail.value.status);
  });

  const processedCount = computed(() => {
    if (!jobDetail.value) {
      return 0;
    }
    return jobDetail.value.urls.filter((url) =>
      ['success', 'error', 'cancelled'].includes(url.status),
    ).length;
  });

  function stopPolling(): void {
    pollGeneration += 1;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function fetchJobDetail(jobId: string, generation: number): Promise<void> {
    try {
      const detail = await jobsApi.getJob(jobId);
      if (generation !== pollGeneration || activeJobId.value !== jobId) {
        return;
      }
      jobDetail.value = detail;
      error.value = null;

      if (TERMINAL_STATUSES.includes(detail.status)) {
        stopPolling();
      }
    } catch (err: unknown) {
      if (generation !== pollGeneration || activeJobId.value !== jobId) {
        return;
      }
      error.value = getErrorMessage(err, 'Не удалось загрузить задание');
    }
  }

  function startPolling(jobId: string): void {
    stopPolling();
    const generation = pollGeneration;

    void (async () => {
      loading.value = true;
      await fetchJobDetail(jobId, generation);
      loading.value = false;
    })();

    pollTimer = setInterval(() => {
      void fetchJobDetail(jobId, generation);
    }, POLL_INTERVAL_MS);
  }

  function setActiveJob(jobId: string): void {
    activeJobId.value = jobId;
    jobDetail.value = null;
    error.value = null;
    startPolling(jobId);
  }

  function clearActiveJob(): void {
    stopPolling();
    activeJobId.value = null;
    jobDetail.value = null;
    error.value = null;
  }

  async function cancelActiveJob(): Promise<void> {
    if (!activeJobId.value) {
      return;
    }

    const jobId = activeJobId.value;
    loading.value = true;
    error.value = null;

    try {
      const detail = await jobsApi.cancelJob(jobId);
      if (activeJobId.value === jobId) {
        jobDetail.value = detail;
        stopPolling();
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Не удалось отменить задание');
    } finally {
      loading.value = false;
    }
  }

  return {
    activeJobId,
    jobDetail,
    loading,
    error,
    isTerminal,
    processedCount,
    setActiveJob,
    clearActiveJob,
    cancelActiveJob,
    stopPolling,
  };
});
