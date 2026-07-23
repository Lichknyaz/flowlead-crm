import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  listRemoteNotifications,
  markRemoteNotificationsRead,
} from '../services/notificationRepository'
import type { CrmNotification } from '../types/notification'
import { useAuth } from './AuthContext'
import { useLeads } from './LeadDataContext'

interface NotificationContextValue {
  notifications: CrmNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAllRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const READ_STORAGE_KEY = 'flowlead-crm-read-notifications-v1'

const readLocalIds = () => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set<string>()
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { leads, dataMode } = useLeads()
  const [remoteNotifications, setRemoteNotifications] = useState<CrmNotification[]>([])
  const [localReadIds, setLocalReadIds] = useState(readLocalIds)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localNotifications = useMemo<CrmNotification[]>(
    () =>
      leads.slice(0, 20).flatMap((lead) => {
        const event = lead.timeline.at(-1)
        if (!event) return []
        const id = `${lead.id}:${event.id}`
        return [
          {
            id,
            createdAt: lead.createdAt,
            leadId: lead.id,
            title: event.label,
            message: `${lead.clientName} · ${event.detail}`,
            tone: event.tone,
            read: localReadIds.has(id),
          },
        ]
      }),
    [leads, localReadIds],
  )

  const refreshNotifications = async () => {
    if (dataMode === 'local' || !user) return
    setIsLoading(true)
    setError(null)
    try {
      setRemoteNotifications(await listRemoteNotifications())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dataMode === 'supabase' && user) void refreshNotifications()
    if (dataMode === 'supabase' && !user) setRemoteNotifications([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, user])

  useEffect(() => {
    if (!supabase || dataMode !== 'supabase' || !user) return
    const client = supabase
    const channel = client
      .channel('flowlead-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => void refreshNotifications(),
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, user])

  const notifications = dataMode === 'supabase' ? remoteNotifications : localNotifications
  const unreadCount = notifications.filter((notification) => !notification.read).length

  const markAllRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id)
    if (unreadIds.length === 0) return

    if (dataMode === 'local') {
      const next = new Set([...localReadIds, ...unreadIds])
      setLocalReadIds(next)
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next]))
      return
    }

    try {
      await markRemoteNotificationsRead(unreadIds)
      setRemoteNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update notifications')
    }
  }

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      markAllRead,
      refreshNotifications,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error, isLoading, notifications, unreadCount],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}
