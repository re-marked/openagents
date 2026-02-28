import { NextResponse } from 'next/server'
import { authenticatePublishToken, AuthError } from '@/lib/publish-api/auth'
import { validateRepoFiles, fetchRepoFile } from '@/lib/publish-api/github'
import {
  validateAgentBayYaml,
  scanForSecrets,
} from '@/lib/publish-api/schema'

/**
 * POST /api/v1/agents/validate — Validate a repo has required files + valid schema.
 * Auth: Bearer ab_pub_<token>
 */
export async function POST(request: Request) {
  try {
    await authenticatePublishToken(request)
    const body = await request.json()

    if (!body.repo || typeof body.repo !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: repo' },
        { status: 422 }
      )
    }

    const fileCheck = await validateRepoFiles(
      body.repo,
      body.branch,
      body.github_token
    )

    let metadata = null
    let errors: string[] = []
    let secrets: string[] = []

    // If agentbay.yaml exists, validate its contents
    const yamlFile = fileCheck.files.find((f) => f.path === 'agentbay.yaml')
    if (yamlFile?.found) {
      const yamlContent = await fetchRepoFile(
        body.repo,
        'agentbay.yaml',
        fileCheck.branch,
        body.github_token
      )
      const validation = validateAgentBayYaml(yamlContent)
      metadata = validation.parsed
      errors = validation.errors

      secrets = scanForSecrets(yamlContent)
    }

    // Also scan README if it exists
    const readmeFile = fileCheck.files.find((f) => f.path === 'README.md')
    if (readmeFile?.found) {
      const readmeContent = await fetchRepoFile(
        body.repo,
        'README.md',
        fileCheck.branch,
        body.github_token
      )
      secrets.push(...scanForSecrets(readmeContent))
    }

    return NextResponse.json({
      valid: fileCheck.valid && errors.length === 0 && secrets.length === 0,
      files: fileCheck.files,
      metadata,
      errors: [...errors, ...secrets.map((s) => `Security: ${s}`)],
      branch: fileCheck.branch,
    })
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message =
      e instanceof Error ? e.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
