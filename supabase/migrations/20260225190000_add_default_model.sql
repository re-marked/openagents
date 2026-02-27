ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_model text NOT NULL DEFAULT 'google/gemini-2.5-flash';
