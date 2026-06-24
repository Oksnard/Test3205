<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import type { JobSummary } from '../types/job';
import { jobStatusLabels } from '../utils/statusLabels';
import AppLoader from './AppLoader.vue';

const jobsStore = useJobsStore();
const activeJobStore = useActiveJobStore();

onMounted(() => {
  void jobsStore.fetchJobs();
});

watch(
  () => activeJobStore.isTerminal,
  (isTerminal, wasTerminal) => {
    if (isTerminal && !wasTerminal) {
      void jobsStore.fetchJobs(true);
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
  <section class="card job-list-card">
    <div class="header-row">
      <h2>Задания</h2>
      <button
        type="button"
        class="btn-with-icon refresh-btn"
        :disabled="jobsStore.refreshing"
        data-testid="refresh-jobs"
        @click="jobsStore.fetchJobs(true)"
      >
        <span class="btn-with-icon__slot">
          <AppLoader v-show="jobsStore.refreshing" size="sm" />
        </span>
        <span>{{ jobsStore.refreshing ? 'Обновление...' : 'Обновить' }}</span>
      </button>
    </div>

    <p v-if="jobsStore.error" class="error">{{ jobsStore.error }}</p>

    <div
      class="panel-body"
      :class="{ 'is-dimmed': jobsStore.loading || jobsStore.refreshing }"
    >
      <div v-if="jobsStore.loading" class="panel-body__overlay">
        <AppLoader size="lg" label="Загрузка заданий..." />
      </div>
      <div
        v-else-if="jobsStore.refreshing"
        class="panel-body__overlay panel-body__overlay--inline"
      >
        <AppLoader size="md" label="Обновление..." />
      </div>

      <ul class="job-list" data-testid="job-list">
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
        <li v-if="jobsStore.jobs.length === 0 && !jobsStore.loading" class="empty">
          Заданий пока нет
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.job-list-card {
  min-height: 320px;
}

.refresh-btn {
  min-width: 132px;
}
</style>
