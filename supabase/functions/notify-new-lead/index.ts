import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { leadId } = (await request.json()) as { leadId?: string }
    if (!leadId) throw new Error('leadId is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, client_name, service_type, urgency, phone, email')
      .eq('id', leadId)
      .single()
    if (error) throw error

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
    if (!token || !chatId) throw new Error('Telegram secrets are not configured')

    const message = [
      `🛠 New FlowLead request ${lead.id}`,
      `${lead.client_name} · ${lead.service_type}`,
      `Urgency: ${lead.urgency}`,
      `Contact: ${lead.phone || lead.email}`,
    ].join('\n')

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
    if (!telegramResponse.ok) throw new Error(`Telegram returned ${telegramResponse.status}`)

    return new Response(JSON.stringify({ delivered: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
