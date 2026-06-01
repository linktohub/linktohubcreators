-- ============================================================
-- AGENT SHARED MEMORY SYSTEM
-- Every agent reads from and writes to this database
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_memory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who wrote this and when
  agent text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- What category of knowledge
  category text NOT NULL CHECK (category IN (
    'kpi',          -- Business metrics: MRR, creators, CAC, LTV, churn
    'creator',      -- Individual creator data, performance, risk
    'market',       -- Competitor intel, market trends, opportunities
    'tech',         -- Bugs, features, infrastructure status
    'growth',       -- Acquisition channels, conversion rates, campaigns
    'risk',         -- Fraud, legal, security, financial risks
    'opportunity',  -- New features, partnerships, markets to enter
    'action',       -- Tasks that need to be done by a specific agent
    'decision',     -- Decisions made and why
    'insight'       -- Cross-agent synthesis, patterns noticed
  )),

  -- The actual memory
  key text NOT NULL,
  value text NOT NULL,
  data jsonb DEFAULT '{}',

  -- Priority and routing
  importance integer DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  target_agents text[],      -- Which agents should read this specifically
  requires_action boolean DEFAULT false,
  action_taken boolean DEFAULT false,

  -- Lifetime
  expires_at timestamptz DEFAULT now() + interval '30 days'
);

-- Business metrics time series
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  metric text NOT NULL,
  value numeric NOT NULL,
  unit text,
  notes text,
  agent text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, metric)
);

-- Agent activity log
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent text NOT NULL,
  run_at timestamptz DEFAULT now(),
  summary text NOT NULL,
  memories_read integer DEFAULT 0,
  memories_written integer DEFAULT 0,
  actions_taken text[],
  escalations text[],
  next_focus text
);

-- Disable RLS (agents authenticate via API key)
ALTER TABLE public.agent_memory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs DISABLE ROW LEVEL SECURITY;

-- Index for fast category + importance queries
CREATE INDEX IF NOT EXISTS agent_memory_category_idx ON public.agent_memory(category, importance DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_memory_target_idx ON public.agent_memory USING GIN(target_agents);
CREATE INDEX IF NOT EXISTS agent_memory_action_idx ON public.agent_memory(requires_action, action_taken) WHERE requires_action = true;
CREATE INDEX IF NOT EXISTS business_metrics_date_idx ON public.business_metrics(date DESC, metric);
