import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/DashboardLayout'
import { LandingPage } from './pages/LandingPage'
import { RequestPage } from './pages/RequestPage'
import { SuccessPage } from './pages/SuccessPage'
import { DemoAccessPage } from './pages/DemoAccessPage'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { LeadDetailPage } from './pages/LeadDetailPage'
import { AutomationPage } from './pages/AutomationPage'
import { DashboardGuard } from './components/DashboardGuard'
import { CrmUiProvider } from './context/CrmUiContext'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/request" element={<RequestPage />} />
      <Route path="/request/success" element={<SuccessPage />} />
      <Route path="/demo" element={<DemoAccessPage />} />
      <Route element={<DashboardGuard />}>
        <Route
          path="/dashboard"
          element={
            <CrmUiProvider>
              <DashboardLayout />
            </CrmUiProvider>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="automation" element={<AutomationPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
