import { CheckCircle2, LayoutDashboard } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'

export function SuccessPage() {
  const { state } = useLocation() as { state: { id?: string; name?: string } | null }
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="success-wrap">
        <div className="success-icon">
          <CheckCircle2 />
        </div>
        <span className="eyebrow">REQUEST RECEIVED</span>
        <h1>Thanks{state?.name ? `, ${state.name.split(' ')[0]}` : ''}.</h1>
        <p>
          Your request {state?.id && <strong>{state.id}</strong>} has been added to our service
          desk. A team member will review it and contact you shortly.
        </p>
        <div className="success-steps">
          <span className="done">1</span>
          <i />
          <span>2</span>
          <i />
          <span>3</span>
        </div>
        <div className="success-labels">
          <small>Request received</small>
          <small>Team review</small>
          <small>We contact you</small>
        </div>
        <div className="success-actions">
          <Link className="button button-primary" to="/">
            Return home
          </Link>
          <Link className="button button-secondary" to="/dashboard/leads">
            <LayoutDashboard size={18} /> View it in CRM
          </Link>
        </div>
        <small className="demo-disclaimer">
          Portfolio demo: this request is stored only in your browser.
        </small>
      </main>
    </div>
  )
}
