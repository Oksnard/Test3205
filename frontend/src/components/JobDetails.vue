<script setup lang="ts">
import { computed } from 'vue';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import type { JobStatus } from '../types/job';
import { jobStatusLabels, urlStatusLabels } from '../utils/statusLabels';

const activeJobStore = useActiveJobStore();
const jobsStore = useJobsStore();

const progressText = computed(() => {
  const detail = activeJobStore.jobDetail;
  if (!detail) {
    return '';
  }
  return `${activeJobStore.processedCount} из ${detail.urls.length} обработано`;
});

function canCancel(status: JobStatus | undefined): boolean {
  return status === 'pending' || status === 'in_progress';
}

async function cancelJob(): Promise<void> {
  await activeJobStore.cancelActiveJob();
  await jobsStore.fetchJobs();
}
</script>

<template>
  <section class="card" data-testid="job-details">
    <h2>Активное задание</h2>

    <p v-if="!activeJobStore.activeJobId" class="empty">
      Выберите задание или создайте новое
    </p>

    <template v-else>
      <p v-if="activeJobStore.loading && !activeJobStore.jobDetail">Загрузка...</p>
      <p v-if="activeJobStore.error" class="error">{{ activeJobStore.error }}</p>

      <template v-if="activeJobStore.jobDetail">
        <div class="meta">
          <div><strong>ID:</strong> {{ activeJobStore.jobDetail.id }}</div>
          <div>
            <strong>Статус:</strong>
            {{ jobStatusLabels[activeJobStore.jobDetail.status] }}
          </div>
          <div><strong>Прогресс:</strong> {{ progressText }}</div>
        </div>

        <button
          v-if="canCancel(activeJobStore.jobDetail.status)"
          type="button"
          data-testid="cancel-job-btn"
          @click="cancelJob"
        >
          Отменить задание
        </button>

        <table class="url-table" data-testid="url-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Статус</th>
              <th>HTTP</th>
              <th>Ошибка</th>
              <th>Длительность</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="url in activeJobStore.jobDetail.urls" :key="url.url">
              <td>{{ url.url }}</td>
              <td>{{ urlStatusLabels[url.status] }}</td>
              <td>{{ url.httpStatus ?? '—' }}</td>
              <td>{{ url.errorMessage ?? '—' }}</td>
              <td>{{ url.durationMs != null ? `${url.durationMs} ms` : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>
  </section>
</template>
