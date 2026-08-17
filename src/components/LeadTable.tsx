import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Eye,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge, UrgencyBadge } from './StatusBadge'
import type { Lead } from '../types/lead'
import { useLeads } from '../context/LeadDataContext'
import { formatLeadReceivedAt, formatLeadReceivedTitle } from '../utils/leadDate'

type SortKey = 'clientName' | 'serviceType' | 'location' | 'status' | 'urgency' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const statusOrder: Lead['status'][] = [
  'new',
  'contacted',
  'booked',
  'in progress',
  'completed',
  'lost',
]
const urgencyOrder: Lead['urgency'][] = ['Standard', 'Soon', 'Urgent']

const compareText = (left: string, right: string) =>
  left.localeCompare(right, 'en', { sensitivity: 'base', numeric: true })

interface LeadTableProps {
  leads: Lead[]
  compact?: boolean
  limit?: number
}

export function LeadTable({ leads, compact = false, limit }: LeadTableProps) {
  const navigate = useNavigate()
  const { updateLead } = useLeads()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedLeads = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1
    const sorted = [...leads].sort((left, right) => {
      if (sortKey === 'createdAt') {
        return (Date.parse(left.createdAt) - Date.parse(right.createdAt)) * direction
      }
      if (sortKey === 'status') {
        return (statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status)) * direction
      }
      if (sortKey === 'urgency') {
        return (
          (urgencyOrder.indexOf(left.urgency) - urgencyOrder.indexOf(right.urgency)) * direction
        )
      }
      return compareText(left[sortKey], right[sortKey]) * direction
    })
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
  }, [leads, limit, sortDirection, sortKey])

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'createdAt' ? 'desc' : 'asc')
  }

  const sortButton = (key: SortKey, label: string) => {
    const active = sortKey === key
    const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <button
        className={active ? 'table-sort active' : 'table-sort'}
        onClick={() => changeSort(key)}
        aria-label={`Sort by ${label}`}
      >
        {label} <Icon />
      </button>
    )
  }

  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'

  const changeStatus = async (lead: Lead, status: 'contacted' | 'completed') => {
    setUpdating(lead.id)
    try {
      await updateLead(lead.id, { status })
      setActiveMenu(null)
    } catch {
      // The shared lead context exposes the actionable error in the CRM UI.
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            <th aria-sort={ariaSort('clientName')}>{sortButton('clientName', 'Client')}</th>
            <th aria-sort={ariaSort('serviceType')}>{sortButton('serviceType', 'Service')}</th>
            {!compact && (
              <th aria-sort={ariaSort('location')}>{sortButton('location', 'Location')}</th>
            )}
            <th aria-sort={ariaSort('status')}>{sortButton('status', 'Status')}</th>
            <th aria-sort={ariaSort('urgency')}>{sortButton('urgency', 'Priority')}</th>
            <th aria-sort={ariaSort('createdAt')}>{sortButton('createdAt', 'Received')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sortedLeads.map((lead) => (
            <tr key={lead.id} onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
              <td>
                <div className="client-cell">
                  <span className="client-avatar">
                    {lead.clientName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span>
                    <strong>{lead.clientName}</strong>
                    <small>{lead.id}</small>
                  </span>
                </div>
              </td>
              <td>
                <strong className="cell-primary">{lead.serviceType}</strong>
              </td>
              {!compact && <td>{lead.location}</td>}
              <td>
                <StatusBadge status={lead.status} />
              </td>
              <td>
                <UrgencyBadge urgency={lead.urgency} />
              </td>
              <td title={formatLeadReceivedTitle(lead.createdAt)}>
                {formatLeadReceivedAt(lead.createdAt)}
              </td>
              <td>
                <div className="row-action-wrap">
                  <button
                    className="row-action"
                    aria-label={`Actions for ${lead.clientName}`}
                    aria-expanded={activeMenu === lead.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveMenu((current) => (current === lead.id ? null : lead.id))
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenu === lead.id && (
                    <div className="row-action-menu" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
                        <Eye /> Open details
                      </button>
                      {lead.status === 'new' && (
                        <button
                          onClick={() => void changeStatus(lead, 'contacted')}
                          disabled={updating === lead.id}
                        >
                          <MessageCircle /> Mark contacted
                        </button>
                      )}
                      {!['completed', 'lost'].includes(lead.status) && (
                        <button
                          onClick={() => void changeStatus(lead, 'completed')}
                          disabled={updating === lead.id}
                        >
                          <CheckCircle2 /> Mark completed
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="mobile-row-arrow" size={18} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedLeads.length === 0 && <div className="empty-state">No leads match these filters.</div>}
    </div>
  )
}
