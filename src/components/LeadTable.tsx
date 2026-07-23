import { CheckCircle2, ChevronRight, Eye, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge, UrgencyBadge } from './StatusBadge'
import type { Lead } from '../types/lead'
import { useLeads } from '../context/LeadDataContext'

const relativeDate = (value: string) => {
  const date = new Date(value)
  const localDay = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  if (localDay === '2026-07-22')
    return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' })}`
  if (localDay === '2026-07-21') return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function LeadTable({ leads, compact = false }: { leads: Lead[]; compact?: boolean }) {
  const navigate = useNavigate()
  const { updateLead } = useLeads()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const changeStatus = async (lead: Lead, status: 'contacted' | 'completed') => {
    setUpdating(lead.id)
    try {
      await updateLead(lead.id, { status })
      setActiveMenu(null)
    } catch {
      // The shared lead context exposes the actionable error in the CRM UI.
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Service</th>
            {!compact && <th>Location</th>}
            <th>Status</th>
            <th>Priority</th>
            <th>Received</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
              <td>
                <div className="client-cell">
                  <span className="client-avatar">
                    {lead.clientName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span>
                    <strong>{lead.clientName}</strong>
                    <small>{lead.id}</small>
                  </span>
                </div>
              </td>
              <td>
                <strong className="cell-primary">{lead.serviceType}</strong>
              </td>
              {!compact && <td>{lead.location}</td>}
              <td>
                <StatusBadge status={lead.status} />
              </td>
              <td>
                <UrgencyBadge urgency={lead.urgency} />
              </td>
              <td>{relativeDate(lead.createdAt)}</td>
              <td>
                <div className="row-action-wrap">
                  <button
                    className="row-action"
                    aria-label={`Actions for ${lead.clientName}`}
                    aria-expanded={activeMenu === lead.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveMenu((current) => (current === lead.id ? null : lead.id))
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenu === lead.id && (
                    <div className="row-action-menu" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
                        <Eye /> Open details
                      </button>
                      {lead.status === 'new' && (
                        <button
                          onClick={() => void changeStatus(lead, 'contacted')}
                          disabled={updating === lead.id}
                        >
                          <MessageCircle /> Mark contacted
                        </button>
                      )}
                      {!['completed', 'lost'].includes(lead.status) && (
                        <button
                          onClick={() => void changeStatus(lead, 'completed')}
                          disabled={updating === lead.id}
                        >
                          <CheckCircle2 /> Mark completed
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="mobile-row-arrow" size={18} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && <div className="empty-state">No leads match these filters.</div>}
    </div>
  )
}
