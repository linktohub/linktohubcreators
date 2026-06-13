# Research Report — 2026-06-13

## Top 3 Opportunities (act on these this week)

1. **AutoDM is STILL unshipped — this is now a red-flag gap, not a roadmap item.** Last week's report flagged this as #1. It remains #1. Stan ships AutoDM on their $29 base plan. Beacons has Smart Reply AutoDM on all tiers including free. Every 2026 creator platform roundup lists AutoDM as a must-have. Instagram's API fully supports it. TikTok's does NOT (confirmed June 2026). The window to ship this before creators stop considering Linktohub in evaluations is closing. This must be the sprint-defining deliverable, not a future item.

2. **Run a "Gumroad fee calculator" landing page NOW — peak creator outrage moment.** Gumroad's fee structure is blowing up in creator communities this month: effective take rate is 20%+ (not the advertised 10%), they keep their fee on refunds, and Discover marketplace charges 30%. Six of seven major 2026 creator platform roundups lead with Gumroad fee complaints. This is a high-intent acquisition window. A single-page calculator ("enter your monthly Gumroad sales → here's what you actually keep vs. Linktohub") is a 2-day build and captures search traffic and social shares from an actively-heated creator conversation. No competitor has built this page yet.

3. **Stripe Sessions 2026: implement stablecoin/instant payouts as a creator-facing feature.** Stripe announced at Sessions 2026 (this month): stablecoin rails to 100 new countries for instant payouts + seller wallets + prepaid debit cards for creators. Gumroad's slow payout cycle (7 days) is a complaint that appears alongside every fee complaint. Linktohub enabling "get paid today" via Stripe Instant Payouts (already GA) with stablecoin international expansion is a specific, credible differentiator. Ship the Instant Payout toggle this sprint. It's an API call, not a platform rebuild.

---

## Competitor Intelligence

### Stan.store
- **Pricing:** $29/mo (Creator) | $99/mo (Creator Pro). No free plan, 14-day trial only. 0% platform fee on both tiers. Annual: $25/$79/mo.
- **AutoDM on Creator plan ($29):** Comment-to-DM automation. This is their headline feature and primary competitive moat vs. link-in-bio tools.
- **Email marketing locked at $99/mo** — 3.4× price jump. The single most-cited reason creators search for Stan alternatives. No funnel builder, no affiliates, no pixel tracking at $29.
- **Analytics gap:** Surface-level only — total revenue and traffic. No traffic source attribution, no customer LTV, no funnel view. Creators can't identify which content or campaign drove a sale.
- **Customization:** Every Stan store looks identical. Background color, font, header image — that's the full creative range.
- **Course features:** No quizzes, no certificates, no progress tracking. Adequate for a video series; not for serious educators.
- **Conversion hook:** "Zero transaction fees" + "AutoDM turns comments into customers."
- **New this week:** Stan's own blog now runs articles titled "Stan Store Alternatives" — they're getting defensive about churn and trying to own the comparison search. This signals they're losing trials to competitors.

### Beacons.ai
- **Pricing:** Free (9% fee) | $10/mo (9% fee, 0% fees unclear) | Creator Plus $30/mo (0% fee, unlimited AI, custom domain) | Max $90/mo.
- **Scale:** 7M+ creators. Founded by three Stanford ML PhDs.
- **AI ("Beam"):** Generates captions, emails, bio text, content ideas. Pulls live social stats into media kit. **Important distinction:** Beam is a content-generation assistant — it is NOT a chatbot trained on the creator's voice. This is Linktohub's moat.
- **"Beacons for Brands" (2025 launch):** Affiliate marketplace connecting brands to creators with transparent conversion data. This is a B2B acquisition layer Linktohub does not have.
- **Smart Reply AutoDM:** Available on all tiers including free.
- **No merch/POD:** Creators must link out to Printify, Gelato, or Shopify separately. Beacons is deliberately not a full commerce stack.
- **9% fee wall:** On free and $10 plans, 9% of all sales goes to Beacons. On $1k/mo in sales that's $90 before Stripe. This is the core complaint from mid-tier creators on Beacons.
- **Conversion hook:** "The free plan that actually works" + AI-powered tools + media kit for brand deals.

### Gumroad
- **Pricing:** No monthly fee. 10% + $0.50 per sale. Effective real-world rate: ~20%+ after all fees. Discover marketplace: 30%.
- **The refund problem:** Gumroad does NOT refund its 10% when a creator issues a refund. Sell $100, refund $100, still owe $10.50. Creator forums are calling this out loudly in June 2026.
- **Support:** Widely described as "non-existent" — slow responses, bot-like answers, account suspensions without human review. Multiple 2026 sources flag this.
- **Genuine strength:** No monthly commitment — $0 to start. Handles VAT/GST globally (Merchant of Record). Simple checkout link creation.
- **No ecosystem:** No bookings, memberships, events, merch, link-in-bio, AutoDM, email marketing. Purely digital product checkout.
- **Verdict:** Gumroad is hemorrhaging creators to fee alternatives. The "10% flat fee" marketing is being actively debunked in creator communities this month. Peak migration window.

### Linktree
- **Pricing (raised Nov 2025, still causing backlash):** Free (12% sales fee) | Starter $8/mo (9% fee) | Pro $15/mo (9% fee) | Premium $35/mo (0% fee).
- **All fees are additive with Stripe's 2.9% + $0.30** per transaction. Additional $0.25 payout fee per withdrawal.
- **Koji acquisition (Dec 2023):** 400+ Koji mini-apps being absorbed into Linktree's commerce layer — tip jars, paid DMs, fan subscriptions. Commerce story is strengthening but still an afterthought vs. native tools.
- **Core structural weakness:** Traffic routing layer, not a creator commerce platform. No email capture on free/Starter. No CRM. No AutoDM. No merch. A follower clicks through Linktree and disappears — Linktree has no memory of the visit.
- **"Linktree alternatives 2026" search volume is elevated** — price hike created lasting backlash. Creators feel trapped by brand recognition, not product value.
- **Conversion hook:** Pure category name recognition — "link in bio." No product hook.

### Koji
- **Confirmed defunct as independent platform.** Acquired by Linktree December 2023. Features being absorbed into Linktree commerce layer. Not a standalone competitive threat. Remove from tracking.

---

## Creator Pain Points

1. **"I can't afford $99/mo just to email my own list."** Stan's email wall is the #1 cited reason creators look for Stan alternatives in 2026. This phrase (or a variation) appears in Trustpilot reviews, Reddit r/sidehustle, and every independent comparison article published this year. It's not a niche complaint — it's the primary churn trigger.

2. **Gumroad fee deception is an active crisis.** Creators are doing the math in public: a $10 sale on Gumroad nets $7.91 (20.9% effective rate, not 10%). The refund-with-no-fee-refund policy is being called a "trap." The 30% Discover fee is described as "extortion." Multiple YouTube videos and Reddit threads titled "Gumroad fees exposed" are circulating in June 2026. This is a high-intent acquisition moment for platforms with transparent pricing.

3. **Linktree's 12% free-tier fee is invisible until it stings.** Creators set up Linktree's free plan, sell a $100 product, and hand over $12 to Linktree + $3.20 to Stripe + $0.25 withdrawal fee = $15.45 in fees on a $100 sale. They discover this after the fact. "Linktree alternatives" search volume is elevated and sustained since the Nov 2025 price hike.

4. **No analytics depth anywhere.** Stan shows total sales and traffic — nothing more. No traffic source attribution means a creator posting on both Instagram and TikTok cannot tell which platform drives purchases. No customer LTV. No funnel performance. Creators are flying completely blind on ROI by content channel.

5. **Pre-revenue creators are priced out.** Stan charges $29/mo from day 15 of trial with zero revenue earned. Creators who haven't made a first sale yet churn out. Beacons' 9% free plan captures this segment, which later converts to paid. Linktohub has no free tier and therefore no pre-revenue funnel.

6. **Generic storefront design kills brand identity.** "Every Stan Store looks the same. My fans know it's a template." Stan's customization is limited to background color, font, and header image. Creators with strong visual brands (fashion, beauty, fitness) feel the friction immediately.

7. **Course tools are inadequate below $119/mo.** No quizzes, no certificates, no progress tracking on Stan or Beacons. Creators selling $97–$497 educational programs eventually migrate to Kajabi or Teachable, breaking the all-in-one stack. Certificate issuance is the single most-cited missing feature in this price band.

---

## Feature Ideas (ranked by impact)

1. **AutoDM / Comment-to-DM automation (Instagram)** — A follower comments a keyword ("LINK", "PRICE", "INFO") on a Reel and instantly receives a DM with a product link, download, or coupon. Instagram API supports this fully. Stan ($29 base) and Beacons (all tiers including free) both ship it. TikTok's API explicitly blocks third-party DM access — Instagram-only is the correct scope. This is not a nice-to-have. It is now the primary conversion mechanism creators evaluate a platform on.

2. **Gumroad migration calculator page** — One-page tool: "Enter your monthly Gumroad sales → see what you keep vs. Linktohub." Inputs: monthly revenue, average sale price, refund rate. Output: side-by-side fee comparison. Share-worthy. SEO capture for "gumroad alternatives 2026." Builds itself in a day. No competitor has built it yet. The creator outrage moment is now.

3. **Stripe Instant Payouts toggle in dashboard** — Stripe Instant Payouts (GA, 0.25% fee capped at $25) settle in ~30 minutes vs. Gumroad's 7-day cycle. Add a creator dashboard toggle: "Standard payout (3-5 days, free) / Instant payout (30 min, 0.25%)." Market it as "get paid the moment you make a sale." This is a single Stripe API call on top of existing Connect integration.

4. **Email marketing at base plan price** — Stan charges $99/mo for email. Beacons includes email automation at $30/mo. Including email sequences, automations, and basic segmentation in Linktohub's base plan is a direct head-to-head win against Stan's biggest exposed flank. The marketing message writes itself: "We do what Stan Pro does, at Stan Creator price."

5. **Merch + digital bundle upsells** — Bundle a Gelato merch item with a digital product at checkout. "Buy my preset pack, get the branded tee at 20% off." No competitor offers cross-category bundling. High AOV lift, zero added creator work. This is exclusive to Linktohub because no competitor does merch at all.

6. **Traffic source attribution in analytics** — Instagram vs. TikTok vs. email vs. direct: which drives actual purchases? No platform answers this today. A UTM-aware revenue dashboard with pre-built UTM links per platform makes Linktohub the analytics home base for multi-platform creators. Sticky retention feature.

7. **Course completion certificates** — Auto-generated PDF certificate with creator branding when a student finishes a course. Low dev complexity, high perceived value. Blocks churn to Kajabi for serious education creators. Certificate issuance is the #1 most-cited missing feature in sub-$50 course tools.

---

## Pricing Intelligence

| Platform | Monthly Fee | Platform Fee | Email Marketing | AutoDM | Merch/POD |
|---|---|---|---|---|---|
| Stan.store | $29 / $99/mo | 0% | $99 tier only | Yes ($29+) | No |
| Beacons.ai | Free / $10 / $30 / $90/mo | 9% (Free/$10), 0% ($30+) | Limited free, full at $30+ | Yes, all tiers incl. free | No |
| Gumroad | $0 | ~20% effective (10%+$0.50, 30% via Discover) | None | No | No |
| Linktree | Free / $8 / $15 / $35/mo | 12% (free), 9% ($8/$15), 0% ($35) | Integrations only, $15+ | No | No |
| Koji | Defunct | — | — | — | — |
| **Linktohub opportunity** | **~$29–39/mo all-in** | **0%** | **Include at base** | **Ship now** | **Yes (Gelato + Printify)** |

**The open pricing position:** $29–39/mo with 0% platform fees + email included + merch + AutoDM + bookings is genuinely unoccupied. Stan has 0% fees but no email under $99. Beacons has 0% at $30 but no merch and limited email. The creator who wants "everything, transparent pricing, no percentage cut" has nowhere to go. Linktohub can own this slot with the right pricing page.

**Tactical messaging:** On a $1,000/mo revenue creator, Gumroad takes ~$100-200. Linktree free takes $120 + Stripe. Beacons free takes $90 + Stripe. Stan takes $0 in fees but $29 flat. Linktohub at $29-39/mo with 0% fees is strictly better than every percentage-fee competitor above $400/mo in monthly sales. That math should be on the homepage.

---

## Tech Opportunities

**Stripe Sessions 2026 (announced this month — 288 new features):**
- **Stablecoin payouts to 100 new countries:** Stripe will use stablecoin rails for instant international creator payouts. Significant for Linktohub creators with audiences in LatAm, SEA, Africa — markets where bank transfer times destroy creator trust. Beta waitlist worth joining now.
- **Marketplace seller wallets:** Stripe previewed wallets where marketplace sellers hold earnings, make on-platform purchases, and receive prepaid debit cards drawn from their balance. A "Linktohub wallet" — where a creator's earnings flow directly into a balance they can spend on their next Gelato merch order — is a compelling product concept.
- **Instant Payouts (GA today):** Settle in ~30 minutes, 24/7. 0.25% fee (capped at $25). Ship a creator dashboard toggle this sprint. Direct win over Gumroad's 7-day cycle.

**Instagram API (June 2026 state):**
- Basic Display API is fully deprecated. Mandatory app review required for new third-party integrations — this process takes 2–4 weeks. Start the review NOW if AutoDM isn't already in review.
- Comment-to-DM automation works via the Messaging API for business/creator accounts. Fully supported, production-ready, used by Stan and Beacons already.
- Audience demographic API access requires explicit creator authentication. Needed for the media kit feature.

**TikTok API (June 2026 state):**
- TikTok Shop API is now production-accessible — pull product listings, sales metrics, creator partnership data programmatically.
- TikTok DM API: still not available to third parties. Do NOT roadmap TikTok AutoDM — it's an API-blocked feature and would require TikTok partnership access Linktohub does not have.
- Creator Search Insights API: provides aggregate demographic signals for creators discoverable via API. Useful for the future media kit / brand deal features.

**Printify as Gelato supplement:**
- Printify: 1,300+ products, strong North American fulfillment, API integration available.
- Gelato: ~250 products, faster EU/international fulfillment.
- Podbase: 24-hour printing in USA and EU — fastest production speed in the category.
- Action: Add Printify as a second POD option. US creators will see immediately better product variety. Gelato + Printify together is a stronger pitch than either alone.

**AI differentiation — market more, build less:**
- Beacons "Beam" = AI content generator (captions, emails, bio). NOT a personalized chatbot.
- Stan = no AI whatsoever.
- Linktohub's AI trained on creator's voice is in a category of one. It answers customer questions AS the creator. This is commerce-facing AI, not content-creation AI.
- The trend in 2026 creator monetization: selling "experiences not files." Paid challenges (70-80% completion) vs. self-paced courses (25% completion). An AI that can guide fans through a paid challenge in the creator's voice is a natural extension.
- Action: Homepage hero needs to demonstrate this with a video. "Your AI, your voice, your fans."

---

## Message for Sprint Planner

**This week: AutoDM must ship. Gumroad calculator page in parallel. Instant Payouts toggle is a 1-day add.**

**AutoDM — second week flagged, still unshipped.** This is the only feature that moves a creator from "considering Linktohub" to "choosing Linktohub" in a head-to-head with Stan. Instagram API supports it. Stan ships it at $29. Beacons ships it for free. Every 2026 creator platform article lists it as must-have. If there's a technical blocker, surface it this week. If it's in Instagram app review (2-4 week process), say so and give a ship date. If it hasn't started yet, that's the sprint goal.

**Gumroad calculator page — ship alongside AutoDM dev.** Creator anger at Gumroad is peaking in June 2026. A simple fee calculator (enter revenue, see real take-home vs. Linktohub) is a 1-2 day marketing build, not an engineering sprint. It captures high-intent migrators during a window that will close. Assign to design/marketing, not engineering.

**Instant Payouts toggle — engineering 1-pager.** Stripe's Instant Payouts API is GA. Add a toggle in the creator payout settings: "Standard (3-5 days, free)" vs. "Instant (~30 min, 0.25%)." Pass the 0.25% to the creator — they will pay it willingly. The message: "get paid the moment you make a sale." Direct attack on Gumroad's 7-day cycle. Single-session engineering change on top of existing Stripe Connect integration.

**Hold this sprint:** Email tier restructure (pricing/product decision needed before dev), media kit builder (right feature, wrong timing), Printify integration (do after AutoDM ships), course certificates (Q3).

**Evidence:** AutoDM — Stan January 2026 launch announcement + Beacons feature matrix + 7 of 7 2026 platform comparison articles. Gumroad fee outrage — 6 separate roundup articles, Reddit threads active June 2026, YouTube content circulating. Instant Payouts — Stripe Instant Payouts documentation (GA), Gumroad payout complaints confirmed across multiple 2026 sources.
