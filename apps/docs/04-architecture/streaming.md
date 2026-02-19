# Streaming Architecture

## The Problem

Users expect real-time, token-by-token streaming when chatting with an Agent. But the Agent runs on Fly.io, the frontend runs on Vercel, and Vercel functions can't reach Fly.io's private network (6PN). Next.js also has a known SSE buffering issue that silently buffers entire responses instead of streaming them.

## The Solution

Three-hop streaming with buffering fixes at each layer.

```
Browser ──SSE──► Vercel Route Handler ──fetch──► Fly.io SSE Gateway ──6PN──► Agent Machine
                                                    (fly-replay)              (OpenClaw)
```

---

## Hop 1: Agent Machine → SSE Gateway (Fly.io internal)

The Agent Machine's OpenClaw instance exposes a streaming endpoint. The SSE Gateway app on Fly.io routes requests to the correct Machine using `fly-replay`.

```typescript
// SSE Gateway app on Fly.io (thin router)
export async function POST(req: Request) {
  const { machineId, appName } = await req.json();

  // fly-replay routes to the specific Agent Machine
  return new Response(null, {
    status: 307,
    headers: {
      "fly-replay": `instance=${machineId},app=${appName}`,
    },
  });
}
```

Latency: ~10ms (same datacenter, 6PN internal).

## Hop 2: SSE Gateway → Vercel Route Handler

Vercel fetches the SSE stream from the Fly.io Gateway's public URL.

**Critical: The Next.js buffering fix.**

The default behavior of Next.js route handlers is to buffer the entire response before sending. To fix this, you MUST:

1. Return a `ReadableStream` immediately
2. Set `X-Accel-Buffering: no` header
3. Use Node.js runtime (not Edge — Edge can't reach external URLs reliably for long connections)

```typescript
// apps/marketplace/app/api/chat/stream/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // seconds (Vercel Pro)

export async function POST(req: Request) {
  const { sessionId, message } = await req.json();
  const user = await getAuthenticatedUser(req);
  const instance = await getAgentInstance(user.id, sessionId);

  // Check credits before starting
  const balance = await getCreditBalance(user.id);
  if (balance < MINIMUM_SESSION_CREDITS) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Handle client disconnect
      req.signal.addEventListener("abort", () => controller.close());

      try {
        // Fetch SSE from Fly.io Gateway (public URL, not 6PN)
        const response = await fetch(
          `https://${instance.fly_app_name}.fly.dev/v1/responses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${instance.gateway_token}`,
            },
            body: JSON.stringify({
              input: [{ role: "user", content: message }],
              stream: true,
            }),
            signal: req.signal,
          }
        );

        const reader = response.body!.getReader();
        let totalTokens = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Forward chunk to browser
          controller.enqueue(value);

          // Also broadcast via Supabase Realtime (fire-and-forget)
          const text = new TextDecoder().decode(value);
          broadcastChunk(sessionId, text).catch(() => {});
          totalTokens += estimateTokens(text);
        }

        // Signal stream end
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        // Post-stream: meter usage, deduct credits (async, don't block)
        meterUsage(user.id, instance.id, sessionId, totalTokens).catch(console.error);

      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // CRITICAL: disables nginx/Vercel buffering
    },
  });
}
```

## Hop 3: Vercel → Browser

Standard EventSource / fetch with ReadableStream on the client.

```typescript
// Client-side: apps/marketplace/hooks/use-chat-stream.ts
"use client";

export function useChatStream(sessionId: string) {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setResponse("");

    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") { setIsStreaming(false); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) setResponse(prev => prev + parsed.token);
            if (parsed.error) console.error("Stream error:", parsed.error);
          } catch {} // non-JSON SSE lines
        }
      }
    }
    setIsStreaming(false);
  };

  return { response, isStreaming, sendMessage };
}
```

---

## Supabase Realtime (Multi-Device Sync)

In addition to the direct SSE stream, we broadcast tokens via Supabase Realtime. This enables:
- Multi-device: user starts chat on laptop, watches response on phone
- Multi-tab: response appears in all open tabs
- Relay echo: Telegram user sees the response even though it was sent via web

We use **Broadcast** (not Postgres Changes) because:
- Broadcast scales horizontally across Supabase nodes
- Postgres Changes is single-threaded and doesn't benefit from compute upgrades
- Broadcast doesn't require writing to the database on every token

```typescript
// Server: broadcast each token chunk
const channel = supabase.channel(`session:${sessionId}`);
await channel.send({
  type: "broadcast",
  event: "token",
  payload: { text: chunk, done: false },
});
```

After streaming completes, the full message is written to the `messages` table once.

---

## Vercel Limits

| Plan | Max Duration (Fluid Compute) | Max Duration (Standard) |
|------|------------------------------|------------------------|
| Hobby | 300s (5 min) | 60s |
| Pro | 800s (~13 min) | 300s (5 min) |
| Enterprise | 800s | 900s (15 min) |

For most Agent sessions (10-30 minutes), Vercel Pro's 800s is sufficient. For longer background tasks, we use a different architecture (Trigger.dev collects the result, stores in Supabase, notifies user).

---

## Alternative: SSE Gateway as Dedicated Fly.io App

For maximum reliability, deploy the SSE proxy itself as a Fly.io App instead of a Vercel route handler. This eliminates Vercel's timeout limits and gives direct 6PN access.

```
Browser ──SSE──► Fly.io SSE Gateway ──6PN──► Agent Machine
                 (has direct 6PN access)
```

Vercel handles auth + credit check, then redirects to the SSE Gateway URL. The SSE Gateway handles the actual streaming.

This is the recommended architecture for production at scale.
