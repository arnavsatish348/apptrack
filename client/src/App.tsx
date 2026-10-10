import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { ApplicationForm } from './components/ApplicationForm';
import { ApplicationTable } from './components/ApplicationTable';
import { StatsBar } from './components/StatsBar';
import { STATUSES, type Application, type NewApplication, type Stats, type Status } from './types';

export default function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([api.list({ status: statusFilter, q: query }), api.stats()]);
      setApplications(list);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(`Couldn't reach the API: ${(err as Error).message}`);
    }
  }, [statusFilter, query]);

  useEffect(() => { refresh(); }, [refresh]);

  async function create(a: Partial<NewApplication>) {
    await api.create(a);
    await refresh();
  }

  async function changeStatus(id: number, status: Status) {
    await api.updateStatus(id, status);
    await refresh();
  }

  async function remove(id: number) {
    await api.remove(id);
    await refresh();
  }

  return (
    <main>
      <header>
        <h1>AppTrack</h1>
        <p>Track every job application, its status history, and your response rate.</p>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      <StatsBar stats={stats} />
      <ApplicationForm onCreate={create} />
      <div className="filters">
        <input id="search" placeholder="Search company or role" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <ApplicationTable applications={applications} onStatusChange={changeStatus} onDelete={remove} />
    </main>
  );
}
