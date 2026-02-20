/**
 * Supabase Edge Function: on-purchase-created
 *
 * Triggered by a Supabase DB Webhook on INSERT to `agent_instances`
 * where status = 'provisioning'.
 *
 * Flow:
 *   DB insert → webhook → this function → Trigger.dev → provision-agent-machine task
 */

const TRIGGER_API_URL = 'https://api.trigger.dev/api/v1/tasks/provision-agent-machine/trigger'

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: { record: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const record = body.record
  if (!record || record['status'] !== 'provisioning') {
    // Not a provisioning event — skip
    return new Response('skip', { status: 200 })
  }

  const payload = {
    userId: record['user_id'] as string,
    agentId: record['agent_id'] as string,
    instanceId: record['id'] as string,
  }

  // Trigger the provisioning task — fire and forget (ack immediately)
  const triggerRes = await fetch(TRIGGER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('TRIGGER_SECRET_KEY')}`,
    },
    body: JSON.stringify({ payload }),
  })

  if (!triggerRes.ok) {
    const err = await triggerRes.text()
    console.error('Failed to trigger provisioning task:', err)
    return new Response('Failed to enqueue task', { status: 500 })
  }

  const { id: runId } = await triggerRes.json()
  console.log('Provisioning task triggered:', runId, payload)

  return new Response(JSON.stringify({ ok: true, runId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
