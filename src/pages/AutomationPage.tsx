import {
  ArrowRight,
  BellRing,
  Bot,
  Check,
  Clock3,
  Mail,
  MessageCircle,
  Play,
  Plus,
  Sparkles,
  Webhook,
  Zap,
} from 'lucide-react'

const workflows = [
  {
    icon: <MessageCircle />,
    tone: 'blue',
    title: 'New lead notification',
    description: 'Notify the team as soon as a website request arrives.',
    trigger: 'Form submitted',
    action: 'Telegram message',
    runs: '24 runs',
    active: true,
  },
  {
    icon: <Mail />,
    tone: 'green',
    title: 'Client confirmation',
    description: 'Send a clear confirmation with the request reference.',
    trigger: 'New lead created',
    action: 'Confirmation email',
    runs: '24 runs',
    active: true,
  },
  {
    icon: <Clock3 />,
    tone: 'amber',
    title: 'Response reminder',
    description: 'Flag new leads that have not been contacted in 30 minutes.',
    trigger: '30 min without update',
    action: 'Owner reminder',
    runs: '3 runs',
    active: true,
  },
  {
    icon: <Bot />,
    tone: 'violet',
    title: 'AI request summary',
    description: 'Prepare a concise technician briefing from the client message.',
    trigger: 'Lead assigned',
    action: 'Generate summary',
    runs: 'Demo only',
    active: false,
  },
]

export function AutomationPage() {
  return (
    <>
      <div className="automation-hero">
        <div>
          <span className="eyebrow">
            <Sparkles /> SMART WORKFLOWS
          </span>
          <h2>
            Let routine follow-ups
            <br />
            run in the background.
          </h2>
          <p>
            This demo shows how FlowLead can connect form submissions with notifications,
            confirmations and AI-assisted preparation.
          </p>
        </div>
        <div className="automation-visual">
          <span>
            <Webhook />
          </span>
          <i>
            <ArrowRight />
          </i>
          <span>
            <Zap />
          </span>
          <i>
            <ArrowRight />
          </i>
          <span>
            <BellRing />
          </span>
        </div>
      </div>
      <div className="automation-heading">
        <div>
          <h2>Active workflows</h2>
          <p>Three demo automations are currently watching your pipeline.</p>
        </div>
        <button className="button button-primary button-small">
          <Plus /> New workflow
        </button>
      </div>
      <section className="workflow-grid">
        {workflows.map((workflow) => (
          <article className="workflow-card" key={workflow.title}>
            <div className="workflow-top">
              <span className={`workflow-icon ${workflow.tone}`}>{workflow.icon}</span>
              <label className="switch">
                <input type="checkbox" defaultChecked={workflow.active} />
                <i />
              </label>
            </div>
            <h3>{workflow.title}</h3>
            <p>{workflow.description}</p>
            <div className="workflow-path">
              <span>
                <small>WHEN</small>
                <strong>{workflow.trigger}</strong>
              </span>
              <ArrowRight />
              <span>
                <small>THEN</small>
                <strong>{workflow.action}</strong>
              </span>
            </div>
            <footer>
              <span className={workflow.active ? 'healthy' : 'draft'}>
                <i />
                {workflow.active ? 'Running' : 'Draft'}
              </span>
              <small>{workflow.runs}</small>
              <button>
                <Play /> Test
              </button>
            </footer>
          </article>
        ))}
      </section>
      <section className="automation-log panel">
        <header>
          <div>
            <h2>Recent automation events</h2>
            <p>Simulated activity from the connected request workflow</p>
          </div>
          <button>View all</button>
        </header>
        <div className="log-list">
          <span>
            <i className="log-success">
              <Check />
            </i>
            <p>
              <strong>Telegram notification delivered</strong>
              <small>Anna Novak · New plumbing request</small>
            </p>
            <time>Today, 10:42</time>
          </span>
          <span>
            <i className="log-success">
              <Check />
            </i>
            <p>
              <strong>Confirmation email sent</strong>
              <small>Peter Svoboda · FL-1047</small>
            </p>
            <time>Today, 09:18</time>
          </span>
          <span>
            <i className="log-warning">
              <Clock3 />
            </i>
            <p>
              <strong>Response reminder triggered</strong>
              <small>Martin Dvořák · 31 min without response</small>
            </p>
            <time>Yesterday, 11:37</time>
          </span>
        </div>
      </section>
      <p className="automation-note">
        <Zap /> Portfolio demo behavior. These workflows illustrate integration points for n8n,
        Make.com, Zapier, Telegram, email, or a custom API.
      </p>
    </>
  )
}
