'use server'

import { createClient as createServerClient } from '@agentbay/db/server'

const GITHUB_API = 'https://api.github.com'

async function getGitHubToken(): Promise<string> {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    throw new Error('No GitHub token — please sign in again')
  }
  return session.provider_token
}

async function githubFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }
  return res
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  private: boolean
  updated_at: string
  html_url: string
  default_branch: string
}

export interface RepoListResult {
  repos: GitHubRepo[]
  hasMore: boolean
}

export async function listRepos(page = 1, search?: string): Promise<RepoListResult> {
  const token = await getGitHubToken()
  const perPage = 30

  if (search && search.trim()) {
    // Search user's repos via GitHub search API
    const q = encodeURIComponent(`${search.trim()} in:name user:@me`)
    const res = await githubFetch(`/search/repositories?q=${q}&per_page=${perPage}&page=${page}&sort=updated`, token)
    const data = await res.json()
    return {
      repos: (data.items ?? []).map(mapRepo),
      hasMore: data.total_count > page * perPage,
    }
  }

  // List user repos sorted by most recently pushed
  const res = await githubFetch(`/user/repos?per_page=${perPage}&page=${page}&sort=pushed&affiliation=owner`, token)
  const data = await res.json()
  return {
    repos: (data ?? []).map(mapRepo),
    hasMore: data.length === perPage,
  }
}

function mapRepo(r: Record<string, unknown>): GitHubRepo {
  return {
    id: r.id as number,
    name: r.name as string,
    full_name: r.full_name as string,
    description: r.description as string | null,
    language: r.language as string | null,
    private: r.private as boolean,
    updated_at: r.updated_at as string,
    html_url: r.html_url as string,
    default_branch: r.default_branch as string,
  }
}

export interface FileCheck {
  path: string
  label: string
  required: boolean
  exists: boolean
}

export interface ValidationResult {
  valid: boolean
  checks: FileCheck[]
  defaultBranch: string
}

const REQUIRED_FILES = [
  { path: 'agent.yaml', label: 'agent.yaml', required: true },
  { path: 'agentbay.yaml', label: 'agentbay.yaml', required: true },
  { path: 'README.md', label: 'README.md', required: true },
]

const OPTIONAL_FILES = [
  { path: '.skills', label: '.skills/', required: false },
  { path: 'SOUL.md', label: 'SOUL.md', required: false },
  { path: 'IDENTITY.md', label: 'IDENTITY.md', required: false },
]

export async function validateRepo(fullName: string): Promise<ValidationResult> {
  const token = await getGitHubToken()

  // Get default branch
  const repoRes = await githubFetch(`/repos/${fullName}`, token)
  const repoData = await repoRes.json()
  const defaultBranch = repoData.default_branch ?? 'main'

  // Check all files in parallel
  const allFiles = [...REQUIRED_FILES, ...OPTIONAL_FILES]
  const checks = await Promise.all(
    allFiles.map(async (file) => {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${fullName}/contents/${file.path}?ref=${defaultBranch}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        })
        return { ...file, exists: res.ok }
      } catch {
        return { ...file, exists: false }
      }
    })
  )

  const valid = checks.filter((c) => c.required).every((c) => c.exists)
  return { valid, checks, defaultBranch }
}

export async function getRepoFile(fullName: string, path: string, ref?: string): Promise<string> {
  const token = await getGitHubToken()
  const branch = ref ?? 'main'
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to read ${path}: ${res.status}`)
  }
  return res.text()
}
