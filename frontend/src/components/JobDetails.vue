<script setup lang="ts">
import { computed } from 'vue';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import type { JobStatus } from '../types/job';
import { jobStatusLabels, urlStatusLabels } from '../utils/statusLabels';
import AppLoader from './AppLoader.vue';

const activeJobStore = useActiveJobStore();
const jobsStore = useJobsStore();

const detail = computed(() => activeJobStore.jobDetail);

const progressText = computed(() => {
  if (!detail.value) {
    return '—';
  }
  return `${activeJobStore.processedCount} из ${detail.value.urls.length} обработано`;
});

const showOverlay = computed(
  () => activeJobStore.loading && !detail.value,
);

const showProgressSpinner = computed(
  () => detail.value && !activeJobStore.isTerminal,
);

function canCancel(status: JobStatus | undefined): boolean {
  return status === 'pending' || status === 'in_progress';
}

async function cancelJob(): Promise<void> {
  await activeJobStore.cancelActiveJob();
  await jobsStore.fetchJobs(true);
}
</script>

<template>
  <section class="card job-details" data-testid="job-details">
    <h2>Активное задание</h2>

    <p v-if="!activeJobStore.activeJobId" class="empty empty-state">
      Выберите задание или создайте новое
    </p>

    <div
      v-else
      class="panel-body panel-body--details"
      :class="{ 'is-dimmed': showOverlay || activeJobStore.cancelling }"
    >
      <div v-if="showOverlay" class="panel-body__overlay">
        <AppLoader size="lg" label="Загрузка деталей..." />
      </div>
      <div
        v-else-if="activeJobStore.cancelling"
        class="panel-body__overlay panel-body__overlay--inline"
      >
        <AppLoader size="md" label="Отмена..." />
      </div>

      <p v-if="activeJobStore.error" class="error">{{ activeJobStore.error }}</p>

      <div class="details-body">
        <div class="meta">
          <div><strong>ID:</strong> {{ detail?.id ?? '—' }}</div>
          <div>
            <strong>Статус:</strong>
            {{ detail ? jobStatusLabels[detail.status] : '—' }}
          </div>
          <div class="progress-row">
            <strong>Прогресс:</strong> {{ progressText }}
            <span class="progress-spinner-slot">
              <AppLoader v-show="showProgressSpinner" size="sm" />
            </span>
          </div>
        </div>

        <button
          v-if="detail && canCancel(detail.status)"
          type="button"
          class="btn-with-icon cancel-btn"
          :disabled="activeJobStore.cancelling"
          data-testid="cancel-job-btn"
          @click="cancelJob"
        >
          <span class="btn-with-icon__slot">
            <AppLoader v-show="activeJobStore.cancelling" size="sm" />
          </span>
          <span>{{ activeJobStore.cancelling ? 'Отмена...' : 'Отменить задание' }}</span>
        </button>

        <table v-if="detail" class="url-table" data-testid="url-table">
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
            <tr v-for="(url, index) in detail.urls" :key="`${detail.id}-${index}`">
              <td>{{ url.url }}</td>
              <td>{{ urlStatusLabels[url.status] }}</td>
              <td>{{ url.httpStatus ?? '—' }}</td>
              <td>{{ url.errorMessage ?? '—' }}</td>
              <td>{{ url.durationMs != null ? `${url.durationMs} ms` : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.job-details {
  min-height: 380px;
}

.empty-state {
  min-height: 320px;
  display: flex;
  align-items: center;
}

.cancel-btn {
  min-width: 168px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-spinner-slot :deep(.loader__spinner) {
  border-color: #e5e7eb;
  border-top-color: #2563eb;
}
</style>
