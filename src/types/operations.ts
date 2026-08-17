export type TaskKind = 'call' | 'follow-up' | 'quote' | 'other'

export interface LeadTask {
  id: string
  createdAt: string
  leadId: string
  title: string
  dueAt: string
  kind: TaskKind
  notes: string
  completed: boolean
  completedAt: string | null
}

export interface TaskInput {
  leadId: string
  title: string
  dueAt: string
  kind: TaskKind
  notes?: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  createdAt: string
  leadId: string
  title: string
  startsAt: string
  endsAt: string
  assignedUser: string
  notes: string
  status: AppointmentStatus
}

export interface AppointmentInput {
  leadId: string
  title: string
  startsAt: string
  endsAt: string
  assignedUser: string
  notes?: string
}
