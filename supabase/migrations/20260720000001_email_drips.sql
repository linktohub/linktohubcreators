ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS drip_d3_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS drip_d7_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_email_subscribers_drip_d3
  ON public.email_subscribers (creator_id, drip_d3_sent_at)
  WHERE subscribed = true AND drip_d3_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_subscribers_drip_d7
  ON public.email_subscribers (creator_id, drip_d7_sent_at)
  WHERE subscribed = true AND drip_d7_sent_at IS NULL;
