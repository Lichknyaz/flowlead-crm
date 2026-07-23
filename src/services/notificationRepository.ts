import { supabase } from '../lib/supabase'
import type { CrmNotification, NotificationTone } from '../types/notification'

interface NotificationRow {
  id: string
  created_at: string
  lead_id: string
  title: string
  message: string
  tone: NotificationTone
}

export async function listRemoteNotifications(): Promise<CrmNotification[]> {
  if (!supabase) return []

  const [{ data: notifications, error }, { data: reads, error: readsError }] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('notification_reads').select('notification_id'),
  ])
  if (error) throw error
  if (readsError) throw readsError

  const readIds = new Set((reads ?? []).map((item) => item.notification_id as string))
  return (notifications as NotificationRow[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    leadId: row.lead_id,
    title: row.title,
    message: row.message,
    tone: row.tone,
    read: readIds.has(row.id),
  }))
}

export async function markRemoteNotificationsRead(notificationIds: string[]) {
  if (!supabase || notificationIds.length === 0) return
  const { error } = await supabase.rpc('mark_notifications_read', {
    notification_ids: notificationIds,
  })
  if (error) throw error
}
