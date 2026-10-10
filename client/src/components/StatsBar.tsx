import type { Stats } from '../types';

export function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const items = [
    { label: 'Total', value: stats.total },
    { label: 'Interviews', value: stats.byStatus.interview },
    { label: 'Offers', value: stats.byStatus.offer },
    { label: 'Response rate', value: `${stats.responseRate}%` },
    { label: 'Interview rate', value: `${stats.interviewRate}%` },
  ];
  return (
    <section className="stats" aria-label="Summary">
      {items.map((i) => (
        <div key={i.label} className="stat">
          <span className="stat-value">{i.value}</span>
          <span className="stat-label">{i.label}</span>
        </div>
      ))}
    </section>
  );
}
