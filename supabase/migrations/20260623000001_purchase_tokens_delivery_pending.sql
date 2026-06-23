ALTER TABLE public.purchase_tokens
  ADD COLUMN IF NOT EXISTS delivery_pending boolean DEFAULT false;
