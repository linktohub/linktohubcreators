# Integrations

## 1. Stripe Connect — creator payouts

**Status:** Implemented  
**Files:**
- `src/app/api/stripe/connect-onboard/route.ts` — POST: creates/retrieves a Stripe Express account for the authenticated creator and returns a one-time onboarding URL
- `src/app/api/stripe/connect-webhook/route.ts` — POST: receives `account.updated` events from Stripe, sets `stripe_account_enabled = true` once `charges_enabled && payouts_enabled`
- `src/app/api/checkout/intent/route.ts` — updated: adds `transfer_data` and `application_fee_amount` (reads `transaction_fee_pct` from the creator record — see §10) when creator has Connect enabled
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

## 5. Post-purchase download links

**Status:** Implemented  
**Files:**
- `src/app/api/orders/by-intent/route.ts` — GET `?pi=<payment_intent_id>`: returns `{ status, download_urls }` for the order matching the PI; no auth required (PI id is proof of purchase)
- `src/app/[username]/storefront-client.tsx` — after `confirmCardPayment` succeeds, enters `checkoutSuccess` state; polls `/api/orders/by-intent` every 2s for up to 16s to fetch download URLs; renders order summary + download buttons inside the cart drawer

**Flow:** Card path → PI client secret → derive PI id → poll webhook for token generation → show download buttons. Apple/Google Pay path uses the same polling logic.

---

## 6. Email broadcast

**Status:** Implemented  
**Files:**
- `src/lib/email-broadcast.ts` — `getResendClient()` helper; returns null gracefully when `RESEND_API_KEY` is unset
- `src/app/api/email/broadcast/route.ts` — POST: auth-gated; fetches all active `email_subscribers` for the creator; sends in batches of 10 (Resend free-tier rate limit); returns `{ sent, failed, total }`
- `src/app/dashboard/email/page.tsx` — server component: subscriber stats by source, table of recent subscribers, CSV export, compose panel
- `src/app/dashboard/email/broadcast-client.tsx` — client component: subject + body textarea, "Send to N subscribers" button, real-time send result
- `src/components/dashboard/nav.tsx` — "Email" link in the Grow nav group

**Required env vars (Vercel):**
| Variable | Source |
|---|---|
| `RESEND_API_KEY` | Resend Dashboard → API Keys |

**From address:** `updates@linktohub.com` — verify this domain in Resend. Gracefully skips (no crash) when key is absent.

---

## 7. Stripe Connect — dashboard UX

**Status:** Implemented  
**Files:**
- `src/app/dashboard/page.tsx` — shows amber sticky banner ("Add your bank account to receive payouts → Connect Stripe") when `creator.stripe_account_enabled` is false; disappears automatically once enabled
- `src/app/onboarding/page.tsx` — success screen now has a "Set up payouts" secondary CTA alongside "Go to dashboard", routing directly to `/dashboard/payouts`

---

## 8. Gelato — shipping address fix + order emails

**Status:** Implemented (sprint week 2026-06-01)  
**Change:** Webhook previously read shipping from `pi.metadata.shipping_address` which was never set. Now falls back to Stripe's native `pi.shipping` object:
```ts
const shippingAddress = pi.metadata.shipping_address
  ? JSON.parse(pi.metadata.shipping_address)
  : pi.shipping?.address ? { …mapped fields… } : null;
```
**Change:** Gelato order `files` now passes `product.images[0]` as the print design file (was always empty before this fix).  
**Change:** `sendOrderConfirmation` is now called in the webhook after download URLs are generated. The `getResend()` helper returns `null` instead of throwing when `RESEND_API_KEY` is unset, so a missing key no longer crashes the checkout webhook.  
**Change:** Removed redundant `account.updated` handler from the checkout webhook — this event is now exclusively handled by `/api/stripe/connect-webhook` (which correctly checks both `charges_enabled && payouts_enabled`).

---

## 9. AI storefront section — homepage

**Status:** Implemented  
**File:** `src/app/page.tsx` — "Your audience, answered 24/7 — in your voice" section between features grid and pricing. Includes static mock chat demo (fitness creator branded), "No competitor does this" chip, and "Start for free" CTA to `/auth/signup`.

---

---

## 10. Platform fee — per-plan pricing (sprint week 2026-06-08)

**Status:** Implemented  
**Problem fixed:** `intent/route.ts` previously hardcoded a flat 10% fee on every transaction, overcharging Starter creators (advertised rate: 6%).  
**Change:** Checkout intent now reads `creators.transaction_fee_pct` (a decimal, e.g. `0.06`) and uses it for both `application_fee_amount` and the creator's payout split. Falls back to `0.06` if the field is null (new signups default to Starter).  
**Change:** `src/app/dashboard/payouts/page.tsx` — Platform Fee card now shows `creator.transaction_fee_pct * 100` (e.g. "6.0%") and the plan tier label, instead of the hardcoded "10%".

**DB column needed:** `creators.transaction_fee_pct NUMERIC DEFAULT 0.06` and `creators.plan_tier TEXT DEFAULT 'starter'`.

---

## 11. Affiliate attribution at signup (sprint week 2026-06-08)

**Status:** Implemented  
**Files:**
- `src/app/auth/signup/page.tsx` — reads `?ref` from URL, appends it to `emailRedirectTo` so it survives the email confirmation flow; on auto-confirm (session immediately available) calls `/api/affiliate/record` inline
- `src/app/auth/callback/route.ts` — reads `?ref` from the callback URL, increments `affiliates.referred_count`, inserts into `affiliate_referrals`
- `src/app/api/affiliate/record/route.ts` — POST: service-role write of referred_count + affiliate_referrals row for the auto-confirm path

**DB table needed:** `affiliate_referrals (referral_code TEXT, referrer_creator_id UUID, referred_user_id UUID, created_at TIMESTAMPTZ DEFAULT now())`

---

## 12. Email unsubscribe compliance — CAN-SPAM / GDPR (sprint week 2026-06-08)

**Status:** Implemented  
**Files:**
- `src/app/api/email/unsubscribe/route.ts` — GET `?email=X&sig=Y`: validates HMAC-SHA256 signature, sets `email_subscribers.subscribed = false`, returns a styled HTML confirmation page
- `src/app/api/email/broadcast/route.ts` — generates a per-subscriber signed unsubscribe URL (`unsubscribeUrl()`) and injects it into the email footer, replacing the former broken `#unsubscribe` anchor

**Required env var (Vercel):**
| Variable | Value |
|---|---|
| `UNSUBSCRIBE_SECRET` | Any random string — `openssl rand -hex 32` |

---

## 13. AutoDM — Instagram keyword-to-DM flow (sprint week 2026-06-08)

**Status:** Implemented (Phase 1: OAuth + trigger setup + webhook handler)  
**Files:**
- `src/app/dashboard/autodm/page.tsx` — server component; loads creator's IG connection state and passes to client
- `src/app/dashboard/autodm/autodm-client.tsx` — "Connect Instagram" button, keyword input, DM message template, enabled toggle, Save
- `src/app/api/autodm/ig-callback/route.ts` — exchanges `?code=` for a long-lived IG access token, stores `ig_access_token` + `ig_user_id` on the creator record, redirects to `/dashboard/autodm?connected=1`
- `src/app/api/autodm/webhook/route.ts` — GET: Instagram webhook verification challenge; POST: on `comments` events, if comment text contains `autodm_keyword`, sends a DM via Graph API with `autodm_message` (replaces `{{storefront_url}}` with `https://linktohub.vercel.app/{username}`)
- `src/app/api/autodm/save/route.ts` — POST: saves keyword/message/enabled state to creators table
- `src/components/dashboard/nav.tsx` — "AutoDM" nav link with MessageCircle icon

**Required env vars (Vercel):**
| Variable | Source |
|---|---|
| `INSTAGRAM_APP_ID` | Meta Developer Console → App → Basic Settings |
| `INSTAGRAM_APP_SECRET` | Meta Developer Console → App → Basic Settings |
| `INSTAGRAM_VERIFY_TOKEN` | Any random string — must match what you enter in Meta webhook config |

**Meta webhook to configure:**
- URL: `https://linktohub.vercel.app/api/autodm/webhook`
- Verify token: value of `INSTAGRAM_VERIFY_TOKEN`
- Subscriptions: `comments`

**DB columns needed on `creators`:** `ig_access_token TEXT`, `ig_user_id TEXT`, `autodm_keyword TEXT`, `autodm_message TEXT`, `autodm_enabled BOOLEAN DEFAULT false`

---

## 14. Onboarding product title fix (sprint week 2026-06-08)

**Status:** Implemented  
**File:** `src/app/onboarding/page.tsx` — `productsToCreate` map now uses `title: p.name` (was `name: p.name`). Products created via onboarding now have a non-null `title` column in Supabase, matching the schema used everywhere else in the product/order flow.

---

## 15. Platform fee — webhook order recording fix (sprint week 2026-06-19)

**Status:** Implemented  
**Bug fixed:** `checkout/webhook/route.ts` hardcoded `0.10` (10%) when computing `platform_fee` and `creator_payout` for the orders table. The checkout intent route already read `transaction_fee_pct` from the creator record and charged Stripe the correct application fee (e.g. 6% for Starter creators) — but the webhook wrote the wrong split to the DB.  
**Impact:** Every order for a Starter creator (6% plan) stored an overstated `platform_fee` and understated `creator_payout` in the `orders` table. Stripe itself was charging the correct amount; only the DB records were wrong.  
**Change:** Webhook now reads `creators.transaction_fee_pct` using the `creator_id` from the PaymentIntent metadata, falls back to 6% if null. The affiliate commission calculation (which derives `commissionCents` from `platformFee`) is also corrected by this change.  
**File:** `src/app/api/checkout/webhook/route.ts`

---

## Supabase admin client

`src/lib/supabase/admin.ts` — service role client for webhook routes that run without user auth. Used in all webhook handlers and checkout intent route.

**Required env var (Vercel):**
| Variable | Source |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |
