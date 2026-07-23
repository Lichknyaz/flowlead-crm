import { Bell, CheckCheck, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../context/LeadDataContext'

export function DashboardHeaderTools() {
  const { leads } = useLeads()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [readVersion, setReadVersion] = useState('')

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

  const notifications = leads.slice(0, 6).map((lead) => ({
    lead,
    event: lead.timeline.at(-1),
  }))
  const notificationVersion = notifications
    .map(({ lead, event }) => `${lead.id}:${event?.id ?? ''}`)
    .join('|')
  const hasUnread = notifications.length > 0 && readVersion !== notificationVersion

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
          {hasUnread && <i />}
        </button>
        {notificationsOpen && (
          <div className="header-popover notification-popover">
            <header>
              <div>
                <h3>Notifications</h3>
                <p>Recent pipeline activity</p>
              </div>
              <button onClick={() => setReadVersion(notificationVersion)} disabled={!hasUnread}>
                <CheckCheck /> Mark all read
              </button>
            </header>
            <div className="notification-list">
              {notifications.map(({ lead, event }) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    navigate(`/dashboard/leads/${lead.id}`)
                    setNotificationsOpen(false)
                  }}
                >
                  <i className={event?.tone ? `notification-${event.tone}` : ''} />
                  <span>
                    <strong>{event?.label ?? 'Lead updated'}</strong>
                    <small>
                      {lead.clientName} · {event?.timestamp ?? 'Recently'}
                    </small>
                  </span>
                </button>
              ))}
              {notifications.length === 0 && <p>No notifications yet.</p>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
