import { ArrowRight, BarChart3, Bot, Check, LockKeyhole, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

export function DemoAccessPage() {
  const { isLiveMode, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      const requestedPath = (location.state as { from?: string } | null)?.from
      navigate(requestedPath ?? '/dashboard', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <h2>{isLiveMode ? 'Sign in to the workspace' : 'Explore the workspace'}</h2>
          <p>
            {isLiveMode
              ? 'Use the workspace owner account created in Supabase.'
              : 'No account needed. Use a pre-filled demo with realistic service requests.'}
          </p>
          <div className="demo-user">
            <span className="avatar">OM</span>
            <span>
              <small>Continue as</small>
              <strong>Workspace Owner</strong>
            </span>
          </div>
          {isLiveMode ? (
            <form className="access-form" onSubmit={submit}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {error && <p className="access-error">{error}</p>}
              <button
                className="button button-primary button-wide"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Open CRM'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <Link className="button button-primary button-wide" to="/dashboard">
              Open CRM demo <ArrowRight size={18} />
            </Link>
          )}
          <small>
            {isLiveMode
              ? 'Workspace access is protected by Supabase Auth.'
              : 'Your changes are saved locally and can be reset anytime.'}
          </small>
        </section>
      </main>
      <footer>FlowLead CRM · Built as an interactive portfolio project</footer>
    </div>
  )
}
