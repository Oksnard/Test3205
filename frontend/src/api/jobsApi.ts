import axios from 'axios';
import type { CreateJobResponse, JobDetail, JobSummary } from '../types/job';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const jobsApi = {
  async createJob(urls: string[]): Promise<CreateJobResponse> {
    const { data } = await client.post<CreateJobResponse>('/jobs', { urls });
    return data;
  },

  async listJobs(): Promise<JobSummary[]> {
    const { data } = await client.get<JobSummary[]>('/jobs');
    return data;
  },

  async getJob(id: string): Promise<JobDetail> {
    const { data } = await client.get<JobDetail>(`/jobs/${id}`);
    return data;
  },

  async cancelJob(id: string): Promise<JobDetail> {
    const { data } = await client.delete<JobDetail>(`/jobs/${id}`);
    return data;
  },
};
