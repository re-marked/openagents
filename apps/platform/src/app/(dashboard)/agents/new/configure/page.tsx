import { getRepoFile } from '@/lib/github/actions'
import { AgentEditor } from '@/components/agent-editor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ConfigurePageProps {
  searchParams: Promise<{ repo?: string; branch?: string }>
}

export default async function ConfigurePage({ searchParams }: ConfigurePageProps) {
  const { repo, branch } = await searchParams

  if (!repo) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No repository selected.</p>
          <Link href="/agents/new" className="mt-2 text-sm text-primary hover:underline">
            Go back
          </Link>
        </div>
      </div>
    )
  }

  let yamlContent = ''
  let readmeContent = ''
  let agentYamlContent = ''

  try {
    const [yaml, readme, agentYaml] = await Promise.allSettled([
      getRepoFile(repo, 'openagents.yaml', branch),
      getRepoFile(repo, 'README.md', branch),
      getRepoFile(repo, 'agent.yaml', branch),
    ])
    yamlContent = yaml.status === 'fulfilled' ? yaml.value : getDefaultOpenagentsYaml(repo)
    readmeContent = readme.status === 'fulfilled' ? readme.value : ''
    agentYamlContent = agentYaml.status === 'fulfilled' ? agentYaml.value : ''
  } catch {
    yamlContent = getDefaultOpenagentsYaml(repo)
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Link
          href="/agents/new"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-sm font-medium">Configure Agent</h1>
          <p className="text-xs text-muted-foreground">{repo}</p>
        </div>
      </div>

      <AgentEditor
        repoFullName={repo}
        branch={branch ?? 'main'}
        initialYaml={yamlContent}
        readmeContent={readmeContent}
        agentYamlContent={agentYamlContent}
      />
    </div>
  )
}

function getDefaultOpenagentsYaml(repo: string): string {
  const name = repo.split('/').pop() ?? 'my-agent'
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return `name: "${name}"
slug: "${slug}"
tagline: "A brief description of what this agent does"
description: |
  Describe your agent in detail. What problems does it solve?
  What makes it unique?

category: "productivity"
icon: "./assets/icon.png"

pricing:
  model: "free"
  credits: null

capabilities:
  - "Capability one"
  - "Capability two"

models:
  primary: "any"
  minimum: "claude-sonnet"

tags:
  - ${slug}

version: "1.0.0"
`
}
