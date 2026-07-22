import { ArrowRight, BarChart3, Bot, Check, LockKeyhole, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function DemoAccessPage() {
  return (
    <div className="demo-access">
      <header>
        <Brand />
        <Link to="/">Back to website</Link>
      </header>
      <main>
        <section className="demo-copy">
          <span className="eyebrow light">INTERACTIVE PORTFOLIO DEMO</span>
          <h1>
            From website request
            <br />
            to <em>organized work.</em>
          </h1>
          <p>
            FlowLead connects Prague HomeFix's public request form with a clear, lightweight CRM
            workspace.
          </p>
          <ul>
            <li>
              <Check /> Track every lead in one place
            </li>
            <li>
              <Check /> Update statuses and team notes
            </li>
            <li>
              <Check /> See useful metrics at a glance
            </li>
            <li>
              <Check /> Preview notification automations
            </li>
          </ul>
          <div className="mini-flow">
            <span>
              <Users /> New lead
            </span>
            <i>→</i>
            <span>
              <BarChart3 /> CRM
            </span>
            <i>→</i>
            <span>
              <Bot /> Follow-up
            </span>
          </div>
        </section>
        <section className="access-card">
          <span className="access-lock">
            <LockKeyhole />
          </span>
          <h2>Explore the workspace</h2>
          <p>No account needed. Use a pre-filled demo with realistic service requests.</p>
          <div className="demo-user">
            <span className="avatar">OM</span>
            <span>
              <small>Continue as</small>
              <strong>Workspace Owner</strong>
            </span>
          </div>
          <Link className="button button-primary button-wide" to="/dashboard">
            Open CRM demo <ArrowRight size={18} />
          </Link>
          <small>Your changes are saved locally and can be reset anytime.</small>
        </section>
      </main>
      <footer>FlowLead CRM · Built as an interactive portfolio project</footer>
    </div>
  )
}
