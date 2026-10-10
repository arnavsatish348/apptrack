import type { Application, NewApplication, Stats, Status } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) {
    const detail = body.details?.map((d: { message: string }) => d.message).join(', ');
    throw new Error(detail || body.error || 'Request failed');
  }
  return body as T;
}

export const api = {
  list: (params: { status?: string; q?: string }) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return request<Application[]>(`/applications?${qs}`);
  },
  stats: () => request<Stats>('/applications/stats'),
  create: (app: Partial<NewApplication>) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(app) }),
  updateStatus: (id: number, status: Status) =>
    request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id: number) => request<void>(`/applications/${id}`, { method: 'DELETE' }),
};
