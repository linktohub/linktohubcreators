ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fan_name text,
  ADD COLUMN IF NOT EXISTS fan_email text,
  ADD COLUMN IF NOT EXISTS product_id uuid references public.products(id);
