-- Add a JSONB config column to agent_instances for per-instance settings
ALTER TABLE agent_instances
  ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

-- Allow the config column to be read/written by the owning user
COMMENT ON COLUMN agent_instances.config IS 'User-configurable settings for the agent instance (model, safety, limits, etc.)';
