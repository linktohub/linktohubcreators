-- Creator billing tiers for Linktohub's own subscription
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'trial' CHECK (plan_tier IN ('trial', 'starter', 'pro', 'business'));
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS plan_stripe_subscription_id text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz DEFAULT now() + interval '14 days';
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS transaction_fee_pct numeric DEFAULT 0.10;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS plan_started_at timestamptz DEFAULT now();

-- Affiliate tracking
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS commission_pct numeric DEFAULT 0.25;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS monthly_earnings numeric DEFAULT 0;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS referred_count integer DEFAULT 0;

-- Platform subscription table (creator pays Linktohub)
CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
  plan_tier text NOT NULL CHECK (plan_tier IN ('starter', 'pro', 'business')),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  amount_monthly numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_subs_owner" ON public.creator_subscriptions FOR ALL USING (
  creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
);

-- Update transaction fee based on plan
CREATE OR REPLACE FUNCTION update_creator_fee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_tier = 'starter' THEN NEW.transaction_fee_pct = 0.05;
  ELSIF NEW.plan_tier = 'pro' THEN NEW.transaction_fee_pct = 0.03;
  ELSIF NEW.plan_tier = 'business' THEN NEW.transaction_fee_pct = 0.00;
  ELSE NEW.transaction_fee_pct = 0.10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creator_fee_update
  BEFORE UPDATE OF plan_tier ON public.creators
  FOR EACH ROW EXECUTE FUNCTION update_creator_fee();
