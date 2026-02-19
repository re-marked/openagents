# OpenClaw SKILL.md Format Specification

Research date: 2026-02-18

## Overview
A skill = a directory containing SKILL.md (required) + optional companion files.
The directory name becomes the skill identifier (e.g., `skills/github` → skill name `github`).
Skills are pure documentation injected into the agent system prompt — they do NOT define new tool APIs.
They teach the agent HOW to use existing tools.

## Directory Structure
```
skills/
└── my-skill/
    ├── SKILL.md          # Required - frontmatter + instructions
    ├── package.json      # Optional - metadata
    ├── install.sh        # Optional - setup script (NOT auto-executed)
    └── config.json       # Optional - configuration schema
```

## SKILL.md Format
```markdown
---
name: my-skill
description: Brief explanation of what this skill does
emoji: 🔧
requires:
  tools:
    - exec
    - web_fetch
  binaries:
    - gh
    - jq
  env:
    - GITHUB_TOKEN
    - MY_API_KEY
install: |
  npm install -g some-package
  brew install some-tool
config:
  - key: API_URL
    description: "The API endpoint URL"
  - key: API_KEY
    description: "Your API key"
user-invocable: true
disable-model-invocation: false
command-dispatch: tool
command-tool: exec
homepage: https://example.com
---

# My Skill Title

Natural language instructions to the agent about how to use this skill.
Write in first person ("When asked to X, use the exec tool to...").

## Usage

Describe common use cases and workflows.

## Examples

Provide concrete examples of what the agent should do.
```

## YAML Frontmatter Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | dir name | Unique identifier (lowercase, hyphens) |
| `description` | string | — | Brief what-it-does |
| `emoji` | string | — | Icon shown when skill activates |
| `requires.tools` | string[] | [] | Tools that must be available for skill to load |
| `requires.binaries` | string[] | [] | CLI binaries that must be on PATH |
| `requires.env` | string[] | [] | Env vars that must be set |
| `install` | string | — | Shell commands run during skill setup |
| `config` | array | [] | User config keys (with key + description) |
| `user-invocable` | boolean | true | Whether users can invoke skill by name |
| `disable-model-invocation` | boolean | false | Bypass model when skill invoked |
| `command-dispatch` | string | — | When set to "tool", slash command dispatches directly to tool |
| `command-tool` | string | — | Tool to invoke when command-dispatch: tool |
| `homepage` | string | — | URL shown as "Website" in macOS Skills UI |

## Frontmatter Metadata Alternative Format
Some skills use single-line JSON metadata (required by embedded agent parser):
```yaml
metadata: {"openclaw":{"requires":{"bins":["gh"],"env":["GITHUB_TOKEN"]},"homepage":"https://..."}}
```

## Environment Variable Substitution
During loading, `${VAR_NAME}` syntax is replaced from:
- Process environment
- `skills.entries[name].env` config
- `~/.openclaw/.env`

## Skill Loading Precedence
1. Workspace skills: `${workspaceDir}/skills/` — highest priority
2. Agent skills: `${agentDir}/skills/`
3. Managed/local skills: `~/.openclaw/skills/`
4. Bundled skills — lowest priority (controlled via `skills.allowBundled`)
5. Extra dirs: `skills.load.extraDirs`

Name conflicts: workspace skills override all others.

## Filtering at Load Time
Skills are filtered OUT if:
- Required binary not on PATH
- Required env var not set
- Required tool denied by policy
- OS incompatible
- Explicitly disabled in `skills.entries[name].enabled: false`

## System Prompt Injection
Skills inject when:
1. Skill loaded (passes above filters)
2. At least one `requires.tools` entry is in effective tool policy
3. Session prompt mode includes skills

Injection format:
```
[Skills Section]
  ## skill-name
  [Content of SKILL.md body (markdown only, no frontmatter)]
```

## Configuration in openclaw.json
```json5
{
  skills: {
    allowBundled: ["github", "slack"],  // empty = all bundled allowed
    load: {
      extraDirs: ["./custom-skills"],
      watch: true,
      watchDebounceMs: 1000
    },
    entries: {
      github: {
        enabled: true,
        env: {
          GITHUB_TOKEN: "${GITHUB_TOKEN}"
        },
        config: {
          REPO_DEFAULT: "myorg/myrepo"
        }
      }
    }
  }
}
```

## Security Warning
- Skills are NOT cryptographically signed
- ClawHub requires only a week-old GitHub account to publish
- Third-party skills should be treated as untrusted code
- Read SKILL.md content before enabling
- install.sh is NOT auto-executed — requires explicit user action
- ClawHavoc (Jan 2026): ~12% of ClawHub skills were malicious (Atomic Stealer malware)

## ClawHub Registry
- URL: clawhub.ai (official), clawhub.biz (community)
- CLI: `clawhub install <slug>`, `clawhub update --all`, `clawhub sync --all`
- 3,286+ skills, 1.5M+ downloads, 800+ developers
- Categories: AI/ML (1,588), Utility (1,520), Development (976), Productivity (822),
  Web (637), Science (598), Media (365), Social (364), Finance (311), Location (153), Business (151)
- Search: vector embeddings (text-embedding-3-small) + Convex
- Versioning: semver, changelogs, downloadable versions
- Publishing: `openclaw skill validate` → `openclaw auth login` → `openclaw skill publish ./skill-name`
- Security: VirusTotal scanning; 3 independent reports auto-hide suspicious skills
- Monetization: NO built-in payment system; devs use freemium SaaS or consulting pipeline
- Daily installs: ~15,000
- Backend: TanStack Start + Convex + GitHub OAuth (clawhub repo: 2.3k stars, 515 forks)
