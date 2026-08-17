import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-flowlead-webhook-secret',
}

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

interface DeliveryRequest {
  eventId?: string
  testRuleId?: string
  type?: string
  table?: string
  schema?: string
  record?: { id?: string; service_type?: string; urgency?: string }
}

interface AutomationEventRow {
  id: string
  created_at: string
  owner_id: string
  rule_id: string
  lead_id: string | null
  status: 'success' | 'pending' | 'failed' | 'skipped'
  title: string
  detail: string
  error_message: string
  is_test: boolean
  attempt_count: number
}

interface LeadSummary {
  id: string
  service_type: string
  urgency: string
}

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders })

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return String(error)
}

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('Authorization') ?? ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

const publicEvent = (event: AutomationEventRow) => ({
  id: event.id,
  created_at: event.created_at,
  rule_id: event.rule_id,
  lead_id: event.lead_id,
  status: event.status,
  title: event.title,
  detail: event.detail,
  error_message: event.error_message,
  is_test: event.is_test,
  attempt_count: event.attempt_count,
})

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey) {
    return response({ error: 'Supabase runtime secrets are not configured' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  let event: AutomationEventRow | null = null

  try {
    const body = (await request.json()) as DeliveryRequest
    const isLeadWebhook =
      body.type === 'INSERT' &&
      body.schema === 'public' &&
      body.table === 'leads' &&
      body.record?.id
    const requestModes = [isLeadWebhook, body.eventId, body.testRuleId].filter(Boolean)
    if (requestModes.length !== 1) {
      return response({ error: 'Unsupported delivery request' }, 400)
    }

    let lead: LeadSummary | null = null

    if (isLeadWebhook) {
      const configuredSecret = Deno.env.get('AUTOMATION_WEBHOOK_SECRET') ?? ''
      const suppliedSecret = request.headers.get('x-flowlead-webhook-secret') ?? ''
      if (!configuredSecret || suppliedSecret !== configuredSecret) {
        return response({ error: 'Invalid webhook signature' }, 401)
      }

      const { data: queuedEvent, error: eventError } = await admin
        .from('automation_events')
        .select('*')
        .eq('lead_id', body.record!.id!)
        .eq('status', 'pending')
        .eq('is_test', false)
        .like('dedupe_key', 'new-lead-telegram:%')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (eventError) throw eventError
      if (!queuedEvent) return response({ delivered: false, reason: 'No queued Telegram rule' })
      event = queuedEvent as AutomationEventRow
      lead = {
        id: body.record!.id!,
        service_type: body.record!.service_type ?? 'Not specified',
        urgency: body.record!.urgency ?? 'Standard',
      }

      const { data: startedEvent, error: startError } = await admin
        .from('automation_events')
        .update({ attempt_count: 1, last_attempt_at: new Date().toISOString() })
        .eq('id', event.id)
        .eq('status', 'pending')
        .select('*')
        .single()
      if (startError) throw startError
      event = startedEvent as AutomationEventRow
    } else {
      const token = getBearerToken(request)
      const { data: authData, error: authError } = await admin.auth.getUser(token)
      if (authError || !authData.user) return response({ error: 'Authentication is required' }, 401)

      if (body.testRuleId) {
        const { data: rule, error: ruleError } = await admin
          .from('automation_rules')
          .select('id, owner_id, title, enabled, key')
          .eq('id', body.testRuleId)
          .eq('owner_id', authData.user.id)
          .eq('key', 'new-lead-telegram')
          .single()
        if (ruleError || !rule) return response({ error: 'Telegram rule was not found' }, 404)
        if (!rule.enabled)
          return response({ error: 'Enable the Telegram rule before testing it' }, 409)

        const { data: createdEvent, error: eventError } = await admin
          .from('automation_events')
          .insert({
            owner_id: rule.owner_id,
            rule_id: rule.id,
            status: 'pending',
            title: `${rule.title} test started`,
            detail: 'Telegram integration check',
            is_test: true,
            attempt_count: 1,
            last_attempt_at: new Date().toISOString(),
          })
          .select('*')
          .single()
        if (eventError) throw eventError
        event = createdEvent as AutomationEventRow
      } else {
        const { data: retryEvent, error: retryError } = await admin
          .from('automation_events')
          .select('*')
          .eq('id', body.eventId!)
          .eq('owner_id', authData.user.id)
          .eq('status', 'failed')
          .single()
        if (retryError || !retryEvent) {
          return response({ error: 'Failed Telegram event was not found' }, 404)
        }
        event = retryEvent as AutomationEventRow

        const { data: selectedLead, error: leadError } = await admin
          .from('leads')
          .select('id, service_type, urgency')
          .eq('id', event.lead_id!)
          .single()
        if (leadError) throw leadError
        lead = selectedLead as LeadSummary
      }
    }

    if (!event) throw new Error('Automation event was not initialized')

    const { data: rule, error: ruleError } = await admin
      .from('automation_rules')
      .select('id')
      .eq('id', event.rule_id)
      .eq('key', 'new-lead-telegram')
      .eq('enabled', true)
      .single()
    if (ruleError || !rule) {
      await admin
        .from('automation_events')
        .update({ status: 'skipped', detail: 'Telegram rule was paused before delivery.' })
        .eq('id', event.id)
      return response({ delivered: false, reason: 'Telegram rule is paused' }, 409)
    }

    if (body.eventId) {
      const { data: updatedEvent, error: updateError } = await admin
        .from('automation_events')
        .update({
          status: 'pending',
          error_message: '',
          attempt_count: Number(event.attempt_count ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .select('*')
        .single()
      if (updateError) throw updateError
      event = updatedEvent as AutomationEventRow
    }

    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
    if (!telegramToken || !chatId) throw new Error('Telegram secrets are not configured')

    const message = event.is_test
      ? ['FlowLead Telegram test', 'The integration is configured and ready.'].join('\n')
      : [
          `New FlowLead request ${lead!.id}`,
          `Service: ${lead!.service_type}`,
          `Urgency: ${lead!.urgency}`,
          'Open FlowLead CRM to view contact details.',
        ].join('\n')

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      },
    )
    const telegramResult = (await telegramResponse.json()) as {
      ok?: boolean
      description?: string
      result?: { message_id?: number }
    }
    if (!telegramResponse.ok || !telegramResult.ok) {
      throw new Error(telegramResult.description || `Telegram returned ${telegramResponse.status}`)
    }

    const { data: deliveredEvent, error: deliveryError } = await admin
      .from('automation_events')
      .update({
        status: 'success',
        title: event.is_test
          ? 'Telegram notification test completed'
          : 'Telegram notification sent',
        detail: event.is_test ? 'Test message delivered to Telegram.' : lead!.id,
        error_message: '',
        provider_message_id: String(telegramResult.result?.message_id ?? ''),
      })
      .eq('id', event.id)
      .select('*')
      .single()
    if (deliveryError) throw deliveryError

    return response({ delivered: true, event: publicEvent(deliveredEvent as AutomationEventRow) })
  } catch (error) {
    const message = getErrorMessage(error)
    let failedEvent: AutomationEventRow | null = null
    if (event) {
      const { data } = await admin
        .from('automation_events')
        .update({ status: 'failed', title: 'Telegram delivery failed', error_message: message })
        .eq('id', event.id)
        .select('*')
        .single()
      failedEvent = (data as AutomationEventRow | null) ?? null
    }
    return response(
      { error: message, event: failedEvent ? publicEvent(failedEvent) : null },
      event ? 502 : 400,
    )
  }
})
