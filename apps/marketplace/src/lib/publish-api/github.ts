const GITHUB_API = 'https://api.github.com'

interface GithubFetchOptions {
  githubToken?: string
}

async function githubFetch(path: string, opts?: GithubFetchOptions) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }

  // Use caller's token for private repos, fall back to server token for rate limits
  const token = opts?.githubToken ?? process.env.GITHUB_API_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }
  return res
}

/**
 * Get the default branch for a repo.
 */
export async function getDefaultBranch(
  repo: string,
  githubToken?: string
): Promise<string> {
  const res = await githubFetch(`/repos/${repo}`, { githubToken })
  const data = await res.json()
  return data.default_branch ?? 'main'
}

export interface FileCheck {
  path: string
  found: boolean
  required: boolean
}

const REQUIRED_FILES = ['agent.yaml', 'agentbay.yaml', 'README.md']
const OPTIONAL_FILES = ['.skills', 'SOUL.md', 'IDENTITY.md']

/**
 * Validate that a repo contains the required files.
 */
export async function validateRepoFiles(
  repo: string,
  branch?: string,
  githubToken?: string
): Promise<{ valid: boolean; files: FileCheck[]; branch: string }> {
  const ref = branch ?? (await getDefaultBranch(repo, githubToken))

  const allFiles = [
    ...REQUIRED_FILES.map((p) => ({ path: p, required: true })),
    ...OPTIONAL_FILES.map((p) => ({ path: p, required: false })),
  ]

  const checks = await Promise.all(
    allFiles.map(async (file) => {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github.v3+json',
        }
        const token = githubToken ?? process.env.GITHUB_API_TOKEN
        if (token) headers.Authorization = `Bearer ${token}`

        const res = await fetch(
          `${GITHUB_API}/repos/${repo}/contents/${file.path}?ref=${ref}`,
          { headers }
        )
        return { path: file.path, found: res.ok, required: file.required }
      } catch {
        return { path: file.path, found: false, required: file.required }
      }
    })
  )

  const valid = checks.filter((c) => c.required).every((c) => c.found)
  return { valid, files: checks, branch: ref }
}

/**
 * Fetch a file's raw content from a GitHub repo.
 * Works for public repos without a token; private repos need githubToken.
 */
export async function fetchRepoFile(
  repo: string,
  path: string,
  branch?: string,
  githubToken?: string
): Promise<string> {
  const ref = branch ?? 'main'
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
  }
  const token = githubToken ?? process.env.GITHUB_API_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${ref}`,
    { headers }
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch ${repo}/${path}@${ref}: ${res.status}`)
  }
  return res.text()
}
