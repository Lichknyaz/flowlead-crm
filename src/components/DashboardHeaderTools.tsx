import { Bell, CheckCheck, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../context/LeadDataContext'
import { useNotifications } from '../context/NotificationContext'

export function DashboardHeaderTools() {
  const { leads } = useLeads()
  const { notifications, unreadCount, isLoading, error, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setNotificationsOpen(false)
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return leads.slice(0, 5)
    return leads
      .filter((lead) =>
        `${lead.id} ${lead.clientName} ${lead.serviceType} ${lead.location}`
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 6)
  }, [leads, query])

  return (
    <>
      <div className="header-tool">
        <button
          className="search-button"
          onClick={() => {
            setSearchOpen((current) => !current)
            setNotificationsOpen(false)
          }}
          aria-expanded={searchOpen}
        >
          <Search size={18} />
          <span>Search leads...</span>
          <kbd>Ctrl K</kbd>
        </button>
        {searchOpen && (
          <div className="header-popover search-popover">
            <div className="popover-search-input">
              <Search />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, reference, service or location"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X />
              </button>
            </div>
            <div className="search-results">
              <small>{query ? `${results.length} matching leads` : 'Recent leads'}</small>
              {results.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    navigate(`/dashboard/leads/${lead.id}`)
                    setSearchOpen(false)
                    setQuery('')
                  }}
                >
                  <span className="client-avatar">
                    {lead.clientName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span>
                    <strong>{lead.clientName}</strong>
                    <small>
                      {lead.id} · {lead.serviceType}
                    </small>
                  </span>
                  <em>{lead.status}</em>
                </button>
              ))}
              {results.length === 0 && <p>No leads match “{query}”.</p>}
            </div>
          </div>
        )}
      </div>
      <div className="header-tool">
        <button
          className="icon-button"
          onClick={() => {
            setNotificationsOpen((current) => !current)
            setSearchOpen(false)
          }}
          aria-label="Open notifications"
          aria-expanded={notificationsOpen}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="notification-count">{Math.min(99, unreadCount)}</span>
          )}
        </button>
        {notificationsOpen && (
          <div className="header-popover notification-popover">
            <header>
              <div>
                <h3>Notifications</h3>
                <p>Recent pipeline activity</p>
              </div>
              <button onClick={() => void markAllRead()} disabled={unreadCount === 0}>
                <CheckCheck /> Mark all read
              </button>
            </header>
            <div className="notification-list">
              {notifications.slice(0, 8).map((notification) => (
                <button
                  className={notification.read ? 'read' : ''}
                  key={notification.id}
                  onClick={() => {
                    navigate(`/dashboard/leads/${notification.leadId}`)
                    setNotificationsOpen(false)
                  }}
                >
                  <i className={`notification-${notification.tone}`} />
                  <span>
                    <strong>{notification.title}</strong>
                    <small>{notification.message}</small>
                  </span>
                </button>
              ))}
              {isLoading && <p>Loading notifications…</p>}
              {!isLoading && notifications.length === 0 && <p>No notifications yet.</p>}
              {error && <p className="notification-error">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
