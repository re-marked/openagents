'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { YamlEditor } from './yaml-editor'
import { AgentPreview } from './agent-preview'
import { ArrowRight } from 'lucide-react'

interface AgentEditorProps {
  repoFullName: string
  branch: string
  initialYaml: string
  readmeContent: string
  agentYamlContent: string
}

export function AgentEditor({ repoFullName, branch, initialYaml, readmeContent, agentYamlContent }: AgentEditorProps) {
  const router = useRouter()
  const [yamlContent, setYamlContent] = useState(initialYaml)

  const handlePublish = () => {
    const params = new URLSearchParams({
      repo: repoFullName,
      branch,
    })
    // Store YAML in sessionStorage for the review page
    sessionStorage.setItem('openagents-yaml', yamlContent)
    sessionStorage.setItem('openagents-readme', readmeContent)
    sessionStorage.setItem('openagents-agent-yaml', agentYamlContent)
    router.push(`/agents/new/review?${params.toString()}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <ResizablePanelGroup className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">openagents.yaml</span>
            </div>
            <div className="flex-1">
              <YamlEditor value={yamlContent} onChange={setYamlContent} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Marketplace Preview</span>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <AgentPreview yamlContent={yamlContent} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom bar */}
      <div className="flex items-center justify-end gap-3 border-t px-6 py-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Back
        </button>
        <button
          onClick={handlePublish}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Review & Publish
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
