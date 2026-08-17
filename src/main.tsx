import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LeadProvider } from './context/LeadDataContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { OperationsProvider } from './context/OperationsContext'
import App from './App'
import './styles.css'
import './dashboard.css'
import './dashboard-extra.css'
import './responsive.css'
import './reset-button.css'
import './visual-tuning.css'
import './fullstack.css'
import './crm-workflows.css'
import './kanban-realtime.css'
import './reports.css'
import './operations.css'
import './crm-typography.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeadProvider>
          <OperationsProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </OperationsProvider>
        </LeadProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
