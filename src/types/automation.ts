export type AutomationTrigger =
  'lead_created' | 'lead_status_changed' | 'lead_unanswered' | 'appointment_upcoming'

export type AutomationAction = 'in_app' | 'telegram' | 'email' | 'owner_reminder'

export type AutomationEventStatus = 'success' | 'pending' | 'failed' | 'skipped'

export interface AutomationRule {
  id: string
  key: string
  title: string
  description: string
  triggerType: AutomationTrigger
  triggerLabel: string
  actionType: AutomationAction
  actionLabel: string
  delayMinutes: number
  enabled: boolean
  requiresIntegration: boolean
  updatedAt: string
}

export interface AutomationEvent {
  id: string
  createdAt: string
  ruleId: string
  leadId: string | null
  status: AutomationEventStatus
  title: string
  detail: string
  errorMessage: string
  isTest: boolean
}
