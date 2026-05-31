-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- CREATORS
-- ============================================================
create table public.creators (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,

  -- Public profile
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,

  -- Brand
  brand_color text default '#000000',
  brand_secondary_color text default '#ffffff',

  -- Contact / location
  email text,
  website text,
  location_country text,
  location_city text,
  location_lat numeric,
  location_lng numeric,

  -- Social links
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  twitter_url text,
  twitch_url text,

  -- Audience data (for targeting)
  niche text,
  audience_size text, -- '1k-10k', '10k-100k', '100k-1m', '1m+'
  content_types text[], -- ['video', 'photo', 'podcast', 'newsletter']

  -- Stripe
  stripe_account_id text,
  stripe_account_enabled boolean default false,

  -- Feature flags
  merch_enabled boolean default false,
  digital_enabled boolean default false,
  ai_chat_enabled boolean default false,
  ai_voice_enabled boolean default false,
  ai_video_enabled boolean default false,
  calendar_enabled boolean default false,
  events_enabled boolean default false,
  subscriptions_enabled boolean default false,
  tips_enabled boolean default false,

  -- Stats
  total_revenue numeric default 0,
  total_orders integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- USER PROFILES (fans / buyers)
-- ============================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,

  -- Basic
  full_name text,
  username text unique,
  avatar_url text,
  email text,
  phone text,

  -- Demographics
  date_of_birth date,
  gender text,

  -- Location
  location_country text,
  location_city text,
  location_lat numeric,
  location_lng numeric,
  location_ip text,

  -- Interests / targeting
  interests text[],
  followed_creators uuid[],

  -- Device / browser data
  device_type text,
  browser text,
  timezone text,
  locale text,

  -- Stripe customer
  stripe_customer_id text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,

  type text not null check (type in ('merch', 'physical', 'digital', 'subscription', 'tip', 'event', 'booking')),
  title text not null,
  description text,
  price numeric not null default 0,
  currency text default 'usd',

  -- Images
  images text[],

  -- Digital product
  file_url text,
  file_type text, -- 'pdf', 'preset', 'course', 'video'

  -- Merch (POD)
  pod_provider text, -- 'gelato', 'printful'
  pod_product_id text,
  pod_variant_id text,

  -- Inventory
  stock_unlimited boolean default true,
  stock_count integer,

  -- Stripe
  stripe_price_id text,
  stripe_product_id text,

  active boolean default true,
  featured boolean default false,
  sort_order integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  buyer_id uuid references public.profiles(id),

  status text default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded')),

  -- Stripe
  stripe_payment_intent_id text unique,
  stripe_session_id text,

  -- Amounts (in cents)
  subtotal integer not null,
  platform_fee integer not null,
  creator_payout integer not null,
  total integer not null,
  currency text default 'usd',

  -- Shipping
  shipping_name text,
  shipping_address jsonb,

  -- POD tracking
  pod_order_id text,
  tracking_number text,
  tracking_url text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null default 1,
  unit_price integer not null,
  variant jsonb
);

-- ============================================================
-- SUBSCRIPTIONS (fan tiers)
-- ============================================================
create table public.fan_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  fan_id uuid references public.profiles(id),

  tier_name text not null,
  price_monthly numeric not null,

  stripe_subscription_id text unique,
  stripe_price_id text,

  status text default 'active' check (status in ('active', 'cancelled', 'past_due', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,

  created_at timestamptz default now()
);

-- ============================================================
-- SUBSCRIPTION TIERS (creator configures these)
-- ============================================================
create table public.subscription_tiers (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,

  name text not null,
  description text,
  price_monthly numeric not null,
  perks text[],

  stripe_price_id text,
  stripe_product_id text,

  active boolean default true,
  sort_order integer default 0,

  created_at timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  fan_id uuid references public.profiles(id),

  title text not null,
  duration_minutes integer not null default 30,
  price numeric not null default 0,

  scheduled_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),

  meeting_url text,
  notes text,

  stripe_payment_intent_id text,

  created_at timestamptz default now()
);

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,

  title text not null,
  description text,
  cover_url text,

  type text not null check (type in ('webinar', 'zoom', 'seminar', 'livestream', 'in_person')),

  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text default 'UTC',

  price numeric default 0,
  max_attendees integer,

  meeting_url text,
  location_address text,

  stripe_price_id text,

  published boolean default false,

  created_at timestamptz default now()
);

-- ============================================================
-- EVENT REGISTRATIONS
-- ============================================================
create table public.event_registrations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade,
  fan_id uuid references public.profiles(id),

  stripe_payment_intent_id text,
  status text default 'registered' check (status in ('registered', 'attended', 'cancelled', 'refunded')),

  created_at timestamptz default now()
);

-- ============================================================
-- TIPS
-- ============================================================
create table public.tips (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  fan_id uuid references public.profiles(id),

  amount integer not null, -- cents
  message text,

  stripe_payment_intent_id text unique,

  created_at timestamptz default now()
);

-- ============================================================
-- AI CHAT CONVERSATIONS
-- ============================================================
create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  fan_id uuid references public.profiles(id),

  messages jsonb default '[]',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CREATOR BRAND CONFIG (AI training data, voice, etc.)
-- ============================================================
create table public.creator_brand (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade unique,

  -- AI training
  brand_voice_description text,
  sample_content text[],
  faq jsonb default '[]', -- [{q: '', a: ''}]

  -- ElevenLabs
  elevenlabs_voice_id text,
  voice_sample_url text,

  -- HeyGen
  heygen_avatar_id text,

  updated_at timestamptz default now()
);

-- ============================================================
-- EMAIL SUBSCRIBERS
-- ============================================================
create table public.email_subscribers (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  email text not null,
  name text,
  source text, -- 'storefront', 'checkout', 'popup'
  subscribed boolean default true,
  created_at timestamptz default now(),
  unique(creator_id, email)
);

-- ============================================================
-- AFFILIATE PROGRAM
-- ============================================================
create table public.affiliates (
  id uuid primary key default uuid_generate_v4(),
  referrer_creator_id uuid references public.creators(id),
  referred_creator_id uuid references public.creators(id),
  referral_code text unique not null,
  commission_rate numeric default 0.20, -- 20%
  total_earned numeric default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id),
  visitor_id text, -- anonymous fingerprint

  event_type text not null, -- 'page_view', 'product_view', 'add_to_cart', 'purchase', 'subscribe', 'chat_open'

  metadata jsonb default '{}',

  -- Location
  country text,
  city text,

  -- Device
  device_type text,
  browser text,
  referrer text,

  created_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.creators enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.fan_subscriptions enable row level security;
alter table public.subscription_tiers enable row level security;
alter table public.bookings enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.tips enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.creator_brand enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.affiliates enable row level security;
alter table public.analytics_events enable row level security;

-- Creators: public read, owner write
create policy "creators_public_read" on public.creators for select using (true);
create policy "creators_owner_write" on public.creators for all using (auth.uid() = user_id);

-- Profiles: owner only
create policy "profiles_owner" on public.profiles for all using (auth.uid() = user_id);

-- Products: public read, creator write
create policy "products_public_read" on public.products for select using (active = true);
create policy "products_creator_write" on public.products for all using (
  creator_id in (select id from public.creators where user_id = auth.uid())
);

-- Subscription tiers: public read, creator write
create policy "tiers_public_read" on public.subscription_tiers for select using (active = true);
create policy "tiers_creator_write" on public.subscription_tiers for all using (
  creator_id in (select id from public.creators where user_id = auth.uid())
);

-- Events: public read for published, creator write
create policy "events_public_read" on public.events for select using (published = true);
create policy "events_creator_write" on public.events for all using (
  creator_id in (select id from public.creators where user_id = auth.uid())
);

-- Creator brand: public read, creator write
create policy "brand_public_read" on public.creator_brand for select using (true);
create policy "brand_creator_write" on public.creator_brand for all using (
  creator_id in (select id from public.creators where user_id = auth.uid())
);

-- Orders: buyer or creator read
create policy "orders_buyer_read" on public.orders for select using (
  buyer_id in (select id from public.profiles where user_id = auth.uid()) or
  creator_id in (select id from public.creators where user_id = auth.uid())
);

-- Analytics: creator read only
create policy "analytics_creator_read" on public.analytics_events for select using (
  creator_id in (select id from public.creators where user_id = auth.uid())
);
create policy "analytics_insert" on public.analytics_events for insert with check (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger creators_updated_at before update on public.creators for each row execute function update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();
create trigger products_updated_at before update on public.products for each row execute function update_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function update_updated_at();
create trigger brand_updated_at before update on public.creator_brand for each row execute function update_updated_at();
