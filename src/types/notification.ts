export type NotificationTone = 'blue' | 'green' | 'amber' | 'gray'

export interface CrmNotification {
  id: string
  createdAt: string
  leadId: string
  title: string
  message: string
  tone: NotificationTone
  read: boolean
}
