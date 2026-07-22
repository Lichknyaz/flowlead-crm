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
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'open' : ''}>
          <a href="/#services">Services</a>
          <a href="/#process">How it works</a>
          <a href="/#reviews">Reviews</a>
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
