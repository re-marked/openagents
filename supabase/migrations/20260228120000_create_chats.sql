-- Chat rooms: group multiple agents into a single conversation space
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id);

-- Chat-agent membership: which agents belong to which chat
CREATE TABLE IF NOT EXISTS public.chat_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES public.agent_instances(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, instance_id)
);

ALTER TABLE public.chat_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat agents via chat ownership" ON public.chat_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_agents.chat_id
        AND chats.user_id = auth.uid()
    )
  );
