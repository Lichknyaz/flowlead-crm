import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { NewLeadModal } from '../components/NewLeadModal'

interface CrmUiContextValue {
  openLeadModal: () => void
}

const CrmUiContext = createContext<CrmUiContextValue | null>(null)

export function CrmUiProvider({ children }: { children: ReactNode }) {
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [toast, setToast] = useState('')
  const closeLeadModal = useCallback(() => setLeadModalOpen(false), [])
  const value = useMemo(() => ({ openLeadModal: () => setLeadModalOpen(true) }), [])

  return (
    <CrmUiContext.Provider value={value}>
      {children}
      <NewLeadModal
        open={leadModalOpen}
        onClose={closeLeadModal}
        onCreated={(lead) => {
          closeLeadModal()
          setToast(`${lead.id} was added to the pipeline`)
          window.setTimeout(() => setToast(''), 3500)
        }}
      />
      {toast && (
        <div className="crm-toast" role="status">
          <CheckCircle2 /> {toast}
          <button onClick={() => setToast('')} aria-label="Dismiss notification">
            <X />
          </button>
        </div>
      )}
    </CrmUiContext.Provider>
  )
}

export function useCrmUi() {
  const context = useContext(CrmUiContext)
  if (!context) throw new Error('useCrmUi must be used inside CrmUiProvider')
  return context
}
