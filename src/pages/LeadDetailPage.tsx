import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge'
import { useLeads } from '../context/LeadDataContext'
import { leadStatuses, type LeadStatus, type Urgency } from '../types/lead'

export function LeadDetailPage() {
  const { id } = useParams()
  const { leads, updateLead, error } = useLeads()
  const lead = leads.find((item) => item.id === id)
  const [note, setNote] = useState(lead?.notes ?? '')
  const [saved, setSaved] = useState(false)
  const [summary, setSummary] = useState(false)
  useEffect(() => setNote(lead?.notes ?? ''), [lead?.notes])
  if (!lead)
    return (
      <div className="not-found">
        <h2>Lead not found</h2>
        <Link to="/dashboard/leads">Return to leads</Link>
      </div>
    )
  const saveNote = async () => {
    try {
      await updateLead(lead.id, { notes: note })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      setSaved(false)
    }
  }
  return (
    <>
      {error && (
        <p className="form-submit-error" role="alert">
          {error}
        </p>
      )}
      <div className="detail-top">
        <Link to="/dashboard/leads">
          <ArrowLeft /> Back to leads
        </Link>
        <div>
          <button className="button button-secondary button-small">
            <Mail /> Email client
          </button>
          <button className="button button-secondary button-small">
            <Phone /> Call
          </button>
        </div>
      </div>
      <section className="lead-summary-card">
        <div className="lead-identity">
          <span className="large-avatar">
            {lead.clientName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </span>
          <div>
            <span>
              <StatusBadge status={lead.status} /> <UrgencyBadge urgency={lead.urgency} />
            </span>
            <h2>{lead.clientName}</h2>
            <p>
              {lead.id} · Received{' '}
              {new Date(lead.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="detail-controls">
          <label>
            Status
            <select
              value={lead.status}
              onChange={(e) =>
                void updateLead(lead.id, { status: e.target.value as LeadStatus }).catch(
                  () => undefined,
                )
              }
            >
              {leadStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Assigned to
            <select
              value={lead.assignedUser}
              onChange={(e) =>
                void updateLead(lead.id, { assignedUser: e.target.value }).catch(() => undefined)
              }
            >
              <option>Unassigned</option>
              <option>Jakub M.</option>
              <option>Tomáš K.</option>
              <option>Oleksandr M.</option>
            </select>
          </label>
        </div>
      </section>
      <div className="detail-grid">
        <div className="detail-primary">
          <section className="panel detail-section">
            <header>
              <div>
                <h2>Request details</h2>
                <p>Information submitted by the client</p>
              </div>
            </header>
            <div className="detail-fields">
              <span>
                <Wrench />
                <small>Service</small>
                <strong>{lead.serviceType}</strong>
              </span>
              <span>
                <Clock3 />
                <small>Urgency</small>
                <strong>
                  <select
                    className="inline-select"
                    value={lead.urgency}
                    onChange={(e) =>
                      void updateLead(lead.id, { urgency: e.target.value as Urgency }).catch(
                        () => undefined,
                      )
                    }
                  >
                    <option>Standard</option>
                    <option>Soon</option>
                    <option>Urgent</option>
                  </select>
                </strong>
              </span>
              <span>
                <CalendarDays />
                <small>Preferred date</small>
                <strong>{lead.preferredDate || 'Flexible'}</strong>
              </span>
              <span>
                <MapPin />
                <small>Location</small>
                <strong>{lead.location}</strong>
              </span>
            </div>
            <div className="message-box">
              <small>Problem description</small>
              <p>{lead.message}</p>
            </div>
          </section>
          <section className="panel notes-section">
            <header>
              <div>
                <h2>Internal notes</h2>
                <p>Visible only to your service team</p>
              </div>
            </header>
            <textarea
              rows={5}
              placeholder="Add useful context, call notes or access information..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div>
              <small>{note.length} characters</small>
              <button
                className="button button-primary button-small"
                onClick={() => void saveNote()}
              >
                {saved ? (
                  <>
                    <Check /> Saved
                  </>
                ) : (
                  <>
                    <Save /> Save note
                  </>
                )}
              </button>
            </div>
          </section>
          <section className="panel contact-section">
            <header>
              <div>
                <h2>Client contact</h2>
                <p>Reach out directly</p>
              </div>
            </header>
            <div>
              <a href={`tel:${lead.phone}`}>
                <Phone />
                <span>
                  <small>Phone</small>
                  <strong>{lead.phone || 'Not provided'}</strong>
                </span>
              </a>
              <a href={`mailto:${lead.email}`}>
                <Mail />
                <span>
                  <small>Email</small>
                  <strong>{lead.email || 'Not provided'}</strong>
                </span>
              </a>
            </div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel ai-card">
            <span className="ai-label">
              <Sparkles /> AI ASSIST
            </span>
            <h3>Lead summary</h3>
            {summary ? (
              <div className="generated-summary">
                <p>
                  <strong>
                    {lead.urgency} {lead.serviceType.toLowerCase()}
                  </strong>{' '}
                  requested by {lead.clientName} in {lead.location}. Preferred date:{' '}
                  {lead.preferredDate || 'flexible'}.
                </p>
                <span>
                  <Check /> Demo summary generated
                </span>
              </div>
            ) : (
              <>
                <p>Turn the request into a concise briefing for the assigned technician.</p>
                <button onClick={() => setSummary(true)}>
                  <Bot /> Generate summary
                </button>
              </>
            )}
          </section>
          <section className="panel timeline-card">
            <header>
              <div>
                <h2>Activity</h2>
                <p>Request timeline</p>
              </div>
            </header>
            <ol>
              {[...lead.timeline].reverse().map((item) => (
                <li key={item.id}>
                  <i className={`event-${item.tone}`} />
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                    <small>{item.timestamp}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel owner-card">
            <UserRound />
            <div>
              <small>Assigned technician</small>
              <strong>{lead.assignedUser}</strong>
              <p>
                {lead.assignedUser === 'Unassigned'
                  ? 'Assign this lead to start work.'
                  : 'Available today until 18:00'}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
