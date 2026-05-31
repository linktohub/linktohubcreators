# Integrations

## 1. Stripe Connect — creator payouts

**Status:** Implemented  
**Files:**
- `src/app/api/stripe/connect-onboard/route.ts` — POST: creates/retrieves a Stripe Express account for the authenticated creator and returns a one-time onboarding URL
- `src/app/api/stripe/connect-webhook/route.ts` — POST: receives `account.updated` events from Stripe, sets `stripe_account_enabled = true` once `charges_enabled && payouts_enabled`
- `src/app/api/checkout/intent/route.ts` — updated: adds `transfer_data` (90% to creator) and `application_fee_amount` (10% platform fee) when creator has Connect enabled
- `src/app/dashboard/payouts/connect-button.tsx` — client component wiring the "Connect Stripe" button to the onboard API
- `src/app/dashboard/payouts/page.tsx` — updated to use `ConnectStripeButton`

**Required env vars (Vercel):**
| Variable | Source |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Connect webhook (events: `account.updated`) |

**Stripe webhook to configure:**
- URL: `https://<your-domain>/api/stripe/connect-webhook`
- Events: `account.updated`
- Listening mode: **Account** (not Connect)

---

## 2. Gelato — real order submission

**Status:** Implemented  
**Files:**
- `src/app/api/checkout/webhook/route.ts` — on `payment_intent.succeeded`, fetches product details, submits a Gelato v4 order for all `merch`/`physical` items that have `pod_product_id` set, stores `pod_order_id` and tracking in `orders` table
- Requires `pod_product_id` and `pod_variant_id` on products, and shipping address on the PaymentIntent

**Shipping flow:**
- Apple/Google Pay: shipping address collected natively and passed through `e.shippingAddress` → set as `pi.shipping`
- Card fallback: shipping address fields appear in cart drawer when cart contains physical items → set as `pi.shipping`

**Required env vars (Vercel):**
| Variable | Source |
|---|---|
| `GELATO_API_KEY` | Gelato Dashboard → API keys |

**Note:** Gelato orders are submitted only when `pi.shipping.address` is present AND the product has `pod_product_id`. Failed Gelato submissions are logged but do not fail the checkout — the order is always recorded in Supabase.

---

## 3. Resend — transactional email

**Status:** Implemented  
**Package:** `resend` (added to `package.json`)  
**Files:**
- `src/lib/email.ts` — `sendOrderConfirmation` and `sendNewSubscriberNotification` helpers
- `src/app/api/checkout/webhook/route.ts` — sends order confirmation to buyer after payment
- `src/app/api/notify/new-subscriber/route.ts` — POST: called by storefront when a fan joins the email list; sends notification to creator's email
- `src/app/[username]/storefront-client.tsx` — fires the new-subscriber notification on first sign-up

**Required env vars (Vercel):**
| Variable | Source |
|---|---|
| `RESEND_API_KEY` | Resend Dashboard → API Keys |

**From address:** `orders@linktohub.com` — verify this domain in Resend before going live.

---

## 4. AI Chat paywall

**Status:** Implemented  
**Files:**
- `src/app/[username]/storefront-client.tsx` — on mount, checks `fan_subscriptions` for an active subscription from the logged-in fan. Shows:
  - Spinner while loading
  - Locked state with "View membership plans" CTA if no active sub
  - Full chat interface if subscribed

**Dependency:** Requires fan to be logged in with a Supabase session. Unauthenticated visitors see the locked state.

---

## Supabase admin client

`src/lib/supabase/admin.ts` — service role client for webhook routes that run without user auth. Used in all webhook handlers and checkout intent route.

**Required env var (Vercel):**
| Variable | Source |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |
