import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CircleCheckBig,
  Clock3,
  MessageSquareText,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LeadTable } from '../components/LeadTable'
import { MetricCard } from '../components/MetricCard'
import { useCrmUi } from '../context/CrmUiContext'
import { useLeads } from '../context/LeadDataContext'

type PipelinePeriod = 'week' | 'month' | 'all'

const pragueDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })

export function DashboardPage() {
  const { leads, dataMode, refreshLeads } = useLeads()
  const { openLeadModal } = useCrmUi()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<PipelinePeriod>('week')
  const count = (status: string) => leads.filter((lead) => lead.status === status).length
  const todayKey = pragueDate(new Date())
  const today = leads.filter((lead) => pragueDate(lead.createdAt) === todayKey).length
  const pipelineLeads = useMemo(() => {
    if (period === 'all') return leads
    const now = new Date()
    const start = new Date(now)
    if (period === 'week') {
      const daysFromMonday = (now.getDay() + 6) % 7
      start.setDate(now.getDate() - daysFromMonday)
    } else {
      start.setDate(1)
    }
    start.setHours(0, 0, 0, 0)
    return leads.filter((lead) => new Date(lead.createdAt) >= start)
  }, [leads, period])
  const pipelineCount = (status: string) =>
    pipelineLeads.filter((lead) => lead.status === status).length
  return (
    <>
      <div className="demo-banner">
        <span>
          <Sparkles size={17} />{' '}
          {dataMode === 'supabase'
            ? 'Live workspace is connected and synced with Supabase.'
            : "You're viewing a local demo workspace. Try updating a lead."}
        </span>
        <button onClick={openLeadModal}>
          Add a lead <ArrowRight size={16} />
        </button>
      </div>
      <section className="metrics-grid">
        <MetricCard
          label="Total leads"
          value={leads.length}
          icon={<Users />}
          tone="blue"
          note={
            <>
              <b className="up">
                <ArrowUpRight />
                12%
              </b>{' '}
              vs last week
            </>
          }
          onView={() => navigate('/dashboard/leads')}
          onRefresh={refreshLeads}
        />
        <MetricCard
          label="New today"
          value={today}
          icon={<Clock3 />}
          tone="cyan"
          note={
            <>
              <b className="up">
                <ArrowUpRight />
                {Math.max(1, today - 1)}
              </b>{' '}
              since yesterday
            </>
          }
          onView={() => navigate('/dashboard/leads?period=today')}
          onRefresh={refreshLeads}
        />
        <MetricCard
          label="Booked"
          value={count('booked')}
          icon={<CalendarCheck2 />}
          tone="violet"
          note={
            <>
              <b className="up">
                <ArrowUpRight />
                8%
              </b>{' '}
              conversion
            </>
          }
          onView={() => navigate('/dashboard/leads?status=booked')}
          onRefresh={refreshLeads}
        />
        <MetricCard
          label="Completed"
          value={count('completed')}
          icon={<CircleCheckBig />}
          tone="green"
          note={
            <>
              <b className="down">
                <ArrowDownRight />
                3%
              </b>{' '}
              vs last week
            </>
          }
          onView={() => navigate('/dashboard/leads?status=completed')}
          onRefresh={refreshLeads}
        />
        <MetricCard
          label="Urgent open"
          value={
            leads.filter(
              (lead) => lead.urgency === 'Urgent' && !['completed', 'lost'].includes(lead.status),
            ).length
          }
          icon={<AlertTriangle />}
          tone="amber"
          note={<>Needs attention</>}
          onView={() => navigate('/dashboard/leads?urgency=Urgent&open=1')}
          onRefresh={refreshLeads}
        />
      </section>
      <section className="dashboard-grid">
        <article className="panel recent-panel">
          <header>
            <div>
              <h2>Recent leads</h2>
              <p>Latest incoming service requests</p>
            </div>
            <Link to="/dashboard/leads">
              View all <ArrowRight size={16} />
            </Link>
          </header>
          <LeadTable leads={leads.slice(0, 5)} compact />
        </article>
        <article className="panel pipeline-panel">
          <header>
            <div>
              <h2>Pipeline</h2>
              <p>Lead distribution by status</p>
            </div>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as PipelinePeriod)}
              aria-label="Pipeline period"
            >
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
          </header>
          <div className="pipeline-total">
            <strong>{pipelineLeads.length}</strong>
            <span>active and closed leads</span>
          </div>
          <div className="pipeline-bars">
            {(['new', 'contacted', 'booked', 'in progress', 'completed'] as const).map((status) => {
              const value = pipelineCount(status)
              return (
                <div key={status}>
                  <span>
                    <i className={`bar-${status.replace(' ', '-')}`} />
                    {status}
                  </span>
                  <strong>{value}</strong>
                  <em
                    style={{
                      width: `${Math.max(7, (value / Math.max(1, pipelineLeads.length)) * 100)}%`,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </article>
      </section>
      <section className="lower-grid">
        <article className="panel quick-actions">
          <header>
            <div>
              <h2>Quick actions</h2>
              <p>Common workspace tasks</p>
            </div>
          </header>
          <div>
            <button onClick={openLeadModal}>
              <span className="action-icon blue">
                <Plus />
              </span>
              <span>
                <strong>Add a new lead</strong>
                <small>Create a request manually</small>
              </span>
              <ArrowRight />
            </button>
            <Link to="/dashboard/leads">
              <span className="action-icon green">
                <MessageSquareText />
              </span>
              <span>
                <strong>Review new requests</strong>
                <small>
                  {count('new')} lead{count('new') === 1 ? '' : 's'} waiting
                </small>
              </span>
              <ArrowRight />
            </Link>
            <Link to="/dashboard/automation">
              <span className="action-icon violet">
                <Sparkles />
              </span>
              <span>
                <strong>View automations</strong>
                <small>3 workflows active</small>
              </span>
              <ArrowRight />
            </Link>
          </div>
        </article>
        <article className="panel response-panel">
          <header>
            <div>
              <h2>Response health</h2>
              <p>How quickly the team responds</p>
            </div>
          </header>
          <div className="response-gauge">
            <div>
              <strong>94%</strong>
              <span>within target</span>
            </div>
          </div>
          <div className="response-stats">
            <span>
              <small>Average first response</small>
              <strong>18 min</strong>
            </span>
            <span>
              <small>Target</small>
              <strong>&lt; 30 min</strong>
            </span>
          </div>
        </article>
        <article className="panel activity-panel">
          <header>
            <div>
              <h2>Latest activity</h2>
              <p>Updates from your team</p>
            </div>
          </header>
          <ul>
            {leads.slice(0, 3).map((lead, index) => (
              <li key={lead.id}>
                <span className={`activity-dot tone-${index}`} />{' '}
                <p>
                  <strong>{lead.timeline.at(-1)?.label}</strong>
                  <small>
                    {lead.clientName} · {lead.timeline.at(-1)?.timestamp}
                  </small>
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}
