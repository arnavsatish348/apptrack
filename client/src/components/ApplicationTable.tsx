import { STATUSES, type Application, type Status } from '../types';

interface Props {
  applications: Application[];
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
}

export function ApplicationTable({ applications, onStatusChange, onDelete }: Props) {
  if (!applications.length) {
    return <p className="empty">No applications yet. Add your first one above.</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Company</th><th>Role</th><th>Track</th><th>Applied</th><th>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{a.job_url ? <a href={a.job_url} target="_blank" rel="noreferrer">{a.company}</a> : a.company}</td>
              <td>{a.role}</td>
              <td>{a.track}</td>
              <td>{a.applied_on.slice(0, 10)}</td>
              <td>
                <select
                  aria-label={`Status for ${a.company}`}
                  className={`status status-${a.status}`}
                  value={a.status}
                  onChange={(e) => onStatusChange(a.id, e.target.value as Status)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td><button className="link" onClick={() => onDelete(a.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
