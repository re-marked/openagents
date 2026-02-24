# delegate_to_agent

Delegate a task to a specialized sub-agent. The sub-agent runs independently and returns results when done. Use this when a task requires focused expertise or can be done in parallel.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agent_type` | string | yes | The type of sub-agent: `researcher`, `coder`, `analyst`, `writer` |
| `task` | string | yes | Clear description of what the sub-agent should do |
| `context` | string | no | Background information the sub-agent needs to do the job |
| `deliverable` | string | no | What format the result should be in (e.g. "summary", "code", "list", "report") |

## Agent Types

| Type | Specialization |
|------|---------------|
| `researcher` | Web search, documentation lookup, fact-finding |
| `coder` | Write, debug, or review code |
| `analyst` | Data analysis, comparison, decision frameworks |
| `writer` | Draft text, emails, documentation, creative writing |

## Return Value

```json
{
  "status": "completed" | "failed",
  "agent_type": "researcher",
  "result": "The sub-agent's output text",
  "duration_ms": 12340
}
```

## Example Calls

```json
{
  "tool": "delegate_to_agent",
  "params": {
    "agent_type": "researcher",
    "task": "Find the latest pricing for Fly.io Machines with 2GB RAM",
    "deliverable": "summary"
  }
}
```

```json
{
  "tool": "delegate_to_agent",
  "params": {
    "agent_type": "coder",
    "task": "Write a TypeScript function that converts Markdown to plain text",
    "context": "Node.js 22, no external dependencies",
    "deliverable": "code"
  }
}
```
