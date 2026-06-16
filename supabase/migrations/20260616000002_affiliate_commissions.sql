CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  referral_code text,
  referrer_creator_id uuid REFERENCES public.creators(id),
  commission_cents int,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS affiliate_earnings numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_affiliate_earnings(
  p_creator_id uuid,
  p_amount numeric
) RETURNS void LANGUAGE sql AS $$
  UPDATE public.creators
  SET affiliate_earnings = COALESCE(affiliate_earnings, 0) + p_amount
  WHERE id = p_creator_id;
$$;
