import { Download, Filter, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LeadTable } from '../components/LeadTable'
import { useLeads } from '../context/LeadContext'
import { leadStatuses, type LeadStatus } from '../types/lead'

export function LeadsPage() {
  const { leads } = useLeads()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LeadStatus>('all')
  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        const text =
          `${lead.clientName} ${lead.serviceType} ${lead.location} ${lead.id}`.toLowerCase()
        return text.includes(query.toLowerCase()) && (status === 'all' || lead.status === status)
      }),
    [leads, query, status],
  )
  return (
    <>
      <div className="leads-toolbar-top">
        <div className="tab-row">
          <button className="active">
            All leads <span>{leads.length}</span>
          </button>
          <button>
            My leads <span>{leads.filter((l) => l.assignedUser !== 'Unassigned').length}</span>
          </button>
          <button>
            Unassigned <span>{leads.filter((l) => l.assignedUser === 'Unassigned').length}</span>
          </button>
        </div>
        <div>
          <button className="button button-secondary button-small">
            <Download size={16} /> Export
          </button>
          <Link className="button button-primary button-small" to="/request">
            <Plus size={16} /> Add lead
          </Link>
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
          <button className="filter-button">
            <SlidersHorizontal /> More filters
          </button>
          <span className="filter-result">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
        <LeadTable leads={filtered} />
      </section>
    </>
  )
}
