import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createMockAppointments, createMockTasks } from '../data/mockOperations'
import { supabase } from '../lib/supabase'
import {
  createRemoteAppointment,
  createRemoteTask,
  listRemoteAppointments,
  listRemoteTasks,
  setRemoteAppointmentStatus,
  setRemoteTaskCompleted,
} from '../services/operationsRepository'
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  LeadTask,
  TaskInput,
} from '../types/operations'
import { useAuth } from './AuthContext'
import { useLeads } from './LeadDataContext'

interface OperationsContextValue {
  tasks: LeadTask[]
  appointments: Appointment[]
  isLoading: boolean
  error: string | null
  addTask: (input: TaskInput) => Promise<LeadTask>
  toggleTask: (id: string, completed: boolean) => Promise<void>
  addAppointment: (input: AppointmentInput) => Promise<Appointment>
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>
  refreshOperations: () => Promise<void>
}

const OperationsContext = createContext<OperationsContextValue | null>(null)
const TASK_STORAGE_KEY = 'flowlead-crm-tasks-v1'
const APPOINTMENT_STORAGE_KEY = 'flowlead-crm-appointments-v1'

const readStored = <T,>(key: string, fallback: () => T): T => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback()
  } catch {
    return fallback()
  }
}

export function OperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { dataMode } = useLeads()
  const [tasks, setTasks] = useState<LeadTask[]>(() =>
    dataMode === 'local' ? readStored(TASK_STORAGE_KEY, createMockTasks) : [],
  )
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    dataMode === 'local' ? readStored(APPOINTMENT_STORAGE_KEY, createMockAppointments) : [],
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (dataMode !== 'local') return
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks))
    localStorage.setItem(APPOINTMENT_STORAGE_KEY, JSON.stringify(appointments))
  }, [appointments, dataMode, tasks])

  useEffect(() => {
    if (dataMode !== 'local') return
    const reset = () => {
      setTasks(createMockTasks())
      setAppointments(createMockAppointments())
    }
    window.addEventListener('flowlead-reset-demo', reset)
    return () => window.removeEventListener('flowlead-reset-demo', reset)
  }, [dataMode])

  const refreshOperations = async () => {
    if (dataMode === 'local' || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const [nextTasks, nextAppointments] = await Promise.all([
        listRemoteTasks(),
        listRemoteAppointments(),
      ])
      setTasks(nextTasks)
      setAppointments(nextAppointments)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load tasks and appointments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dataMode === 'supabase' && user) void refreshOperations()
    if (dataMode === 'supabase' && !user) {
      setTasks([])
      setAppointments([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, user])

  useEffect(() => {
    if (!supabase || dataMode !== 'supabase' || !user) return
    const client = supabase
    const channel = client
      .channel('flowlead-operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_tasks' }, () => {
        void refreshOperations()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void refreshOperations()
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, user])

  const addTask = async (input: TaskInput) => {
    setError(null)
    try {
      const task: LeadTask =
        dataMode === 'local'
          ? {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ...input,
              notes: input.notes ?? '',
              completed: false,
              completedAt: null,
            }
          : await createRemoteTask(input)
      setTasks((current) => [...current, task].sort((a, b) => a.dueAt.localeCompare(b.dueAt)))
      return task
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to create task'
      setError(message)
      throw new Error(message)
    }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    setError(null)
    const previous = tasks.find((task) => task.id === id)
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
          : task,
      ),
    )
    if (dataMode === 'local') return
    try {
      const updated = await setRemoteTaskCompleted(id, completed)
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)))
    } catch (cause) {
      if (previous) setTasks((current) => current.map((task) => (task.id === id ? previous : task)))
      const message = cause instanceof Error ? cause.message : 'Unable to update task'
      setError(message)
      throw new Error(message)
    }
  }

  const addAppointment = async (input: AppointmentInput) => {
    setError(null)
    try {
      const appointment: Appointment =
        dataMode === 'local'
          ? {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ...input,
              notes: input.notes ?? '',
              status: 'scheduled',
            }
          : await createRemoteAppointment(input)
      setAppointments((current) =>
        [...current, appointment].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      )
      return appointment
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to schedule appointment'
      setError(message)
      throw new Error(message)
    }
  }

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setError(null)
    const previous = appointments.find((appointment) => appointment.id === id)
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    )
    if (dataMode === 'local') return
    try {
      const updated = await setRemoteAppointmentStatus(id, status)
      setAppointments((current) =>
        current.map((appointment) => (appointment.id === id ? updated : appointment)),
      )
    } catch (cause) {
      if (previous) {
        setAppointments((current) =>
          current.map((appointment) => (appointment.id === id ? previous : appointment)),
        )
      }
      const message = cause instanceof Error ? cause.message : 'Unable to update appointment'
      setError(message)
      throw new Error(message)
    }
  }

  const value = useMemo<OperationsContextValue>(
    () => ({
      tasks,
      appointments,
      isLoading,
      error,
      addTask,
      toggleTask,
      addAppointment,
      updateAppointmentStatus,
      refreshOperations,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments, error, isLoading, tasks],
  )

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>
}

export function useOperations() {
  const context = useContext(OperationsContext)
  if (!context) throw new Error('useOperations must be used inside OperationsProvider')
  return context
}
