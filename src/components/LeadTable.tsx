import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge, UrgencyBadge } from './StatusBadge'
import type { Lead } from '../types/lead'

const relativeDate = (value: string) => {
  const date = new Date(value)
  const localDay = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  if (localDay === '2026-07-22') return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' })}`
  if (localDay === '2026-07-21') return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function LeadTable({ leads, compact = false }: { leads: Lead[]; compact?: boolean }) {
  const navigate = useNavigate()
  return <div className="table-wrap"><table className="lead-table"><thead><tr><th>Client</th><th>Service</th>{!compact && <th>Location</th>}<th>Status</th><th>Priority</th><th>Received</th><th /></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} onClick={() => navigate(`/dashboard/leads/${lead.id}`)}><td><div className="client-cell"><span className="client-avatar">{lead.clientName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><strong>{lead.clientName}</strong><small>{lead.id}</small></span></div></td><td><strong className="cell-primary">{lead.serviceType}</strong></td>{!compact && <td>{lead.location}</td>}<td><StatusBadge status={lead.status} /></td><td><UrgencyBadge urgency={lead.urgency} /></td><td>{relativeDate(lead.createdAt)}</td><td><button className="row-action"><MoreHorizontal size={18} /></button><ChevronRight className="mobile-row-arrow" size={18} /></td></tr>)}</tbody></table>{leads.length === 0 && <div className="empty-state">No leads match these filters.</div>}</div>
}
