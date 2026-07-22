import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mockLeads } from '../data/mockLeads'
import { isSupabaseConfigured } from '../lib/supabase'
import { createRemoteLead, listRemoteLeads, updateRemoteLead } from '../services/leadRepository'
import type { Lead, LeadFormData, LeadStatus } from '../types/lead'
import { useAuth } from './AuthContext'

type LeadUpdates = Partial<Pick<Lead, 'status' | 'notes' | 'urgency' | 'assignedUser'>>

interface LeadContextValue {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  dataMode: 'local' | 'supabase'
  addLead: (data: LeadFormData) => Promise<Lead>
  updateLead: (id: string, updates: LeadUpdates) => Promise<void>
  refreshLeads: () => Promise<void>
  resetDemo: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)
const STORAGE_KEY = 'flowlead-crm-leads-v1'

function readInitialLeads() {
  if (isSupabaseConfigured) return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Lead[]) : mockLeads
  } catch {
    return mockLeads
  }
}

const statusLabels: Record<LeadStatus, string> = {
  new: 'Marked as new',
  contacted: 'Client contacted',
  booked: 'Visit booked',
  'in progress': 'Work started',
  completed: 'Job completed',
  lost: 'Lead closed',
}

export function LeadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>(readInitialLeads)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dataMode = isSupabaseConfigured ? 'supabase' : 'local'

  useEffect(() => {
    if (dataMode === 'local') localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  }, [dataMode, leads])

  const refreshLeads = async () => {
    if (dataMode === 'local' || !user) return
    setIsLoading(true)
    setError(null)
    try {
      setLeads(await listRemoteLeads())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load leads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dataMode === 'supabase' && user) void refreshLeads()
    if (dataMode === 'supabase' && !user) setLeads([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, user])

  const addLocalLead = (data: LeadFormData) => {
    const now = new Date()
    const idNumber = 1049 + Math.max(0, leads.length - mockLeads.length)
    const lead: Lead = {
      id: `FL-${idNumber}`,
      createdAt: now.toISOString(),
      clientName: data.fullName,
      phone: data.phone,
      email: data.email,
      serviceType: data.serviceType,
      urgency: data.urgency,
      location: data.location,
      preferredDate: data.preferredDate,
      message: data.message,
      status: 'new',
      notes: '',
      assignedUser: 'Unassigned',
      timeline: [
        {
          id: crypto.randomUUID(),
          label: 'Request received',
          detail: 'Website form submitted',
          timestamp: 'Just now',
          tone: 'blue',
        },
        {
          id: crypto.randomUUID(),
          label: 'Telegram notification sent',
          detail: 'Demo notification delivered to the team',
          timestamp: 'Just now',
          tone: 'green',
        },
      ],
    }
    setLeads((current) => [lead, ...current])
    return lead
  }

  const addLead = async (data: LeadFormData) => {
    setError(null)
    if (dataMode === 'local') return addLocalLead(data)
    try {
      const lead = await createRemoteLead(data)
      setLeads((current) => [lead, ...current.filter((item) => item.id !== lead.id)])
      return lead
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to submit this request'
      setError(message)
      throw new Error(message)
    }
  }

  const updateLocalLead = (id: string, updates: LeadUpdates) => {
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead
        const timeline = [...lead.timeline]
        if (updates.status && updates.status !== lead.status) {
          timeline.push({
            id: crypto.randomUUID(),
            label: statusLabels[updates.status],
            detail: 'Status updated in FlowLead CRM',
            timestamp: 'Just now',
            tone:
              updates.status === 'completed'
                ? 'green'
                : updates.status === 'lost'
                  ? 'gray'
                  : 'blue',
          })
        }
        return { ...lead, ...updates, timeline }
      }),
    )
  }

  const updateLead = async (id: string, updates: LeadUpdates) => {
    setError(null)
    if (dataMode === 'local') {
      updateLocalLead(id, updates)
      return
    }
    try {
      const updated = await updateRemoteLead(id, updates)
      setLeads((current) => current.map((lead) => (lead.id === id ? updated : lead)))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to update this lead'
      setError(message)
      throw new Error(message)
    }
  }

  const value = useMemo<LeadContextValue>(
    () => ({
      leads,
      isLoading,
      error,
      dataMode,
      addLead,
      updateLead,
      refreshLeads,
      resetDemo: () => {
        if (dataMode === 'local') setLeads(mockLeads)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataMode, error, isLoading, leads, user],
  )

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>
}

export function useLeads() {
  const context = useContext(LeadContext)
  if (!context) throw new Error('useLeads must be used inside LeadProvider')
  return context
}
