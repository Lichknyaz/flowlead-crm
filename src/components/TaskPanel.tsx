import { BellRing, CalendarClock, Check, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeads } from '../context/LeadDataContext'
import { useOperations } from '../context/OperationsContext'
import type { TaskKind } from '../types/operations'

const localDateTimeValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const initialDueAt = () => {
  const value = new Date()
  value.setHours(value.getHours() + 2, 0, 0, 0)
  return localDateTimeValue(value)
}

const dueLabel = (value: string) => {
  const due = new Date(value)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const key = due.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const todayKey = today.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const tomorrowKey = tomorrow.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const time = due.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })
  if (key === todayKey) return `Today, ${time}`
  if (key === tomorrowKey) return `Tomorrow, ${time}`
  return due.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })
}

export function TaskPanel({ leadId, limit }: { leadId?: string; limit?: number }) {
  const { leads } = useLeads()
  const { tasks, addTask, toggleTask, error } = useOperations()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(leadId ?? leads[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<TaskKind>('follow-up')
  const [dueAt, setDueAt] = useState(initialDueAt)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selectedLead && leads[0]) setSelectedLead(leadId ?? leads[0].id)
  }, [leadId, leads, selectedLead])

  const visibleTasks = useMemo(() => {
    const matchingTasks = tasks
      .filter((task) => (!leadId || task.leadId === leadId) && !task.completed)
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt))

    return typeof limit === 'number' ? matchingTasks.slice(0, limit) : matchingTasks
  }, [leadId, limit, tasks])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedLead || title.trim().length < 3 || !dueAt) return
    setSaving(true)
    try {
      await addTask({
        leadId: selectedLead,
        title: title.trim(),
        dueAt: new Date(dueAt).toISOString(),
        kind,
      })
      setTitle('')
      setDueAt(initialDueAt())
      setFormOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel task-panel">
      <header>
        <div>
          <h2>{leadId ? 'Tasks & reminders' : 'Upcoming tasks'}</h2>
          <p>{leadId ? 'Next actions for this lead' : 'What needs attention next'}</p>
        </div>
        <button onClick={() => setFormOpen((current) => !current)}>
          {formOpen ? <X /> : <Plus />} {formOpen ? 'Close' : 'Add task'}
        </button>
      </header>
      {formOpen && (
        <form className="task-create-form" onSubmit={(event) => void submit(event)}>
          {!leadId && (
            <label>
              Lead
              <select
                value={selectedLead}
                onChange={(event) => setSelectedLead(event.target.value)}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.clientName} · {lead.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="task-title-field">
            Task
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Call client, send quote…"
              minLength={3}
              required
            />
          </label>
          <label>
            Type
            <select value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
              <option value="call">Call</option>
              <option value="follow-up">Follow-up</option>
              <option value="quote">Quote</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Due
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              required
            />
          </label>
          <button className="button button-primary button-small" disabled={saving}>
            <BellRing /> {saving ? 'Saving…' : 'Set reminder'}
          </button>
        </form>
      )}
      {error && <p className="operations-error">{error}</p>}
      <div className="task-list">
        {visibleTasks.map((task) => {
          const lead = leads.find((item) => item.id === task.leadId)
          const overdue = new Date(task.dueAt) < new Date()
          return (
            <div className={overdue ? 'overdue' : ''} key={task.id}>
              <button
                className="task-check"
                onClick={() => void toggleTask(task.id, true)}
                aria-label={`Complete ${task.title}`}
              >
                <Check />
              </button>
              <span>
                <strong>{task.title}</strong>
                <small>
                  <CalendarClock /> {dueLabel(task.dueAt)} · {task.kind}
                </small>
              </span>
              {!leadId && lead && <Link to={`/dashboard/leads/${lead.id}`}>{lead.clientName}</Link>}
            </div>
          )
        })}
        {visibleTasks.length === 0 && (
          <div className="tasks-empty">
            <Check />
            <span>
              <strong>No open tasks</strong>
              <small>Add a reminder to keep the lead moving.</small>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
