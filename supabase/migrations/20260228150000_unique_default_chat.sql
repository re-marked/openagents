-- Prevent duplicate "General" chats per project per user
CREATE UNIQUE INDEX IF NOT EXISTS chats_one_default_per_project
  ON chats (project_id, user_id)
  WHERE name = 'General';
