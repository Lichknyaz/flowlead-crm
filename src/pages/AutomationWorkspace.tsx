import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Check,
  Clock3,
  Mail,
  MessageCircle,
  Play,
  RefreshCw,
  Sparkles,
  Webhook,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useAutomations } from '../hooks/useAutomations'
import { useLeads } from '../context/LeadDataContext'
import type { AutomationAction, AutomationEventStatus } from '../types/automation'

const actionPresentation: Record<AutomationAction, { icon: typeof BellRing; tone: string }> = {
  in_app: { icon: BellRing, tone: 'blue' },
  telegram: { icon: MessageCircle, tone: 'violet' },
  email: { icon: Mail, tone: 'green' },
  owner_reminder: { icon: Clock3, tone: 'amber' },
}

const eventIcon = (status: AutomationEventStatus) => {
  if (status === 'success') return <Check />
  if (status === 'failed') return <AlertCircle />
  return <Clock3 />
}

const formatEventTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })

export function AutomationWorkspace() {
  const { dataMode } = useLeads()
  const {
    rules,
    events,
    runCounts,
    isLoading,
    busyRuleId,
    busyEventId,
    error,
    setRuleEnabled,
    testRule,
    retryEvent,
    runDueChecks,
  } = useAutomations()
  const [notice, setNotice] = useState('')
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [checkingDue, setCheckingDue] = useState(false)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const handleTest = async (id: string) => {
    try {
      const event = await testRule(id)
      showNotice(
        event.status === 'success'
          ? 'Test completed and added to the event log.'
          : 'Test recorded. External delivery requires a real request and integration secrets.',
      )
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : 'Unable to test this rule.')
    }
  }

  const handleDueChecks = async () => {
    setCheckingDue(true)
    try {
      const processed = await runDueChecks()
      showNotice(
        processed > 0
          ? `${processed} response reminder${processed === 1 ? '' : 's'} created.`
          : 'Due checks completed. No new reminders were needed.',
      )
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : 'Unable to run due checks.')
    } finally {
      setCheckingDue(false)
    }
  }

  const handleRetry = async (id: string) => {
    try {
      await retryEvent(id)
      showNotice('Telegram message delivered successfully.')
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : 'Unable to retry this delivery.')
    }
  }

  const visibleEvents = showAllEvents ? events : events.slice(0, 4)
  const activeCount = rules.filter((rule) => rule.enabled).length

  return (
    <>
      <div className="automation-hero">
        <div>
          <span className="eyebrow">
            <Sparkles /> SMART WORKFLOWS
          </span>
          <h2>
            Let routine follow-ups
            <br />
            run in the background.
          </h2>
          <p>
            {dataMode === 'supabase'
              ? 'Rules and run history are synchronized with your live Supabase workspace.'
              : 'Try the same rule controls and event history in a local demo workspace.'}
          </p>
        </div>
        <div className="automation-visual">
          <span>
            <Webhook />
          </span>
          <i>
            <ArrowRight />
          </i>
          <span>
            <Zap />
          </span>
          <i>
            <ArrowRight />
          </i>
          <span>
            <BellRing />
          </span>
        </div>
      </div>

      <div className="automation-heading">
        <div>
          <h2>Automation rules</h2>
          <p>
            {activeCount} of {rules.length} workflows are currently watching your pipeline.
          </p>
          {dataMode === 'supabase' && (
            <small className="automation-schedule-status">
              <Clock3 /> Scheduled checks run every 5 minutes. You can still run them manually.
            </small>
          )}
        </div>
        <button
          className="button button-primary button-small"
          onClick={handleDueChecks}
          disabled={checkingDue || isLoading}
        >
          <RefreshCw className={checkingDue ? 'spin' : ''} />
          {checkingDue ? 'Checking…' : 'Run checks now'}
        </button>
      </div>

      {error && (
        <div className="automation-error" role="alert">
          <AlertCircle />
          <span>
            <strong>Automation data is unavailable.</strong>
            {error}
          </span>
        </div>
      )}

      <section className="workflow-grid" aria-busy={isLoading}>
        {rules.map((rule) => {
          const presentation = actionPresentation[rule.actionType]
          const ActionIcon = presentation.icon
          const busy = busyRuleId === rule.id
          const runCount = runCounts.get(rule.id) ?? 0
          return (
            <article className="workflow-card" key={rule.id}>
              <div className="workflow-top">
                <span className={`workflow-icon ${presentation.tone}`}>
                  <ActionIcon />
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    aria-label={`Enable ${rule.title}`}
                    checked={rule.enabled}
                    disabled={busy}
                    onChange={(event) => {
                      void setRuleEnabled(rule.id, event.target.checked).catch((cause) => {
                        showNotice(
                          cause instanceof Error ? cause.message : 'Unable to update this rule.',
                        )
                      })
                    }}
                  />
                  <i />
                </label>
              </div>
              <h3>{rule.title}</h3>
              <p>{rule.description}</p>
              <div className="workflow-path">
                <span>
                  <small>WHEN</small>
                  <strong>{rule.triggerLabel}</strong>
                </span>
                <ArrowRight />
                <span>
                  <small>THEN</small>
                  <strong>{rule.actionLabel}</strong>
                </span>
              </div>
              <footer>
                <span className={rule.enabled ? 'healthy' : 'draft'}>
                  <i />
                  {busy ? 'Saving' : rule.enabled ? 'Running' : 'Paused'}
                </span>
                <small>
                  {rule.requiresIntegration && !rule.enabled
                    ? 'Setup required'
                    : `${runCount} ${runCount === 1 ? 'run' : 'runs'}`}
                </small>
                <button disabled={busy} onClick={() => void handleTest(rule.id)}>
                  <Play /> Test
                </button>
              </footer>
            </article>
          )
        })}
        {isLoading && rules.length === 0 && (
          <div className="automation-loading">
            <RefreshCw className="spin" /> Loading automation rules…
          </div>
        )}
      </section>

      <section className="automation-log panel">
        <header>
          <div>
            <h2>Recent automation events</h2>
            <p>Persistent execution history from tests and live CRM activity</p>
          </div>
          {events.length > 4 && (
            <button onClick={() => setShowAllEvents((current) => !current)}>
              {showAllEvents ? 'Show recent' : 'View all'}
            </button>
          )}
        </header>
        <div className="log-list">
          {visibleEvents.map((event) => (
            <span key={event.id}>
              <i className={`log-${event.status}`}>{eventIcon(event.status)}</i>
              <p>
                <strong>{event.title}</strong>
                <small>
                  {event.detail}
                  {event.isTest ? ' · Test run' : ''}
                </small>
                {event.errorMessage && <em>{event.errorMessage}</em>}
              </p>
              {event.status === 'failed' && event.leadId && (
                <button
                  className="log-retry"
                  disabled={busyEventId === event.id}
                  onClick={() => void handleRetry(event.id)}
                >
                  <RefreshCw className={busyEventId === event.id ? 'spin' : ''} />
                  {busyEventId === event.id ? 'Retrying…' : 'Retry'}
                </button>
              )}
              <time dateTime={event.createdAt}>{formatEventTime(event.createdAt)}</time>
            </span>
          ))}
          {!isLoading && visibleEvents.length === 0 && (
            <div className="automation-empty">
              <Zap />
              <strong>No automation runs yet</strong>
              <span>Enable a rule and use Test, or create a new lead.</span>
            </div>
          )}
        </div>
      </section>

      <p className="automation-note">
        <Zap />{' '}
        {dataMode === 'local'
          ? 'Demo switches and test events are saved in this browser.'
          : 'External delivery follows the saved rule state. Telegram attempts and errors are recorded above.'}
      </p>
      {notice && (
        <div className="automation-toast" role="status">
          {notice}
        </div>
      )}
    </>
  )
}
