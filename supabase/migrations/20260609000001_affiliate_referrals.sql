CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code text NOT NULL,
  referrer_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  referred_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (referred_user_id)
);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
