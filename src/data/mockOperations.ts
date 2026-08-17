import type { Appointment, LeadTask, TaskKind } from '../types/operations'

const futureIso = (days: number, hour: number, minute = 0) => {
  const value = new Date()
  value.setDate(value.getDate() + days)
  value.setHours(hour, minute, 0, 0)
  return value.toISOString()
}

const task = (
  id: string,
  leadId: string,
  title: string,
  days: number,
  hour: number,
  kind: TaskKind,
): LeadTask => ({
  id,
  createdAt: new Date().toISOString(),
  leadId,
  title,
  dueAt: futureIso(days, hour),
  kind,
  notes: '',
  completed: false,
  completedAt: null,
})

export const createMockTasks = (): LeadTask[] => [
  task('task-demo-1', 'FL-1048', 'Call client and confirm access', 0, 13, 'call'),
  task('task-demo-2', 'FL-1047', 'Send installation estimate', 0, 16, 'quote'),
  task('task-demo-3', 'FL-1046', 'Confirm visit time', 1, 10, 'follow-up'),
]

export const createMockAppointments = (): Appointment[] => [
  {
    id: 'appointment-demo-1',
    createdAt: new Date().toISOString(),
    leadId: 'FL-1046',
    title: 'Furniture assembly visit',
    startsAt: futureIso(1, 14),
    endsAt: futureIso(1, 17),
    assignedUser: 'Tomáš K.',
    notes: 'Two wardrobes and one desk.',
    status: 'scheduled',
  },
  {
    id: 'appointment-demo-2',
    createdAt: new Date().toISOString(),
    leadId: 'FL-1045',
    title: 'Electrical inspection',
    startsAt: futureIso(2, 9),
    endsAt: futureIso(2, 11),
    assignedUser: 'Jakub M.',
    notes: 'Check sockets and breaker panel.',
    status: 'scheduled',
  },
]
