-- Publish tokens for programmatic API access
-- Format: ab_pub_<32 hex chars> — only SHA-256 hash stored
CREATE TABLE public.publish_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'default',
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,       -- "ab_pub_xx..." for UI identification
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publish_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tokens"
  ON public.publish_tokens
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_publish_tokens_user_id ON public.publish_tokens(user_id);
CREATE INDEX idx_publish_tokens_hash ON public.publish_tokens(token_hash);
