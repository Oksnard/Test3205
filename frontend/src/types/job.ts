export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type UrlStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled';

export interface JobStats {
  success: number;
  error: number;
  pending: number;
  inProgress: number;
  cancelled: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  urlCount: number;
  stats: JobStats;
}

export interface UrlCheckResult {
  url: string;
  status: UrlStatus;
  httpStatus: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface JobDetail {
  id: string;
  createdAt: string;
  status: JobStatus;
  urls: UrlCheckResult[];
}

export interface CreateJobResponse {
  jobId: string;
}
