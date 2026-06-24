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
  const cancelling = ref(false);
  const error = ref<string | null>(null);
  const detailsCache = ref<Record<string, JobDetail>>({});

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

  function cacheDetail(detail: JobDetail): void {
    detailsCache.value[detail.id] = detail;
    if (activeJobId.value === detail.id) {
      jobDetail.value = detail;
    }
  }

  async function fetchJobDetail(jobId: string, generation: number): Promise<void> {
    try {
      const detail = await jobsApi.getJob(jobId);
      if (generation !== pollGeneration || activeJobId.value !== jobId) {
        return;
      }
      cacheDetail(detail);
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
    const hasCache = jobId in detailsCache.value;

    loading.value = !hasCache;

    void fetchJobDetail(jobId, generation).finally(() => {
      if (generation === pollGeneration && activeJobId.value === jobId) {
        loading.value = false;
      }
    });

    pollTimer = setInterval(() => {
      void fetchJobDetail(jobId, generation);
    }, POLL_INTERVAL_MS);
  }

  function setActiveJob(jobId: string): void {
    if (activeJobId.value === jobId) {
      return;
    }

    activeJobId.value = jobId;
    error.value = null;
    jobDetail.value = detailsCache.value[jobId] ?? null;
    startPolling(jobId);
  }

  function clearActiveJob(): void {
    stopPolling();
    activeJobId.value = null;
    jobDetail.value = null;
    error.value = null;
    loading.value = false;
  }

  async function cancelActiveJob(): Promise<void> {
    if (!activeJobId.value || cancelling.value) {
      return;
    }

    const jobId = activeJobId.value;
    error.value = null;
    cancelling.value = true;

    try {
      const detail = await jobsApi.cancelJob(jobId);
      if (activeJobId.value === jobId) {
        cacheDetail(detail);
        stopPolling();
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Не удалось отменить задание');
    } finally {
      cancelling.value = false;
    }
  }

  return {
    activeJobId,
    jobDetail,
    loading,
    cancelling,
    error,
    isTerminal,
    processedCount,
    setActiveJob,
    clearActiveJob,
    cancelActiveJob,
    stopPolling,
  };
});
