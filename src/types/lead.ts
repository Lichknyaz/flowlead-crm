export const leadStatuses = ['new', 'contacted', 'booked', 'in progress', 'completed', 'lost'] as const
export type LeadStatus = (typeof leadStatuses)[number]
export type Urgency = 'Standard' | 'Soon' | 'Urgent'

export interface TimelineEvent {
  id: string
  label: string
  detail: string
  timestamp: string
  tone: 'blue' | 'green' | 'amber' | 'gray'
}

export interface Lead {
  id: string
  createdAt: string
  clientName: string
  phone: string
  email: string
  serviceType: string
  urgency: Urgency
  location: string
  preferredDate: string
  message: string
  status: LeadStatus
  notes: string
  assignedUser: string
  timeline: TimelineEvent[]
}

export interface LeadFormData {
  fullName: string
  phone: string
  email: string
  serviceType: string
  urgency: Urgency
  location: string
  preferredDate: string
  message: string
}
