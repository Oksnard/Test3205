import { defineStore } from 'pinia';
import { ref } from 'vue';
import { jobsApi } from '../api/jobsApi';
import type { JobSummary } from '../types/job';
import { getErrorMessage } from '../utils/errors';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobSummary[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);
  const error = ref<string | null>(null);

  async function fetchJobs(silent = false): Promise<void> {
    if (silent) {
      refreshing.value = true;
    } else {
      loading.value = jobs.value.length === 0;
    }

    error.value = null;
    try {
      jobs.value = await jobsApi.listJobs();
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Не удалось загрузить список заданий');
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  return { jobs, loading, refreshing, error, fetchJobs };
});
