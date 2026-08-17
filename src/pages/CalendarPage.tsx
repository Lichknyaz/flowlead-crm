import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeads } from '../context/LeadDataContext'
import { useOperations } from '../context/OperationsContext'
import type { AppointmentStatus } from '../types/operations'

const dateKey = (value: Date) => value.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })

const localDateTimeValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const initialStart = () => {
  const value = new Date()
  value.setDate(value.getDate() + 1)
  value.setHours(9, 0, 0, 0)
  return localDateTimeValue(value)
}

export function CalendarPage() {
  const { leads } = useLeads()
  const { appointments, addAppointment, updateAppointmentStatus, error } = useOperations()
  const [month, setMonth] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [leadId, setLeadId] = useState(leads[0]?.id ?? '')
  const [title, setTitle] = useState('Service visit')
  const [startsAt, setStartsAt] = useState(initialStart)
  const [endsAt, setEndsAt] = useState(() => {
    const value = new Date(initialStart())
    value.setHours(value.getHours() + 2)
    return localDateTimeValue(value)
  })
  const [assignedUser, setAssignedUser] = useState('Unassigned')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!leadId && leads[0]) setLeadId(leads[0].id)
  }, [leadId, leads])

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const gridStart = new Date(first)
    const mondayOffset = (first.getDay() + 6) % 7
    gridStart.setDate(gridStart.getDate() - mondayOffset)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      return date
    })
  }, [month])

  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.status === 'scheduled' && new Date(appointment.endsAt) >= new Date(),
    )
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 6)

  const moveMonth = (offset: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!leadId || title.trim().length < 3 || new Date(endsAt) <= new Date(startsAt)) return
    setSaving(true)
    try {
      await addAppointment({
        leadId,
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        assignedUser,
        notes: notes.trim(),
      })
      setFormOpen(false)
      setNotes('')
      setMonth(new Date(startsAt))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="calendar-page">
      <div className="calendar-toolbar">
        <div>
          <button onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft />
          </button>
          <button onClick={() => setMonth(new Date())}>Today</button>
          <button onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight />
          </button>
          <strong>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong>
        </div>
        <button className="button button-primary button-small" onClick={() => setFormOpen(true)}>
          <Plus /> Schedule visit
        </button>
      </div>

      <div className="calendar-layout">
        <section className="panel month-calendar">
          <div className="calendar-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((day) => {
              const key = dateKey(day)
              const dayAppointments = appointments.filter(
                (appointment) =>
                  dateKey(new Date(appointment.startsAt)) === key &&
                  appointment.status !== 'cancelled',
              )
              return (
                <div
                  className={`${day.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === dateKey(new Date()) ? 'today' : ''}`}
                  key={key}
                >
                  <span>{day.getDate()}</span>
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const lead = leads.find((item) => item.id === appointment.leadId)
                    return (
                      <Link key={appointment.id} to={`/dashboard/leads/${appointment.leadId}`}>
                        <b>
                          {new Date(appointment.startsAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/Prague',
                          })}
                        </b>
                        {lead?.clientName ?? appointment.title}
                      </Link>
                    )
                  })}
                  {dayAppointments.length > 3 && <small>+{dayAppointments.length - 3} more</small>}
                </div>
              )
            })}
          </div>
        </section>

        <aside className="panel upcoming-visits">
          <header>
            <div>
              <h2>Upcoming visits</h2>
              <p>Next scheduled jobs</p>
            </div>
          </header>
          <div>
            {upcoming.map((appointment) => {
              const lead = leads.find((item) => item.id === appointment.leadId)
              return (
                <article key={appointment.id}>
                  <time>
                    <strong>
                      {new Date(appointment.startsAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                      })}
                    </strong>
                    <small>
                      {new Date(appointment.startsAt).toLocaleDateString('en-GB', {
                        month: 'short',
                      })}
                    </small>
                  </time>
                  <span>
                    <strong>{appointment.title}</strong>
                    <small>
                      <Clock3 />{' '}
                      {new Date(appointment.startsAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Prague',
                      })}{' '}
                      · {appointment.assignedUser}
                    </small>
                    {lead && (
                      <small>
                        <MapPin /> {lead.location}
                      </small>
                    )}
                    {lead && <Link to={`/dashboard/leads/${lead.id}`}>{lead.clientName}</Link>}
                  </span>
                  <select
                    aria-label={`Status for ${appointment.title}`}
                    value={appointment.status}
                    onChange={(event) =>
                      void updateAppointmentStatus(
                        appointment.id,
                        event.target.value as AppointmentStatus,
                      )
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </article>
              )
            })}
            {upcoming.length === 0 && (
              <p className="calendar-empty">No upcoming visits scheduled.</p>
            )}
          </div>
        </aside>
      </div>

      {formOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false)
          }}
        >
          <section
            className="crm-modal appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-title"
          >
            <header>
              <div>
                <span className="modal-icon">
                  <CalendarDays />
                </span>
                <span>
                  <h2 id="appointment-title">Schedule a visit</h2>
                  <p>Add a job to the service calendar</p>
                </span>
              </div>
              <button onClick={() => setFormOpen(false)} aria-label="Close appointment">
                <X />
              </button>
            </header>
            <form onSubmit={(event) => void submit(event)}>
              <div className="crm-form-grid">
                <label>
                  Lead
                  <select
                    value={leadId}
                    onChange={(event) => {
                      setLeadId(event.target.value)
                      const lead = leads.find((item) => item.id === event.target.value)
                      if (lead) setAssignedUser(lead.assignedUser)
                    }}
                  >
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.clientName} · {lead.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Visit title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    minLength={3}
                    required
                  />
                </label>
                <label>
                  Starts
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Ends
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    min={startsAt}
                    required
                  />
                </label>
                <label>
                  Assigned to
                  <select
                    value={assignedUser}
                    onChange={(event) => setAssignedUser(event.target.value)}
                  >
                    <option>Unassigned</option>
                    <option>Jakub M.</option>
                    <option>Tomáš K.</option>
                    <option>Oleksandr M.</option>
                  </select>
                </label>
                <label className="full">
                  Notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Access details, tools, parking…"
                  />
                </label>
              </div>
              {error && <p className="access-error">{error}</p>}
              <footer>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button className="button button-primary button-small" disabled={saving}>
                  {saving ? 'Scheduling…' : 'Schedule visit'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
