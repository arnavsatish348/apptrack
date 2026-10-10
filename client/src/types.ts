export const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted'] as const;
export type Status = (typeof STATUSES)[number];
export type Track = 'full-stack' | 'data-analyst' | 'internship' | 'other';

export interface Application {
  id: number;
  company: string;
  role: string;
  track: Track;
  location: string | null;
  work_setup: 'on-site' | 'hybrid' | 'remote' | null;
  job_url: string | null;
  status: Status;
  applied_on: string;
  notes: string | null;
}

export type NewApplication = Omit<Application, 'id'>;

export interface Stats {
  total: number;
  byStatus: Record<Status, number>;
  responseRate: number;
  interviewRate: number;
}
