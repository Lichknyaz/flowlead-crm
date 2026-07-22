import type { LeadStatus, Urgency } from '../types/lead'

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status status-${status.replace(' ', '-')}`}><i />{status}</span>
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <span className={`urgency urgency-${urgency.toLowerCase()}`}>{urgency}</span>
}
