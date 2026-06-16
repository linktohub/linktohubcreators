ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS instant_payouts_enabled boolean DEFAULT false;
