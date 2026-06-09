ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS ig_access_token text,
  ADD COLUMN IF NOT EXISTS ig_user_id text,
  ADD COLUMN IF NOT EXISTS autodm_keyword text DEFAULT 'LINK',
  ADD COLUMN IF NOT EXISTS autodm_message text DEFAULT 'Hey! Here''s my store: {{storefront_url}}',
  ADD COLUMN IF NOT EXISTS autodm_enabled boolean DEFAULT false;
