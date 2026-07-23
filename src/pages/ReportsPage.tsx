import { AlertTriangle, CheckCircle2, Download, Target, TrendingUp, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLeads } from '../context/LeadDataContext'
import { leadStatuses, type Lead, type LeadStatus, type Urgency } from '../types/lead'

type ReportPeriod = '7' | '30' | '90' | 'all'

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  booked: 'Booked',
  'in progress': 'In progress',
  completed: 'Completed',
  lost: 'Lost',
}

const urgencyColors: Record<Urgency, string> = {
  Standard: '#2e90fa',
  Soon: '#f79009',
  Urgent: '#f04438',
}

const pragueDateKey = (value: Date) =>
  value.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

const createReportCsvHref = (leads: Lead[], label: string) => {
  const completed = leads.filter((lead) => lead.status === 'completed').length
  const closed = leads.filter((lead) => ['completed', 'lost'].includes(lead.status)).length
  const summary = [
    ['FlowLead CRM report', label],
    ['Generated', new Date().toISOString()],
    ['Total leads', leads.length],
    ['Active leads', leads.filter((lead) => !['completed', 'lost'].includes(lead.status)).length],
    ['Completed jobs', completed],
    ['Win rate', closed ? `${Math.round((completed / closed) * 100)}%` : '0%'],
    [],
  ]
  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.clientName,
    lead.serviceType,
    lead.urgency,
    lead.status,
    lead.assignedUser,
    lead.location,
  ])
  const csv = [
    ...summary,
    ['Reference', 'Created', 'Client', 'Service', 'Urgency', 'Status', 'Assigned to', 'Location'],
    ...rows,
  ]
    .map((row) => row.map((value) => csvCell(value ?? '')).join(','))
    .join('\n')
  return `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(csv)}`
}

export function ReportsPage() {
  const { leads } = useLeads()
  const [period, setPeriod] = useState<ReportPeriod>('30')

  const periodLabel = period === 'all' ? 'All time' : `Last ${period} days`

  const filtered = useMemo(() => {
    if (period === 'all') return leads
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(period) + 1)
    const cutoffKey = pragueDateKey(cutoff)
    return leads.filter((lead) => pragueDateKey(new Date(lead.createdAt)) >= cutoffKey)
  }, [leads, period])

  const report = useMemo(() => {
    const statusCounts = Object.fromEntries(
      leadStatuses.map((status) => [
        status,
        filtered.filter((lead) => lead.status === status).length,
      ]),
    ) as Record<LeadStatus, number>
    const completed = statusCounts.completed
    const closed = completed + statusCounts.lost
    const active = filtered.length - closed
    const urgent = filtered.filter((lead) => lead.urgency === 'Urgent').length
    const unassigned = filtered.filter((lead) => lead.assignedUser === 'Unassigned').length

    const services = [...new Set(filtered.map((lead) => lead.serviceType))]
      .map((name) => {
        const matching = filtered.filter((lead) => lead.serviceType === name)
        return {
          name,
          total: matching.length,
          active: matching.filter((lead) => !['completed', 'lost'].includes(lead.status)).length,
          completed: matching.filter((lead) => lead.status === 'completed').length,
        }
      })
      .sort((left, right) => right.total - left.total)

    const urgency = (['Standard', 'Soon', 'Urgent'] as Urgency[]).map((name) => ({
      name,
      count: filtered.filter((lead) => lead.urgency === name).length,
    }))

    const team = [...new Set(filtered.map((lead) => lead.assignedUser))]
      .map((name) => {
        const matching = filtered.filter((lead) => lead.assignedUser === name)
        return {
          name,
          total: matching.length,
          open: matching.filter((lead) => !['completed', 'lost'].includes(lead.status)).length,
        }
      })
      .sort((left, right) => right.total - left.total)

    const chartDays = period === '7' ? 7 : period === 'all' ? 14 : 14
    const today = new Date()
    const daily = Array.from({ length: chartDays }, (_, index) => {
      const day = new Date(today)
      day.setDate(day.getDate() - (chartDays - index - 1))
      const key = pragueDateKey(day)
      return {
        key,
        label: day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        count: filtered.filter((lead) => pragueDateKey(new Date(lead.createdAt)) === key).length,
      }
    })

    return {
      statusCounts,
      completed,
      closed,
      active,
      urgent,
      unassigned,
      services,
      urgency,
      team,
      daily,
      winRate: closed ? Math.round((completed / closed) * 100) : 0,
    }
  }, [filtered, period])

  const maxDaily = Math.max(1, ...report.daily.map((day) => day.count))
  const maxService = Math.max(1, ...report.services.map((service) => service.total))
  const standardShare = filtered.length
    ? (report.urgency.find((item) => item.name === 'Standard')!.count / filtered.length) * 100
    : 0
  const soonShare = filtered.length
    ? (report.urgency.find((item) => item.name === 'Soon')!.count / filtered.length) * 100
    : 0

  return (
    <div className="reports-page">
      <div className="reports-toolbar">
        <div>
          <strong>Performance overview</strong>
          <span>Updated from the current CRM workspace</span>
        </div>
        <div>
          <label>
            Period
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <a
            className="button button-secondary button-small"
            href={createReportCsvHref(filtered, periodLabel)}
            download="flowlead-report.csv"
          >
            <Download /> Export report
          </a>
        </div>
      </div>

      <section className="report-kpis">
        <article>
          <span className="report-icon blue">
            <TrendingUp />
          </span>
          <small>Total leads</small>
          <strong>{filtered.length}</strong>
          <p>{report.active} currently active</p>
        </article>
        <article>
          <span className="report-icon green">
            <Target />
          </span>
          <small>Win rate</small>
          <strong>{report.winRate}%</strong>
          <p>
            {report.completed} of {report.closed} closed leads won
          </p>
        </article>
        <article>
          <span className="report-icon amber">
            <AlertTriangle />
          </span>
          <small>Urgent requests</small>
          <strong>{report.urgent}</strong>
          <p>
            {filtered.length ? Math.round((report.urgent / filtered.length) * 100) : 0}% of intake
          </p>
        </article>
        <article>
          <span className="report-icon purple">
            <Users />
          </span>
          <small>Unassigned</small>
          <strong>{report.unassigned}</strong>
          <p>{report.unassigned ? 'Needs team attention' : 'All leads covered'}</p>
        </article>
      </section>

      <div className="reports-grid">
        <section className="panel report-trend">
          <header>
            <div>
              <h2>Lead intake</h2>
              <p>New requests received by day</p>
            </div>
            <span>{periodLabel}</span>
          </header>
          <div className="trend-chart" aria-label="Lead intake chart">
            {report.daily.map((day, index) => (
              <div className="trend-day" key={day.key}>
                <div className="trend-value">
                  <i style={{ height: `${Math.max(4, (day.count / maxDaily) * 100)}%` }} />
                  {day.count > 0 && <b>{day.count}</b>}
                </div>
                {(index === 0 || index === report.daily.length - 1 || index % 3 === 0) && (
                  <small>{day.label}</small>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel report-funnel">
          <header>
            <div>
              <h2>Pipeline distribution</h2>
              <p>Current lead status breakdown</p>
            </div>
          </header>
          <div className="funnel-list">
            {leadStatuses.map((status) => {
              const count = report.statusCounts[status]
              return (
                <div key={status}>
                  <span>
                    <i className={`status-dot status-${status.replace(' ', '-')}`} />
                    {statusLabels[status]}
                  </span>
                  <div>
                    <i
                      style={{ width: `${filtered.length ? (count / filtered.length) * 100 : 0}%` }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel report-services">
          <header>
            <div>
              <h2>Service demand</h2>
              <p>Requests and outcomes by service</p>
            </div>
          </header>
          <div className="service-report-table">
            <div className="service-report-head">
              <span>Service</span>
              <span>Total</span>
              <span>Open</span>
              <span>Won</span>
            </div>
            {report.services.map((service) => (
              <div className="service-report-row" key={service.name}>
                <span>
                  <strong>{service.name}</strong>
                  <i>
                    <b style={{ width: `${(service.total / maxService) * 100}%` }} />
                  </i>
                </span>
                <span>{service.total}</span>
                <span>{service.active}</span>
                <span className="won-cell">{service.completed}</span>
              </div>
            ))}
            {report.services.length === 0 && (
              <p className="report-empty">No leads in this period.</p>
            )}
          </div>
        </section>

        <section className="panel report-urgency">
          <header>
            <div>
              <h2>Priority mix</h2>
              <p>Workload by request urgency</p>
            </div>
          </header>
          <div className="urgency-report-body">
            <div
              className="urgency-donut"
              style={{
                background: `conic-gradient(
                  ${urgencyColors.Standard} 0 ${standardShare}%,
                  ${urgencyColors.Soon} ${standardShare}% ${standardShare + soonShare}%,
                  ${urgencyColors.Urgent} ${standardShare + soonShare}% 100%
                )`,
              }}
            >
              <span>
                <strong>{filtered.length}</strong>
                <small>leads</small>
              </span>
            </div>
            <ul>
              {report.urgency.map((item) => (
                <li key={item.name}>
                  <i style={{ background: urgencyColors[item.name] }} />
                  <span>
                    {item.name}
                    <small>
                      {filtered.length ? Math.round((item.count / filtered.length) * 100) : 0}%
                    </small>
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel report-team">
          <header>
            <div>
              <h2>Team workload</h2>
              <p>Assigned and open leads</p>
            </div>
          </header>
          <div className="team-report-list">
            {report.team.map((member) => (
              <div key={member.name}>
                <span className="client-avatar">
                  {member.name === 'Unassigned'
                    ? '?'
                    : member.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
                </span>
                <span>
                  <strong>{member.name}</strong>
                  <small>
                    {member.open} open lead{member.open === 1 ? '' : 's'}
                  </small>
                </span>
                <b>{member.total}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="panel report-summary">
          <header>
            <div>
              <h2>Report summary</h2>
              <p>Key signals for the selected period</p>
            </div>
          </header>
          <ul>
            <li>
              <CheckCircle2 />{' '}
              <span>
                <strong>{report.active} active opportunities</strong>
                <small>still moving through the pipeline</small>
              </span>
            </li>
            <li>
              <Target />{' '}
              <span>
                <strong>{report.winRate}% win rate</strong>
                <small>calculated from completed and lost leads</small>
              </span>
            </li>
            <li>
              <AlertTriangle />{' '}
              <span>
                <strong>{report.urgent} urgent requests</strong>
                <small>require faster response and assignment</small>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
