# Relay Integrations

## Overview

Agents are accessible through multiple messaging platforms ("relays"). Each relay has different constraints: response time limits, no streaming support, and different authentication models.

```
Platform        Delivery        Response Window   Streaming?   Auth
─────────────   ──────────────  ─────────────── ──────────── ──────────
Telegram        Webhook POST    60 seconds        No          Bot token
WhatsApp        Webhook POST    20 seconds        No          HMAC SHA256
Slack           Webhook POST    3 seconds (ack)   No          HMAC signing
Discord (HTTP)  Webhook POST    3 seconds (ack)   No          Ed25519
Discord (WS)    Gateway WS      N/A               No          Bot token
```

**Key constraint:** None of these platforms support SSE streaming. Agent responses are collected in full, then sent as a single message.

---

## Architecture Pattern

All relays follow the same async pattern:

```
Platform → Supabase Edge Function (immediate ack) → Queue → Trigger.dev → Fly.io → respond
```

1. **Ingestion:** Edge Function receives webhook, immediately returns 200 OK
2. **Enqueue:** Message placed in processing queue (Supabase DB insert or Upstash QStash)
3. **Process:** Trigger.dev task picks up message, routes to correct Fly.io Machine
4. **Collect:** Full response collected from Agent (no streaming — relay doesn't support it)
5. **Respond:** Response sent back to the platform via their API

---

## Telegram

Priority: P1 (first relay after web, simplest integration)

```typescript
// Webhook setup (one-time)
POST https://api.telegram.org/bot{TOKEN}/setWebhook
Body: {
  url: "https://{SUPABASE_PROJECT}.supabase.co/functions/v1/telegram-webhook",
  max_connections: 40,
  allowed_updates: ["message", "callback_query"]
}

// Edge Function handler
Deno.serve(async (req) => {
  const update = await req.json();
  const chatId = update.message?.chat?.id;
  const text = update.message?.text;
  const telegramUserId = update.message?.from?.id;

  // Immediate ack
  EdgeRuntime.waitUntil(
    processRelayMessage("telegram", telegramUserId, text, chatId)
  );
  return new Response("ok");
});
```

**Response format:** Plain text messages. Markdown supported (bold, italic, code blocks). Max 4096 characters per message (split longer responses).

**Typing indicator:** Send `sendChatAction("typing")` while the Agent is processing. Creates a good UX ("Assistant is typing...").

---

## WhatsApp (P2)

Uses Meta's Cloud API. On-Premises API was deprecated October 2025.

**Setup gotcha:** After registering webhooks, you MUST call the WABA-to-App subscription endpoint. Without it, webhooks silently fail:

```bash
POST https://graph.facebook.com/v18.0/{WABA_ID}/subscribed_apps
Authorization: Bearer {SYSTEM_USER_TOKEN}
```

**24-hour window rule:** After a user messages you, you can reply freely for 24 hours. After that, you can only send pre-approved message templates. For Agent use, this means:
- Reactive conversations: user initiates → Agent responds (always works within 24h)
- Proactive notifications: Agent needs to message first → requires approved template

**Template approval:** Takes 1-7 days from Meta. Pre-approve templates like:
- "Your assistant has completed the task you requested. Reply to see results."
- "Daily briefing from your assistant is ready. Reply to view."

---

## Slack (P2)

Uses Events API (HTTP webhooks, not Socket Mode) for production.

**3-second challenge:** Slack requires a response within 3 seconds for interactions. For Agent responses that take longer:

```typescript
// Immediately ack with 200
// Use response_url to send the actual response later (valid for 30 min)
export async function POST(req: Request) {
  const body = await req.text();
  if (!verifySlackSignature(req, body)) return new Response("", { status: 401 });

  const payload = JSON.parse(body);

  // Fire and forget — process async
  processSlackMessage(payload);

  return new Response("", { status: 200 }); // immediate ack
}

async function processSlackMessage(payload) {
  const response = await callAgent(payload.event.text);

  // Use response_url for deferred responses
  await fetch(payload.response_url, {
    method: "POST",
    body: JSON.stringify({ text: response }),
  });
}
```

**Rate limits:** `chat.postMessage` is Tier 3: 50 requests/minute. Sufficient for most use cases.

---

## Discord (P2-P3)

Two integration paths:

### HTTP Interactions (Serverless-Compatible)
- Handles slash commands, buttons, select menus, modals
- Works on Vercel / Edge Functions
- Limited: cannot read messages, cannot monitor channels

```typescript
// Defer immediately (type 5), respond later
return Response.json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE

// Follow up within 15 minutes
await fetch(
  `https://discord.com/api/v10/webhooks/${APP_ID}/${token}/messages/@original`,
  { method: "PATCH", body: JSON.stringify({ content: response }) }
);
```

### Gateway WebSocket (Full Bot)
- Full message access, presence, reactions, @mentions
- Requires persistent WebSocket connection
- **Cannot run on Vercel** — needs dedicated Fly.io Machine

```typescript
// Dedicated Fly.io Machine (autostop: "off", ~$1.94/month)
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user!)) return;

  const instance = await getMachineForDiscordUser(message.author.id);
  await message.channel.sendTyping();
  const response = await callAgent(instance, message.content);
  await message.reply(response);
});
```

**Recommendation:** Start with HTTP Interactions for slash commands. Add Gateway WebSocket later for full @mention support.

---

## Relay Routing

When a message arrives from any relay, we need to route it to the correct Agent Machine:

```sql
-- Look up: external platform user → OpenAgents user → Agent instance → Fly.io machine
SELECT ai.fly_app_name, ai.fly_machine_id
FROM relay_connections rc
JOIN agent_instances ai ON ai.id = rc.instance_id
WHERE rc.relay = 'telegram'
  AND rc.external_user_id = '123456789'
  AND rc.status = 'active';
```

If no relay connection exists: prompt the user to link their account on the OpenAgents website.

---

## Relay Connection Flow

How a user connects Telegram to their Agent:

1. User goes to Agent status page → Relays section
2. Clicks "Connect Telegram"
3. OpenAgents generates a unique link: `https://t.me/OpenAgentsBot?start={token}`
4. User clicks the link → opens Telegram → sends /start to the bot
5. Bot receives the token, validates it, links Telegram user to OpenAgents user + Agent instance
6. Stores relay_connection record in Supabase
7. From now on: messages from this Telegram user are routed to this Agent
