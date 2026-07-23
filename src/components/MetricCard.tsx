import { Eye, MoreHorizontal, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export function MetricCard({
  label,
  value,
  icon,
  tone,
  note,
  onView,
  onRefresh,
}: {
  label: string
  value: number | string
  icon: ReactNode
  tone: string
  note: ReactNode
  onView: () => void
  onRefresh: () => void | Promise<void>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
      setMenuOpen(false)
    }
  }

  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}>{icon}</span>
        <div className="metric-menu-wrap">
          <button
            aria-label={`More options for ${label}`}
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal />
          </button>
          {menuOpen && (
            <div className="metric-menu">
              <button
                onClick={() => {
                  onView()
                  setMenuOpen(false)
                }}
              >
                <Eye /> View related leads
              </button>
              <button onClick={() => void refresh()} disabled={refreshing}>
                <RefreshCw className={refreshing ? 'spinning' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh data'}
              </button>
            </div>
          )}
        </div>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{note}</small>
    </article>
  )
}
