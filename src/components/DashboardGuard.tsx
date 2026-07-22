import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function DashboardGuard() {
  const { user, isLoading, isLiveMode } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="auth-spinner" />
        <p>Opening your workspace...</p>
      </main>
    )
  }

  if (isLiveMode && !user) {
    return <Navigate to="/demo" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
