import { defineStore } from 'pinia';
import { ref } from 'vue';
import { jobsApi } from '../api/jobsApi';
import type { JobSummary } from '../types/job';
import { getErrorMessage } from '../utils/errors';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobSummary[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchJobs(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      jobs.value = await jobsApi.listJobs();
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Не удалось загрузить список заданий');
    } finally {
      loading.value = false;
    }
  }

  return { jobs, loading, error, fetchJobs };
});
