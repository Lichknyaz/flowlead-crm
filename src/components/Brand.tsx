import { Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <Link
      className="brand"
      to={dashboard ? '/dashboard' : '/'}
      aria-label={dashboard ? 'FlowLead dashboard' : 'Prague HomeFix home'}
    >
      <span className="brand-mark">
        <Wrench size={19} strokeWidth={2.4} />
      </span>
      <span>
        <strong>{dashboard ? 'FlowLead' : 'Prague HomeFix'}</strong>
        <small>{dashboard ? 'CRM workspace' : 'Repairs made simple'}</small>
      </span>
    </Link>
  )
}
