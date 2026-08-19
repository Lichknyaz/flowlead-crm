import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from './Brand'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="public-header">
      <div className="public-nav container">
        <Brand />
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-controls="public-navigation"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav id="public-navigation" aria-label="Primary navigation" className={open ? 'open' : ''}>
          <Link to="/#services" onClick={() => setOpen(false)}>
            Services
          </Link>
          <Link to="/#process" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link to="/#reviews" onClick={() => setOpen(false)}>
            Reviews
          </Link>
          <Link className="nav-demo" to="/demo">
            CRM demo
          </Link>
          <Link className="button button-primary button-small" to="/request">
            Request a repair
          </Link>
        </nav>
      </div>
    </header>
  )
}
