import { useState, type FormEvent } from 'react';
import type { NewApplication, Track } from '../types';

const empty = { company: '', role: '', track: 'full-stack' as Track, location: '', job_url: '' };

export function ApplicationForm({ onCreate }: { onCreate: (a: Partial<NewApplication>) => Promise<void> }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        ...form,
        location: form.location || null,
        job_url: form.job_url || null,
      });
      setForm(empty);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <form className="add-form" onSubmit={submit}>
      <input id="company" placeholder="Company" value={form.company} onChange={set('company')} required />
      <input id="role" placeholder="Role" value={form.role} onChange={set('role')} required />
      <select id="track" value={form.track} onChange={set('track')}>
        <option value="full-stack">Full-stack</option>
        <option value="data-analyst">Data analyst</option>
        <option value="internship">Internship</option>
        <option value="other">Other</option>
      </select>
      <input id="location" placeholder="Location" value={form.location} onChange={set('location')} />
      <input id="job_url" placeholder="Job link (https://...)" value={form.job_url} onChange={set('job_url')} />
      <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add application'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
