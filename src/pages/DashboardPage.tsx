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
import { Link } from 'react-router-dom'
import { LeadTable } from '../components/LeadTable'
import { MetricCard } from '../components/MetricCard'
import { useLeads } from '../context/LeadDataContext'

export function DashboardPage() {
  const { leads } = useLeads()
  const count = (status: string) => leads.filter((lead) => lead.status === status).length
  const today = leads.filter((lead) => lead.createdAt.slice(0, 10) === '2026-07-22').length
  return (
    <>
      <div className="demo-banner">
        <span>
          <Sparkles size={17} /> You're viewing a live demo workspace. Try updating a lead.
        </span>
        <Link to="/request">
          Submit a test request <ArrowRight size={16} />
        </Link>
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
            <button>This week⌄</button>
          </header>
          <div className="pipeline-total">
            <strong>{leads.length}</strong>
            <span>active and closed leads</span>
          </div>
          <div className="pipeline-bars">
            {(['new', 'contacted', 'booked', 'in progress', 'completed'] as const).map((status) => {
              const value = count(status)
              return (
                <div key={status}>
                  <span>
                    <i className={`bar-${status.replace(' ', '-')}`} />
                    {status}
                  </span>
                  <strong>{value}</strong>
                  <em
                    style={{ width: `${Math.max(7, (value / Math.max(1, leads.length)) * 100)}%` }}
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
            <Link to="/request">
              <span className="action-icon blue">
                <Plus />
              </span>
              <span>
                <strong>Add a new lead</strong>
                <small>Create a request manually</small>
              </span>
              <ArrowRight />
            </Link>
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
