<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import type { JobSummary } from '../types/job';
import { jobStatusLabels } from '../utils/statusLabels';

const jobsStore = useJobsStore();
const activeJobStore = useActiveJobStore();

onMounted(() => {
  void jobsStore.fetchJobs();
});

watch(
  () => activeJobStore.jobDetail,
  (detail) => {
    if (detail && activeJobStore.isTerminal) {
      void jobsStore.fetchJobs();
    }
  },
);

function selectJob(job: JobSummary): void {
  activeJobStore.setActiveJob(job.id);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU');
}
</script>

<template>
  <section class="card">
    <div class="header-row">
      <h2>Задания</h2>
      <button type="button" data-testid="refresh-jobs" @click="jobsStore.fetchJobs()">
        Обновить
      </button>
    </div>

    <p v-if="jobsStore.loading">Загрузка...</p>
    <p v-else-if="jobsStore.error" class="error">{{ jobsStore.error }}</p>

    <ul v-else class="job-list" data-testid="job-list">
      <li
        v-for="job in jobsStore.jobs"
        :key="job.id"
        :class="{ active: job.id === activeJobStore.activeJobId }"
        data-testid="job-item"
        @click="selectJob(job)"
      >
        <div class="job-id">{{ job.id }}</div>
        <div>{{ formatDate(job.createdAt) }}</div>
        <div>{{ jobStatusLabels[job.status] }}</div>
        <div>
          {{ job.stats.success }} ok / {{ job.stats.error }} err /
          {{ job.urlCount }} всего
        </div>
      </li>
      <li v-if="jobsStore.jobs.length === 0" class="empty">Заданий пока нет</li>
    </ul>
  </section>
</template>
