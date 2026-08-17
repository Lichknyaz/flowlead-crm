import { supabase } from '../lib/supabase'
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  LeadTask,
  TaskInput,
} from '../types/operations'

interface TaskRow {
  id: string
  created_at: string
  lead_id: string
  title: string
  due_at: string
  kind: LeadTask['kind']
  notes: string
  completed: boolean
  completed_at: string | null
}

interface AppointmentRow {
  id: string
  created_at: string
  lead_id: string
  title: string
  starts_at: string
  ends_at: string
  assigned_user: string
  notes: string
  status: AppointmentStatus
}

const toTask = (row: TaskRow): LeadTask => ({
  id: row.id,
  createdAt: row.created_at,
  leadId: row.lead_id,
  title: row.title,
  dueAt: row.due_at,
  kind: row.kind,
  notes: row.notes,
  completed: row.completed,
  completedAt: row.completed_at,
})

const toAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  createdAt: row.created_at,
  leadId: row.lead_id,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  assignedUser: row.assigned_user,
  notes: row.notes,
  status: row.status,
})

export async function listRemoteTasks() {
  if (!supabase) return []
  const { data, error } = await supabase.from('lead_tasks').select('*').order('due_at')
  if (error) throw error
  return (data as TaskRow[]).map(toTask)
}

export async function createRemoteTask(input: TaskInput) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lead_tasks')
    .insert({
      lead_id: input.leadId,
      title: input.title,
      due_at: input.dueAt,
      kind: input.kind,
      notes: input.notes ?? '',
    })
    .select('*')
    .single()
  if (error) throw error
  return toTask(data as TaskRow)
}

export async function setRemoteTaskCompleted(id: string, completed: boolean) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lead_tasks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return toTask(data as TaskRow)
}

export async function listRemoteAppointments() {
  if (!supabase) return []
  const { data, error } = await supabase.from('appointments').select('*').order('starts_at')
  if (error) throw error
  return (data as AppointmentRow[]).map(toAppointment)
}

export async function createRemoteAppointment(input: AppointmentInput) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: input.leadId,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      assigned_user: input.assignedUser,
      notes: input.notes ?? '',
    })
    .select('*')
    .single()
  if (error) throw error
  return toAppointment(data as AppointmentRow)
}

export async function setRemoteAppointmentStatus(id: string, status: AppointmentStatus) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return toAppointment(data as AppointmentRow)
}
