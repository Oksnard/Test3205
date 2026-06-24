import type { JobStatus, UrlStatus } from '../types/job';

export const jobStatusLabels: Record<JobStatus, string> = {
  pending: 'Ожидание',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено',
  failed: 'Ошибка',
};

export const urlStatusLabels: Record<UrlStatus, string> = {
  pending: 'Ожидание',
  in_progress: 'В работе',
  success: 'Успех',
  error: 'Ошибка',
  cancelled: 'Отменено',
};
