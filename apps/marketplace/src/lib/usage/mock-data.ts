import type {
  CreditBalance,
  UsageEvent,
  CreditTransaction,
  UsageSummary,
  DailyCredits,
  AgentBreakdown,
  TokenSplit,
  DailyCompute,
} from './actions'

// Deterministic pseudo-random from a seed
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateDailyCredits(): DailyCredits[] {
  const rand = seededRandom(42)
  const now = new Date()
  const data: DailyCredits[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    // Simulate a realistic usage curve — busier on weekdays, ramp-up trend
    const dayOfWeek = d.getDay()
    const weekdayBoost = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.4 : 0.6
    const trendMultiplier = 0.5 + (30 - i) / 40 // gradual increase
    const base = 3 + rand() * 12
    data.push({
      date: d.toISOString().slice(0, 10),
      credits: Math.round(base * weekdayBoost * trendMultiplier * 10) / 10,
    })
  }
  return data
}

function generateDailyCompute(): DailyCompute[] {
  const rand = seededRandom(99)
  const now = new Date()
  const data: DailyCompute[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const weekdayBoost = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.3 : 0.5
    data.push({
      date: d.toISOString().slice(0, 10),
      seconds: Math.round(rand() * 180 * weekdayBoost + 20),
    })
  }
  return data
}

const MOCK_AGENTS = [
  'Research Pro',
  'Code Buddy',
  'Content Writer',
  'Data Analyst',
  'Email Assistant',
]

function generateUsageEvents(): UsageEvent[] {
  const rand = seededRandom(77)
  const now = new Date()
  const events: UsageEvent[] = []
  for (let i = 0; i < 20; i++) {
    const d = new Date(now)
    d.setHours(d.getHours() - Math.floor(rand() * 720))
    const input = Math.floor(rand() * 8000 + 500)
    const output = Math.floor(rand() * 4000 + 200)
    const compute = Math.round(rand() * 120 + 5)
    const credits = Math.round((input + output) / 800 * 10) / 10
    events.push({
      id: `mock-${i}`,
      instanceId: `inst-${i % 5}`,
      agentName: MOCK_AGENTS[i % MOCK_AGENTS.length],
      inputTokens: input,
      outputTokens: output,
      computeSeconds: compute,
      creditsConsumed: credits,
      costUsd: Math.round(credits * 0.01 * 100) / 100,
      createdAt: d.toISOString(),
    })
  }
  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function generateTransactions(): CreditTransaction[] {
  const now = new Date()
  return [
    {
      id: 'tx-1',
      type: 'credit',
      creditType: 'signup_bonus',
      amount: 100,
      description: 'Welcome bonus — 100 free credits',
      createdAt: new Date(now.getTime() - 28 * 86400000).toISOString(),
    },
    {
      id: 'tx-2',
      type: 'debit',
      creditType: 'usage',
      amount: 24,
      description: 'Research Pro — 3 sessions',
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
    {
      id: 'tx-3',
      type: 'credit',
      creditType: 'topup',
      amount: 50,
      description: 'Credit top-up',
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      id: 'tx-4',
      type: 'debit',
      creditType: 'usage',
      amount: 18,
      description: 'Code Buddy — 5 sessions',
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
    {
      id: 'tx-5',
      type: 'debit',
      creditType: 'usage',
      amount: 12,
      description: 'Content Writer — 2 sessions',
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'tx-6',
      type: 'debit',
      creditType: 'usage',
      amount: 8,
      description: 'Data Analyst — 1 session',
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'tx-7',
      type: 'debit',
      creditType: 'usage',
      amount: 5,
      description: 'Email Assistant — 4 sessions',
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const dailyCredits = generateDailyCredits()
const totalCreditsUsed = Math.round(dailyCredits.reduce((s, d) => s + d.credits, 0) * 10) / 10

export const MOCK_DATA = {
  balance: {
    subscriptionCredits: 100,
    topupCredits: 50,
    totalCredits: 150,
  } satisfies CreditBalance,

  summary: {
    totalCreditsUsed,
    totalInputTokens: 84_320,
    totalOutputTokens: 37_150,
    totalComputeSeconds: 2_847,
  } satisfies UsageSummary,

  dailyCredits,

  dailyCompute: generateDailyCompute(),

  tokenSplit: [
    { name: 'Input', value: 84_320, fill: 'var(--color-input-tokens)' },
    { name: 'Output', value: 37_150, fill: 'var(--color-output-tokens)' },
  ] satisfies TokenSplit[],

  agentBreakdown: [
    { agent: 'Research Pro', credits: 42, tokens: 38_200, compute: 920 },
    { agent: 'Code Buddy', credits: 31, tokens: 29_500, compute: 780 },
    { agent: 'Content Writer', credits: 22, tokens: 24_800, compute: 540 },
    { agent: 'Data Analyst', credits: 16, tokens: 18_100, compute: 380 },
    { agent: 'Email Assistant', credits: 8, tokens: 10_870, compute: 227 },
  ] satisfies AgentBreakdown[],

  events: generateUsageEvents(),

  transactions: generateTransactions(),
}
