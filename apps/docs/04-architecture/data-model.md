# Data Model

## Entity Relationship Overview

```
users ──< projects ──< teams ──< team_agents >── agent_instances >── agents
  │                                                    │
  │                                                    │
  ├──< purchases                                       ├──< sessions ──< messages
  ├──< credit_balances                                 ├──< usage_events
  ├──< credit_transactions                             └──< ssh_configs (Vault)
  └──< relay_connections

agents >── creators (users with role=creator)
  │
  ├──< agent_skills
  ├──< agent_reviews
  └──< agent_versions
```

---

## Core Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'creator' | 'admin'
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT, -- for creators
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: user_id = auth.uid()
```

### teams
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: via project → user_id = auth.uid()
```

### agents (marketplace listings)
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
  name TEXT NOT NULL,
  tagline TEXT NOT NULL, -- one-liner for card
  description TEXT NOT NULL, -- full markdown description
  icon_url TEXT,
  category TEXT NOT NULL, -- 'productivity' | 'research' | 'writing' | ...
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'review' | 'published' | 'rejected' | 'archived'

  -- Pricing
  pricing_model TEXT NOT NULL DEFAULT 'per_session', -- 'per_session' | 'per_task' | 'free'
  credits_per_session INTEGER, -- null if free

  -- Technical
  github_repo_url TEXT NOT NULL,
  docker_image TEXT, -- built image ref on Fly.io registry
  openclaw_version TEXT, -- pinned OpenClaw version
  fly_machine_size TEXT NOT NULL DEFAULT 'shared-cpu-1x',
  fly_machine_memory_mb INTEGER NOT NULL DEFAULT 512,

  -- Stats (denormalized for performance)
  total_hires INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  supported_relays TEXT[] DEFAULT '{}', -- ['telegram', 'whatsapp', 'slack', 'discord']
  supported_models TEXT[] DEFAULT '{}', -- ['claude', 'gpt', 'gemini']
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
-- RLS: public read (status=published), creator CRUD (creator_id=auth.uid())
```

### agent_instances (user's hired Agent)
```sql
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  team_id UUID REFERENCES teams(id),

  -- Fly.io Machine info
  fly_app_name TEXT NOT NULL,
  fly_machine_id TEXT NOT NULL,
  fly_volume_id TEXT,
  region TEXT NOT NULL DEFAULT 'iad',

  -- Status
  status TEXT NOT NULL DEFAULT 'provisioning',
    -- 'provisioning' | 'running' | 'suspended' | 'stopped' | 'error' | 'destroyed'
  last_active_at TIMESTAMPTZ,
  error_message TEXT,

  -- User customization
  display_name TEXT, -- override Agent name
  model_preference TEXT, -- override default model

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, agent_id) -- one instance per user per agent
);
-- RLS: user_id = auth.uid()
```

### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  relay TEXT NOT NULL DEFAULT 'web', -- 'web' | 'telegram' | 'whatsapp' | 'slack' | 'discord'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_credits_consumed INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  compute_seconds INTEGER NOT NULL DEFAULT 0
);
-- RLS: user_id = auth.uid()
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system' | 'tool'
  content TEXT NOT NULL,
  tool_use JSONB, -- {name, input, output} if role=tool
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: via session → user_id = auth.uid()
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at);
```

### credit_balances
```sql
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  subscription_credits INTEGER NOT NULL DEFAULT 0, -- refresh monthly, expire
  topup_credits INTEGER NOT NULL DEFAULT 0, -- never expire
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: user_id = auth.uid()
-- Total available = subscription_credits + topup_credits
```

### credit_transactions
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'subscription_refresh' | 'topup_purchase' | 'session_deduct' | 'free_trial' | 'refund'
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  credit_type TEXT NOT NULL, -- 'subscription' | 'topup'
  description TEXT,
  session_id UUID REFERENCES sessions(id),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: user_id = auth.uid()
```

### usage_events
```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  instance_id UUID NOT NULL REFERENCES agent_instances(id),
  session_id UUID REFERENCES sessions(id),
  compute_seconds INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0, -- actual infra cost
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Used by Trigger.dev billing aggregation job
```

### creator_earnings
```sql
CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  session_id UUID REFERENCES sessions(id),
  gross_revenue NUMERIC(10,4) NOT NULL, -- total credits × $0.01
  compute_cost NUMERIC(10,6) NOT NULL, -- actual infra cost
  creator_amount NUMERIC(10,4) NOT NULL, -- (gross - compute) × creator_rate
  platform_amount NUMERIC(10,4) NOT NULL, -- remainder
  creator_rate NUMERIC(3,2) NOT NULL DEFAULT 0.85, -- 85% at launch
  paid_out BOOLEAN NOT NULL DEFAULT false,
  paid_out_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### agent_reviews
```sql
CREATE TABLE agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id) -- one review per user per agent
);
```

### relay_connections
```sql
CREATE TABLE relay_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  relay TEXT NOT NULL, -- 'telegram' | 'whatsapp' | 'slack' | 'discord'
  external_user_id TEXT NOT NULL, -- platform-specific user ID
  external_chat_id TEXT, -- platform-specific chat/channel ID
  config JSONB, -- platform-specific config
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(relay, external_user_id) -- one connection per relay user
);
```

---

## Indexes

```sql
-- Performance-critical queries
CREATE INDEX idx_agents_status_category ON agents(status, category);
CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_creator ON agents(creator_id);
CREATE INDEX idx_instances_user ON agent_instances(user_id);
CREATE INDEX idx_instances_status ON agent_instances(status);
CREATE INDEX idx_instances_fly ON agent_instances(fly_machine_id);
CREATE INDEX idx_sessions_instance ON sessions(instance_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_usage_user_created ON usage_events(user_id, created_at);
CREATE INDEX idx_earnings_creator_paid ON creator_earnings(creator_id, paid_out);
CREATE INDEX idx_relay_external ON relay_connections(relay, external_user_id);
CREATE INDEX idx_reviews_agent ON agent_reviews(agent_id);

-- Full-text search for marketplace
CREATE INDEX idx_agents_search ON agents USING gin(
  to_tsvector('english', name || ' ' || tagline || ' ' || description)
);
```
