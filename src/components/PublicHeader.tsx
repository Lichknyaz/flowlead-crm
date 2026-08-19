import { Menu, X } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { scrollToSection } from '../utils/smoothScroll'
import { Brand } from './Brand'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSectionNavigation = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault()
    setOpen(false)

    if (location.pathname === '/') {
      window.history.pushState(null, '', `/#${sectionId}`)
      scrollToSection(sectionId)
      return
    }

    navigate(`/#${sectionId}`)
  }

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
          <a href="/#services" onClick={(event) => handleSectionNavigation(event, 'services')}>
            Services
          </a>
          <a href="/#process" onClick={(event) => handleSectionNavigation(event, 'process')}>
            How it works
          </a>
          <a href="/#reviews" onClick={(event) => handleSectionNavigation(event, 'reviews')}>
            Reviews
          </a>
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
