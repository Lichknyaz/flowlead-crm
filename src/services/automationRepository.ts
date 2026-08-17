import { supabase } from '../lib/supabase'
import type {
  AutomationAction,
  AutomationEvent,
  AutomationEventStatus,
  AutomationRule,
  AutomationTrigger,
} from '../types/automation'

interface AutomationRuleRow {
  id: string
  key: string
  title: string
  description: string
  trigger_type: AutomationTrigger
  trigger_label: string
  action_type: AutomationAction
  action_label: string
  delay_minutes: number
  enabled: boolean
  requires_integration: boolean
  updated_at: string
}

interface AutomationEventRow {
  id: string
  created_at: string
  rule_id: string
  lead_id: string | null
  status: AutomationEventStatus
  title: string
  detail: string
  error_message: string
  is_test: boolean
}

const toRule = (row: AutomationRuleRow): AutomationRule => ({
  id: row.id,
  key: row.key,
  title: row.title,
  description: row.description,
  triggerType: row.trigger_type,
  triggerLabel: row.trigger_label,
  actionType: row.action_type,
  actionLabel: row.action_label,
  delayMinutes: row.delay_minutes,
  enabled: row.enabled,
  requiresIntegration: row.requires_integration,
  updatedAt: row.updated_at,
})

const toEvent = (row: AutomationEventRow): AutomationEvent => ({
  id: row.id,
  createdAt: row.created_at,
  ruleId: row.rule_id,
  leadId: row.lead_id,
  status: row.status,
  title: row.title,
  detail: row.detail,
  errorMessage: row.error_message,
  isTest: row.is_test,
})

export async function listRemoteAutomationRules() {
  if (!supabase) return []
  const { error: initializationError } = await supabase.rpc('initialize_automation_rules')
  if (initializationError) throw initializationError
  const { data, error } = await supabase.from('automation_rules').select('*').order('created_at')
  if (error) throw error
  return (data as AutomationRuleRow[]).map(toRule)
}

export async function listRemoteAutomationEvents(limit = 50) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('automation_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as AutomationEventRow[]).map(toEvent)
}

export async function setRemoteAutomationRuleEnabled(id: string, enabled: boolean) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('automation_rules')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return toRule(data as AutomationRuleRow)
}

export async function testRemoteAutomationRule(id: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .rpc('test_automation_rule', { target_rule_id: id })
    .single()
  if (error) throw error
  return toEvent(data as AutomationEventRow)
}

export async function runRemoteDueAutomations() {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.rpc('process_due_automations')
  if (error) throw error
  return Number(data ?? 0)
}
