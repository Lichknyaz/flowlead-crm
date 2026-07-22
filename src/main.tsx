import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LeadProvider } from './context/LeadDataContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './styles.css'
import './dashboard.css'
import './dashboard-extra.css'
import './responsive.css'
import './reset-button.css'
import './visual-tuning.css'
import './fullstack.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeadProvider>
          <App />
        </LeadProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
