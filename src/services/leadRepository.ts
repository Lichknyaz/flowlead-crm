import { notificationsEnabled, supabase } from '../lib/supabase'
import type { Lead, LeadFormData } from '../types/lead'

type LeadUpdates = Partial<Pick<Lead, 'status' | 'notes' | 'urgency' | 'assignedUser'>>

interface LeadRow {
  id: string
  created_at: string
  client_name: string
  phone: string
  email: string
  service_type: string
  urgency: Lead['urgency']
  location: string
  preferred_date: string | null
  message: string
  status: Lead['status']
  notes: string
  assigned_user: string
  timeline: Lead['timeline']
}

const toLead = (row: LeadRow): Lead => ({
  id: row.id,
  createdAt: row.created_at,
  clientName: row.client_name,
  phone: row.phone,
  email: row.email,
  serviceType: row.service_type,
  urgency: row.urgency,
  location: row.location,
  preferredDate: row.preferred_date ?? '',
  message: row.message,
  status: row.status,
  notes: row.notes,
  assignedUser: row.assigned_user,
  timeline: row.timeline ?? [],
})

export async function listRemoteLeads(): Promise<Lead[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('leads').select('*').order('created_at', {
    ascending: false,
  })
  if (error) throw error
  return (data as LeadRow[]).map(toLead)
}

export async function createRemoteLead(form: LeadFormData): Promise<Lead> {
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .rpc('submit_lead', {
      full_name: form.fullName,
      contact_phone: form.phone,
      contact_email: form.email,
      requested_service: form.serviceType,
      request_urgency: form.urgency,
      service_location: form.location,
      requested_date: form.preferredDate || null,
      problem_message: form.message,
    })
    .single()

  if (error) throw error

  const lead = toLead(data as LeadRow)

  if (notificationsEnabled) {
    void supabase.functions.invoke('notify-new-lead', { body: { leadId: lead.id } })
  }

  return lead
}

export async function updateRemoteLead(id: string, updates: LeadUpdates): Promise<Lead> {
  if (!supabase) throw new Error('Supabase is not configured')

  const databaseUpdates = {
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    ...(updates.urgency ? { urgency: updates.urgency } : {}),
    ...(updates.assignedUser ? { assigned_user: updates.assignedUser } : {}),
  }

  const { data, error } = await supabase
    .from('leads')
    .update(databaseUpdates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return toLead(data as LeadRow)
}
