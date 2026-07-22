import type { ReactNode } from 'react'

export function MetricCard({ label, value, icon, tone, note }: { label: string; value: number | string; icon: ReactNode; tone: string; note: ReactNode }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon ${tone}`}>{icon}</span><button aria-label={`More options for ${label}`}>•••</button></div><strong>{value}</strong><span>{label}</span><small>{note}</small></article>
}
