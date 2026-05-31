-- Add metadata column to products table for storing structured data
-- (course modules, PDF sections, preset items, booking details, etc.)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metadata jsonb default '{}';
