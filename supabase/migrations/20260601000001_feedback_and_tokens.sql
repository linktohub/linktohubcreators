-- Creator feedback table
CREATE TABLE IF NOT EXISTS public.creator_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  creator_name text,
  user_email text,
  type text NOT NULL CHECK (type IN ('bug', 'idea', 'improvement', 'question')),
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creators_own_feedback" ON public.creator_feedback
  FOR ALL USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "feedback_insert" ON public.creator_feedback
  FOR INSERT WITH CHECK (true);

-- Purchase tokens for secure digital delivery
CREATE TABLE IF NOT EXISTS public.purchase_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  buyer_email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  download_count integer DEFAULT 0,
  max_downloads integer DEFAULT 5,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '72 hours',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.purchase_tokens DISABLE ROW LEVEL SECURITY;

-- Add missing columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_urls jsonb DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';
