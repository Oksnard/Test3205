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

export interface UrlCheckResult {
  url: string;
  status: UrlStatus;
  httpStatus: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

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

export interface JobDetail {
  id: string;
  createdAt: string;
  status: JobStatus;
  urls: UrlCheckResult[];
}

export interface JobEntity {
  id: string;
  createdAt: Date;
  status: JobStatus;
  urls: UrlCheckResult[];
  cancelled: boolean;
  abortController: AbortController;
}
