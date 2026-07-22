import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mockLeads } from '../data/mockLeads'
import type { Lead, LeadFormData, LeadStatus } from '../types/lead'

interface LeadContextValue {
  leads: Lead[]
  addLead: (data: LeadFormData) => Lead
  updateLead: (id: string, updates: Partial<Pick<Lead, 'status' | 'notes' | 'urgency' | 'assignedUser'>>) => void
  resetDemo: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)
const STORAGE_KEY = 'flowlead-crm-leads-v1'

function readInitialLeads() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Lead[]) : mockLeads
  } catch {
    return mockLeads
  }
}

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(readInitialLeads)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  }, [leads])

  const addLead = (data: LeadFormData) => {
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
        { id: crypto.randomUUID(), label: 'Request received', detail: 'Website form submitted', timestamp: 'Just now', tone: 'blue' },
        { id: crypto.randomUUID(), label: 'Telegram notification sent', detail: 'Demo notification delivered to the team', timestamp: 'Just now', tone: 'green' },
      ],
    }
    setLeads((current) => [lead, ...current])
    return lead
  }

  const updateLead = (id: string, updates: Partial<Pick<Lead, 'status' | 'notes' | 'urgency' | 'assignedUser'>>) => {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== id) return lead
      const timeline = [...lead.timeline]
      if (updates.status && updates.status !== lead.status) {
        const statusLabels: Record<LeadStatus, string> = { new: 'Marked as new', contacted: 'Client contacted', booked: 'Visit booked', 'in progress': 'Work started', completed: 'Job completed', lost: 'Lead closed' }
        timeline.push({ id: crypto.randomUUID(), label: statusLabels[updates.status], detail: 'Status updated in FlowLead CRM', timestamp: 'Just now', tone: updates.status === 'completed' ? 'green' : updates.status === 'lost' ? 'gray' : 'blue' })
      }
      return { ...lead, ...updates, timeline }
    }))
  }

  const value = useMemo(() => ({ leads, addLead, updateLead, resetDemo: () => setLeads(mockLeads) }), [leads])
  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>
}

export function useLeads() {
  const context = useContext(LeadContext)
  if (!context) throw new Error('useLeads must be used inside LeadProvider')
  return context
}
