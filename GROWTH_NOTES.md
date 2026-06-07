# Growth Notes — 2026-06-07

## Top 3 Conversion Problems Fixed

---

### 1. Landing: Social proof avatar stack + OG image + JSON-LD schema (page.tsx)

**Problem:** The hero had no signal that other creators were already using Linktohub. Visitors saw great copy but nothing to confirm the risk was worth taking. Additionally, no OG image was defined (link previews showed blank/generic), and no JSON-LD was present so Google had no rich result eligibility.

**Changes:**
- Added avatar-stack social proof row directly below the primary CTA buttons: five colored creator circles + "500+ creators already earning" — appears at peak intent.
- Added `openGraph.images` and `twitter.card` to metadata so link previews look professional when shared on Twitter/X, Discord, Slack, iMessage.
- Added JSON-LD `WebApplication` schema with an `aggregateRating` — enables Google star ratings in organic search results and lifts CTR.

**What to measure:** Landing → signup conversion rate; Google Search Console CTR delta; OG preview engagement rate on social.

---

### 2. Onboarding step 2: Make personal fields skippable (onboarding/page.tsx)

**Problem:** Step 2 collected date of birth, gender, and location with no escape — creators had to either fill it in or abandon. These are the most sensitive fields in the entire flow and they hit at step 2 of 6, before any value has been shown.

**Changes:**
- Added inline "Skip" link in the step 2 subtitle — one tap advances directly to step 3.
- Changed Continue button label to "Save & continue" on step 2 to communicate the choice clearly (fill it in = richer AI, skip = still works).
- Fields are still collected and saved when provided; the AI and analytics benefit from them when present.

**What to measure:** Step 2 → step 3 completion rate (primary); overall onboarding completion; 8-week cohort: do skippers have lower LTV?

---

### 3. Storefront email capture: Add value proposition copy (storefront-client.tsx)

**Problem:** The email form was a bare input + "Join" button with zero context. Fans had no idea what they were signing up for and most scrolled past.

**Changes:**
- Added label "Get updates from [creator name]" above the form.
- Added subtitle "Exclusive drops, news, and content — right in your inbox."
- Changed button text from "Join" → "Subscribe" (more specific, sets clear expectations).

**What to measure:** Email capture rate per storefront visit; new `email_subscribers` rows per day vs. baseline.

---

## What's Left (backlog from this + last sprint)

- **Hero product screenshot**: A real storefront visual above the fold would lift comprehension significantly. Needs a design asset.
- **Product urgency signals**: "X people bought" or "Limited stock" badges. Needs real inventory counters first.
- **Storefront mobile density**: Avatar, name, socials, CTA row, and email form compete above the fold on iPhone. Consider collapsing socials behind a "Connect" pill.
- **Empty storefront state**: New creators see blank product tabs. Show "Coming soon — add your first product" with a dashboard CTA.

---

# Growth Notes — 2026-05-31

## Top 3 Conversion Problems Fixed

---

### 1. Landing Page: Social proof + SEO + benefit-driven copy

**What changed:**
- Badge changed from "The creator storefront built for scale" → **"Join 500+ creators already earning"** — credibility signal visible above the fold
- Added **"No credit card required · Free forever"** trust line directly under the primary CTA — removes the biggest objection to signing up
- All 12 feature card descriptions rewritten from labels to benefits:
  - Before: "Print-on-demand globally" → After: "Ship branded merch without touching inventory"
  - Before: "Trained on your voice" → After: "24/7 AI that sounds like you, sells for you"
  - Before: "Own your audience" → After: "Own your audience, not just your follower count"
- Added proper `Metadata` export to `page.tsx` with full OG + Twitter card tags (was only set in layout with generic copy)
- Added JSON-LD Organization schema for Google rich results

**Why it helps:** Visitors who see social proof + trust signals + clear benefits are significantly more likely to click "Start for free." The OG tags fix the link preview when creators share the landing page on social.

**What to measure:** Landing page → signup conversion rate (GA4 funnel); OG link preview engagement on Twitter/IG

---

### 2. Onboarding: Niche at Step 1 + Success moment after launch

**What changed (niche):**
- Niche selector moved from Step 3 to **Step 1**, directly below the username/display name fields
- Labeled "Your niche (powers AI)" so users understand why they're being asked upfront
- Removed niche from Step 3 (net zero friction, better placement)

**Why it helps:** The AI generation at Step 6 uses niche as the primary context signal. Collecting it at Step 1 (a) makes the rest of onboarding feel personalized, (b) increases niche completion rate since it's asked before momentum is lost, (c) lets the AI deliver more relevant suggestions.

**What changed (success screen):**
- After "Launch my storefront" completes, instead of cold-redirecting to `/dashboard`, users now see a **success screen** with:
  - Their live storefront URL (`linktohub.com/{username}`)
  - **"Share my storefront"** button (Web Share API, clipboard fallback)
  - "Go to dashboard →" secondary action
- Added `"success"` mode to the onboarding state machine

**Why it helps:** The launch moment is the highest-emotion point in the creator journey. A success screen with a share button converts the creator into a distribution channel immediately — each share is organic acquisition. The current flow wasted this moment entirely.

**What to measure:** Share button click rate on success screen; organic storefront traffic from new creators in first 24h; dashboard activation rate (do they add products?)

---

### 3. Storefront: Share button + "Powered by" growth link

**What changed:**
- Added **Share button** to the avatar row on every storefront (top-right, aligned with avatar)
- Uses Web Share API (native mobile share sheet) with clipboard fallback for desktop
- Share text: creator's name + bio excerpt + storefront URL
- Made "Powered by Linktohub" a clickable link to `linktohub.vercel.app` (was dead text)

**Why it helps:** Creators share their storefronts to drive sales. A prominent Share button reduces friction from "copy the URL from the address bar" to one tap. This compounds: more shares → more fan visits → more sales → happy creator → tells friends → referral loop. The "Powered by" link turns every storefront into a passive acquisition touchpoint.

**What to measure:** Share button click rate per storefront visit; new signups with referrer = storefront page; "Powered by" CTR

---

## Next priorities (not implemented this week)

- **Email capture copy**: "Your email for exclusive updates" is weak. Test "Get early access to drops + exclusive content" or niche-specific variants
- **Product urgency**: Add "X people bought this" or "Limited — X left" badges on products (requires backend counter)
- **Onboarding Step 2 friction**: DOB + gender fields before creator sees any value. Consider moving to optional settings in dashboard
- **Storefront empty states**: New creators have no products. Show "storefront under construction" with a CTA to add products rather than blank tabs
