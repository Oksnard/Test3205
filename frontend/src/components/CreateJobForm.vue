<script setup lang="ts">
import { ref } from 'vue';
import { jobsApi } from '../api/jobsApi';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import AppLoader from './AppLoader.vue';
import { getErrorMessage } from '../utils/errors';
import { parseUrls } from '../utils/parseUrls';

const urlsText = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

const jobsStore = useJobsStore();
const activeJobStore = useActiveJobStore();

async function submit(): Promise<void> {
  const urls = parseUrls(urlsText.value);
  if (urls.length === 0) {
    error.value = 'Введите хотя бы один URL (через запятую или с новой строки)';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const { jobId } = await jobsApi.createJob(urls);
    activeJobStore.setActiveJob(jobId);
    await jobsStore.fetchJobs(true);
    urlsText.value = '';
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Не удалось создать задание');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="card create-form">
    <h2>Создать задание</h2>
    <label for="urls">URL (через запятую или с новой строки)</label>
    <textarea
      id="urls"
      v-model="urlsText"
      rows="6"
      placeholder="https://example.com, https://httpbin.org/status/200"
      :disabled="submitting"
      data-testid="urls-input"
    />
    <button
      type="button"
      class="btn-with-icon submit-btn"
      :disabled="submitting"
      data-testid="create-job-btn"
      @click="submit"
    >
      <span class="btn-with-icon__slot">
        <AppLoader v-show="submitting" size="sm" />
      </span>
      <span>{{ submitting ? 'Запуск...' : 'Запустить проверку' }}</span>
    </button>
    <p v-if="error" class="error" data-testid="create-error">{{ error }}</p>
  </section>
</template>

<style scoped>
.submit-btn {
  min-width: 196px;
}
</style>
