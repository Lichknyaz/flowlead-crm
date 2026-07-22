import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brand } from './Brand'
import { useLeads } from '../context/LeadContext'

const titles: Record<string, [string, string]> = {
  '/dashboard': ['Dashboard', 'A live overview of your service requests'],
  '/dashboard/leads': ['Leads', 'Track, filter and manage every request'],
  '/dashboard/automation': ['Automation', 'Keep routine follow-ups moving automatically'],
}

export function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const { leads, resetDemo } = useLeads()
  const location = useLocation()
  const title = location.pathname.startsWith('/dashboard/leads/')
    ? ['Lead details', 'Request history and next actions']
    : (titles[location.pathname] ?? titles['/dashboard'])
  return (
    <div className="dashboard-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          <Brand dashboard />
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <div className="workspace-pill">
          <span className="workspace-icon">
            <Wrench size={17} />
          </span>
          <span>
            <small>Workspace</small>
            <strong>Prague HomeFix</strong>
          </span>
          <ChevronDown size={16} />
        </div>
        <nav className="sidebar-nav">
          <small>WORKSPACE</small>
          <NavLink end to="/dashboard" onClick={() => setOpen(false)}>
            <LayoutDashboard size={19} /> Overview
          </NavLink>
          <NavLink to="/dashboard/leads" onClick={() => setOpen(false)}>
            <Users size={19} /> Leads{' '}
            <span className="nav-count">
              {leads.filter((lead) => lead.status === 'new').length}
            </span>
          </NavLink>
          <NavLink to="/dashboard/automation" onClick={() => setOpen(false)}>
            <Bot size={19} /> Automation
          </NavLink>
          <small>INSIGHTS</small>
          <span className="disabled-link">
            <BarChart3 size={19} /> Reports <em>Soon</em>
          </span>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-mode">
            <span>
              <i />
              Demo workspace
            </span>
            <small>Changes save in this browser</small>
            <button onClick={resetDemo}>
              <RotateCcw size={11} /> Reset demo data
            </button>
          </div>
          <NavLink to="/">
            <LogOut size={18} /> Exit to website
          </NavLink>
          <div className="user-card">
            <span className="avatar">OM</span>
            <span>
              <strong>Oleksandr M.</strong>
              <small>Workspace owner</small>
            </span>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="sidebar-toggle" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="dashboard-title">
            <h1>{title[0]}</h1>
            <p>{title[1]}</p>
          </div>
          <div className="header-actions">
            <button className="search-button">
              <Search size={18} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="icon-button">
              <Bell size={19} />
              <i />
            </button>
            <NavLink className="button button-primary button-small" to="/request">
              <Plus size={17} /> New lead
            </NavLink>
          </div>
        </header>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
