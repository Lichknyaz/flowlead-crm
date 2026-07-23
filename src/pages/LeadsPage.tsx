import {
  Columns3,
  Download,
  Filter,
  List,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LeadTable } from '../components/LeadTable'
import { LeadKanban } from '../components/LeadKanban'
import { useCrmUi } from '../context/CrmUiContext'
import { useLeads } from '../context/LeadDataContext'
import { createLeadsCsvHref } from '../utils/leadExport'
import { leadStatuses, type LeadStatus, type Urgency } from '../types/lead'

type LeadView = 'all' | 'mine' | 'unassigned'

const isLeadStatus = (value: string | null): value is LeadStatus =>
  Boolean(value && leadStatuses.includes(value as LeadStatus))

const todayInPrague = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })

export function LeadsPage() {
  const { leads } = useLeads()
  const { openLeadModal } = useCrmUi()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState<'list' | 'board'>('list')
  const [view, setView] = useState<LeadView>('all')
  const requestedStatus = searchParams.get('status')
  const [status, setStatus] = useState<'all' | LeadStatus>(
    isLeadStatus(requestedStatus) ? requestedStatus : 'all',
  )
  const [urgency, setUrgency] = useState<'all' | Urgency>(
    searchParams.get('urgency') === 'Urgent' ? 'Urgent' : 'all',
  )
  const [dateFrom, setDateFrom] = useState(
    searchParams.get('period') === 'today' ? todayInPrague() : '',
  )
  const [dateTo, setDateTo] = useState(
    searchParams.get('period') === 'today' ? todayInPrague() : '',
  )
  const [openOnly, setOpenOnly] = useState(searchParams.get('open') === '1')
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    Boolean(searchParams.get('urgency') || searchParams.get('period') || searchParams.get('open')),
  )
  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        const text =
          `${lead.clientName} ${lead.serviceType} ${lead.location} ${lead.id} ${lead.phone} ${lead.email}`.toLowerCase()
        const createdDate = lead.createdAt.slice(0, 10)
        const matchesView =
          view === 'all' ||
          (view === 'mine' && lead.assignedUser !== 'Unassigned') ||
          (view === 'unassigned' && lead.assignedUser === 'Unassigned')
        return (
          text.includes(query.toLowerCase()) &&
          matchesView &&
          (status === 'all' || lead.status === status) &&
          (urgency === 'all' || lead.urgency === urgency) &&
          (!dateFrom || createdDate >= dateFrom) &&
          (!dateTo || createdDate <= dateTo) &&
          (!openOnly || !['completed', 'lost'].includes(lead.status))
        )
      }),
    [dateFrom, dateTo, leads, openOnly, query, status, urgency, view],
  )

  const resetFilters = () => {
    setQuery('')
    setStatus('all')
    setUrgency('all')
    setDateFrom('')
    setDateTo('')
    setOpenOnly(false)
    setView('all')
  }

  return (
    <>
      <div className="leads-toolbar-top">
        <div className="tab-row">
          <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>
            All leads <span>{leads.length}</span>
          </button>
          <button className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>
            My leads <span>{leads.filter((l) => l.assignedUser !== 'Unassigned').length}</span>
          </button>
          <button
            className={view === 'unassigned' ? 'active' : ''}
            onClick={() => setView('unassigned')}
          >
            Unassigned <span>{leads.filter((l) => l.assignedUser === 'Unassigned').length}</span>
          </button>
        </div>
        <div>
          <div className="layout-toggle" aria-label="Lead layout">
            <button
              className={layout === 'list' ? 'active' : ''}
              onClick={() => setLayout('list')}
              aria-label="List view"
            >
              <List />
            </button>
            <button
              className={layout === 'board' ? 'active' : ''}
              onClick={() => setLayout('board')}
              aria-label="Kanban view"
            >
              <Columns3 />
            </button>
          </div>
          <a
            className="button button-secondary button-small"
            href={filtered.length ? createLeadsCsvHref(filtered) : undefined}
            download="flowlead-leads.csv"
            aria-disabled={filtered.length === 0}
          >
            <Download size={16} /> Export
          </a>
          <button className="button button-primary button-small" onClick={openLeadModal}>
            <Plus size={16} /> Add lead
          </button>
        </div>
      </div>
      <section className="panel leads-panel">
        <div className="filters-row">
          <div className="filter-search">
            <Search />
            <input
              placeholder="Search name, service or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="filter-select">
            <Filter />
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | LeadStatus)}
            >
              <option value="all">All statuses</option>
              {leadStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button
            className={`filter-button ${moreFiltersOpen ? 'active' : ''}`}
            onClick={() => setMoreFiltersOpen((current) => !current)}
          >
            <SlidersHorizontal /> More filters
          </button>
          <span className="filter-result">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        {moreFiltersOpen && (
          <div className="advanced-filters">
            <label>
              Urgency
              <select
                value={urgency}
                onChange={(event) => setUrgency(event.target.value as 'all' | Urgency)}
              >
                <option value="all">All priorities</option>
                <option>Standard</option>
                <option>Soon</option>
                <option>Urgent</option>
              </select>
            </label>
            <label>
              Received from
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label>
              Received to
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <label className="open-filter">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(event) => setOpenOnly(event.target.checked)}
              />
              Open leads only
            </label>
            <button onClick={resetFilters}>
              <RotateCcw /> Reset filters
            </button>
            <button
              className="close-advanced"
              onClick={() => setMoreFiltersOpen(false)}
              aria-label="Close more filters"
            >
              <X />
            </button>
          </div>
        )}
        {layout === 'list' ? <LeadTable leads={filtered} /> : <LeadKanban leads={filtered} />}
      </section>
    </>
  )
}
