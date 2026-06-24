<script setup lang="ts">
import { ref } from 'vue';
import { jobsApi } from '../api/jobsApi';
import { useActiveJobStore } from '../stores/activeJobStore';
import { useJobsStore } from '../stores/jobsStore';
import { getErrorMessage } from '../utils/errors';

const urlsText = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

const jobsStore = useJobsStore();
const activeJobStore = useActiveJobStore();

function parseUrls(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function submit(): Promise<void> {
  const urls = parseUrls(urlsText.value);
  if (urls.length === 0) {
    error.value = 'Введите хотя бы один URL (каждый с новой строки)';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const { jobId } = await jobsApi.createJob(urls);
    activeJobStore.setActiveJob(jobId);
    await jobsStore.fetchJobs();
    urlsText.value = '';
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Не удалось создать задание');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="card">
    <h2>Создать задание</h2>
    <label for="urls">URL (по одному на строку)</label>
    <textarea
      id="urls"
      v-model="urlsText"
      rows="6"
      placeholder="https://example.com"
      data-testid="urls-input"
    />
    <button
      type="button"
      :disabled="submitting"
      data-testid="create-job-btn"
      @click="submit"
    >
      {{ submitting ? 'Запуск...' : 'Запустить проверку' }}
    </button>
    <p v-if="error" class="error" data-testid="create-error">{{ error }}</p>
  </section>
</template>
