import { CalendarDays, GripVertical, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../context/LeadDataContext'
import { leadStatuses, type Lead, type LeadStatus } from '../types/lead'
import { UrgencyBadge } from './StatusBadge'

const statusTitles: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  booked: 'Booked',
  'in progress': 'In progress',
  completed: 'Completed',
  lost: 'Lost',
}

const receivedLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Prague',
  })

export function LeadKanban({ leads }: { leads: Lead[] }) {
  const { updateLead, error } = useLeads()
  const navigate = useNavigate()
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null)
  const [updatingLead, setUpdatingLead] = useState<string | null>(null)

  const moveLead = async (lead: Lead, status: LeadStatus) => {
    if (lead.status === status || updatingLead) return
    setUpdatingLead(lead.id)
    try {
      await updateLead(lead.id, { status })
    } catch {
      // The shared context preserves the previous card and exposes the error below.
    } finally {
      setUpdatingLead(null)
      setDraggedLead(null)
      setDropTarget(null)
    }
  }

  const droppedLead = draggedLead ? leads.find((lead) => lead.id === draggedLead) : undefined

  return (
    <div className="kanban-area">
      {error && <p className="kanban-error">{error}</p>}
      <div className="kanban-board">
        {leadStatuses.map((status) => {
          const columnLeads = leads.filter((lead) => lead.status === status)
          return (
            <section
              className={`kanban-column status-${status.replace(' ', '-')} ${dropTarget === status ? 'drop-target' : ''}`}
              key={status}
              onDragOver={(event) => {
                event.preventDefault()
                setDropTarget(status)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (droppedLead) void moveLead(droppedLead, status)
              }}
            >
              <header>
                <span>
                  <i /> {statusTitles[status]}
                </span>
                <strong>{columnLeads.length}</strong>
              </header>
              <div className="kanban-cards">
                {columnLeads.map((lead) => (
                  <article
                    className={`kanban-card ${updatingLead === lead.id ? 'updating' : ''}`}
                    key={lead.id}
                    draggable={updatingLead !== lead.id}
                    tabIndex={0}
                    role="link"
                    onDragStart={() => setDraggedLead(lead.id)}
                    onDragEnd={() => {
                      setDraggedLead(null)
                      setDropTarget(null)
                    }}
                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/dashboard/leads/${lead.id}`)
                    }}
                  >
                    <div className="kanban-card-top">
                      <small>{lead.id}</small>
                      <GripVertical />
                    </div>
                    <h3>{lead.clientName}</h3>
                    <p>{lead.serviceType}</p>
                    <span className="kanban-location">
                      <MapPin /> {lead.location}
                    </span>
                    <div className="kanban-card-meta">
                      <UrgencyBadge urgency={lead.urgency} />
                      <span>
                        <CalendarDays /> {receivedLabel(lead.createdAt)}
                      </span>
                    </div>
                    <div className="kanban-card-footer">
                      <span className="client-avatar">
                        {lead.clientName
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <select
                        aria-label={`Move ${lead.clientName}`}
                        value={lead.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation()
                          void moveLead(lead, event.target.value as LeadStatus)
                        }}
                      >
                        {leadStatuses.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
                {columnLeads.length === 0 && <div className="kanban-empty">Drop a lead here</div>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
