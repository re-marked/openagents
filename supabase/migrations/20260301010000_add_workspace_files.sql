-- Store workspace file contents (SOUL.md, MEMORY.md, skills, etc.) in the database
-- so edits persist across machine suspends/restarts and work for mock agents.
ALTER TABLE agent_instances
  ADD COLUMN IF NOT EXISTS workspace_files jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN agent_instances.workspace_files IS 'Workspace file contents keyed by path, e.g. {"/data/workspace/SOUL.md": "..."}';
