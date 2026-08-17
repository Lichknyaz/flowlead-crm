import { useCallback, useEffect, useMemo, useState } from 'react'
import { createMockAutomationEvents, createMockAutomationRules } from '../data/mockAutomations'
import { supabase } from '../lib/supabase'
import {
  listRemoteAutomationEvents,
  listRemoteAutomationRules,
  retryRemoteAutomationEvent,
  runRemoteDueAutomations,
  setRemoteAutomationRuleEnabled,
  testRemoteAutomationRule,
  testRemoteTelegramRule,
} from '../services/automationRepository'
import type { AutomationEvent, AutomationRule } from '../types/automation'
import { useAuth } from '../context/AuthContext'
import { useLeads } from '../context/LeadDataContext'

const RULES_STORAGE_KEY = 'flowlead-crm-automation-rules-v1'
const EVENTS_STORAGE_KEY = 'flowlead-crm-automation-events-v1'

const readStored = <T>(key: string, fallback: () => T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback()
  } catch {
    return fallback()
  }
}

export function useAutomations() {
  const { dataMode } = useLeads()
  const { user } = useAuth()
  const [rules, setRules] = useState<AutomationRule[]>(() =>
    dataMode === 'local' ? readStored(RULES_STORAGE_KEY, createMockAutomationRules) : [],
  )
  const [events, setEvents] = useState<AutomationEvent[]>(() =>
    dataMode === 'local' ? readStored(EVENTS_STORAGE_KEY, createMockAutomationEvents) : [],
  )
  const [isLoading, setIsLoading] = useState(dataMode === 'supabase')
  const [busyRuleId, setBusyRuleId] = useState<string | null>(null)
  const [busyEventId, setBusyEventId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (dataMode === 'local' || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const [nextRules, nextEvents] = await Promise.all([
        listRemoteAutomationRules(),
        listRemoteAutomationEvents(),
      ])
      setRules(nextRules)
      setEvents(nextEvents)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to load automation rules. Apply the latest Supabase migration.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [dataMode, user])

  useEffect(() => {
    if (dataMode === 'local') {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
    }
  }, [dataMode, events, rules])

  useEffect(() => {
    if (dataMode === 'supabase' && user) void refresh()
    if (dataMode === 'supabase' && !user) {
      setRules([])
      setEvents([])
    }
  }, [dataMode, refresh, user])

  useEffect(() => {
    if (dataMode !== 'local') return
    const reset = () => {
      setRules(createMockAutomationRules())
      setEvents(createMockAutomationEvents())
    }
    window.addEventListener('flowlead-reset-demo', reset)
    return () => window.removeEventListener('flowlead-reset-demo', reset)
  }, [dataMode])

  useEffect(() => {
    if (!supabase || dataMode !== 'supabase' || !user) return
    const client = supabase
    const channel = client
      .channel('flowlead-automations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, () => {
        void refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_events' }, () => {
        void refresh()
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [dataMode, refresh, user])

  const setRuleEnabled = async (id: string, enabled: boolean) => {
    const previous = rules.find((rule) => rule.id === id)
    setBusyRuleId(id)
    setError(null)
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)))
    try {
      if (dataMode === 'supabase') {
        const updated = await setRemoteAutomationRuleEnabled(id, enabled)
        setRules((current) => current.map((rule) => (rule.id === id ? updated : rule)))
      }
    } catch (cause) {
      if (previous) {
        setRules((current) => current.map((rule) => (rule.id === id ? previous : rule)))
      }
      const message = cause instanceof Error ? cause.message : 'Unable to update automation rule'
      setError(message)
      throw new Error(message)
    } finally {
      setBusyRuleId(null)
    }
  }

  const testRule = async (id: string) => {
    const rule = rules.find((item) => item.id === id)
    if (!rule) throw new Error('Automation rule was not found')
    if (!rule.enabled) throw new Error(`Enable ${rule.title} before testing it.`)
    setBusyRuleId(id)
    setError(null)
    try {
      const event =
        dataMode === 'supabase'
          ? rule.actionType === 'telegram'
            ? await testRemoteTelegramRule(id)
            : await testRemoteAutomationRule(id)
          : {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ruleId: rule.id,
              leadId: null,
              status: rule.requiresIntegration ? ('skipped' as const) : ('success' as const),
              title: `${rule.title} test ${rule.requiresIntegration ? 'skipped' : 'completed'}`,
              detail: rule.requiresIntegration
                ? 'A real request and configured integration are required for delivery.'
                : 'The rule condition and action are ready.',
              errorMessage: '',
              isTest: true,
              attemptCount: rule.requiresIntegration ? 0 : 1,
              lastAttemptAt: new Date().toISOString(),
            }
      setEvents((current) => [event, ...current.filter((item) => item.id !== event.id)])
      return event
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to test automation rule'
      setError(message)
      throw new Error(message)
    } finally {
      setBusyRuleId(null)
    }
  }

  const retryEvent = async (id: string) => {
    if (dataMode !== 'supabase') throw new Error('Retries are available in the live workspace.')
    setBusyEventId(id)
    setError(null)
    try {
      const event = await retryRemoteAutomationEvent(id)
      setEvents((current) => [event, ...current.filter((item) => item.id !== event.id)])
      return event
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to retry automation event'
      setError(message)
      throw new Error(message)
    } finally {
      setBusyEventId(null)
    }
  }

  const runDueChecks = async () => {
    setError(null)
    try {
      const processed = dataMode === 'supabase' ? await runRemoteDueAutomations() : 0
      if (dataMode === 'supabase') await refresh()
      return processed
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to run due automation checks'
      setError(message)
      throw new Error(message)
    }
  }

  const runCounts = useMemo(() => {
    const counts = new Map<string, number>()
    events.forEach((event) => {
      if (!event.isTest && event.status === 'success') {
        counts.set(event.ruleId, (counts.get(event.ruleId) ?? 0) + 1)
      }
    })
    return counts
  }, [events])

  return {
    rules,
    events,
    runCounts,
    isLoading,
    busyRuleId,
    busyEventId,
    error,
    refresh,
    setRuleEnabled,
    testRule,
    retryEvent,
    runDueChecks,
  }
}
