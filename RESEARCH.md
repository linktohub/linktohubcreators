# Research Report — 2026-06-20

## Top 3 Opportunities (act on these this week)

1. **Email marketing at base plan price — Stan's #1 exposed flank, still unguarded by any competitor.** Every 2026 Stan Store alternatives article leads with the same complaint: email marketing costs $99/month (3.4× the base). Beacons includes it at $30/month. No platform in the sub-$40/month bracket offers email + 0% fees together. Linktohub shipping even basic broadcast + sequences at the base tier instantly wins every creator who has Googled "Stan Store alternative" in the last 30 days — that's a measurable, reachable population, not a vague TAM.

2. **Stripe instant payouts: $0 dev, live this sprint.** Stripe Sessions 2026 (this month's launch event) announced 288 new features including instant payouts now GA in 20 additional European markets and stablecoin rails for 100 new countries. Gumroad's 7-day payout cycle is a documented, publicly-complained-about failure. Adding a "Standard (3-5 days, free) / Instant (~30 min, 0.25%)" toggle in the Linktohub payout dashboard is a single Stripe Connect API call — an afternoon of engineering. Market it as "get paid the moment you make a sale." No competitor actively positions this.

3. **Add Printify as a second POD partner alongside Gelato.** Gelato's catalog has ~250 products. Printify has 1,300+; Printful has 600+. Creators who want candles, puzzles, pet products, or premium wall art can't get them from Gelato and currently have no merch option on Linktohub. This blocks the platform from being a genuine all-in-one for mid-tier creators. Printify offers an open API. Pairing Gelato (strong EU fulfillment) + Printify (North America breadth) is a competitive pitch no competitor can match — they don't do merch at all.

---

## Competitor Intelligence

### Stan.store
- **Pricing**: $29/month (Creator), $99/month (Creator Pro). No free plan — 14-day trial only. 0% platform fees on both tiers. Annual: $25/$79/month.
- **AutoDM (flagged last week, confirmed still a moat)**: Comment-to-DM automation ships on the $29 base plan. This is their primary conversion hook over pure link-in-bio tools. Instagram-only (TikTok DM API still not available to third parties as of June 2026).
- **Email wall**: Email marketing, funnels, affiliates, and pixel tracking all locked at $99/month. This is the #1 reason creators search for alternatives. Stan's own blog is now publishing "Stan Store alternatives" articles — a reliable signal they are losing trial-to-paid conversions to feature comparisons.
- **Course infrastructure**: No quizzes, no certificates, no completion tracking. Adequate for a short video series; not for serious education businesses. Creators earning >$500/month from courses migrate to Kajabi ($119+/month) because of this.
- **Customization**: Background color, font, header image. Every store looks identical. Creators with strong visual brands (fashion, beauty, fitness) note this instantly.
- **Analytics**: Total sales and traffic only. No traffic source attribution, no customer LTV, no funnel view. Multi-platform creators cannot tell whether Instagram or TikTok drove a sale.
- **Conversion hook**: "Zero transaction fees" + "AutoDM turns comments into customers."

### Beacons.ai
- **Pricing**: Free (9% transaction fee), $10/month, Creator Pro $30/month (0% fees, email marketing, custom domain, no branding, unlimited AI), Max $90/month.
- **Scale**: 7M+ creators. Founded by three Stanford ML PhDs.
- **AI ("Beam")**: Generates captions, emails, bio copy, content ideas. Pulls live social stats into a media kit. Critical distinction: Beam is a content-generation AI — it is not a chatbot trained on the creator's voice. Linktohub's AI assistant is in a category of one.
- **AutoDM (Smart Reply)**: Included on all tiers including free. This is the gap that continues to matter most in head-to-head creator evaluations.
- **No merch/POD**: Beacons explicitly stays out of physical commerce. Creators must link out to Gelato, Printify, or Shopify separately. Linktohub's native POD is a differentiation layer Beacons cannot copy without rebuilding their product.
- **Fee trap at free/low tier**: 9% on all sales. On $1,000/month in revenue that's $90 to Beacons before Stripe's cut. Mid-tier creators feel this quickly and either upgrade to $30/month or look elsewhere.
- **"Beacons for Brands"**: An affiliate/brand marketplace connecting brands to creators with transparent conversion data. A B2B acquisition layer Linktohub does not have. This is a future moat worth monitoring.
- **Conversion hook**: "The free plan that actually works" + AI tools + media kit for brand deals.

### Gumroad
- **Pricing**: $0 monthly. 10% + $0.50 per sale (platform) plus Stripe's 2.9% + $0.30. Effective real-world rate: ~21% on a $10 sale, ~13% on a $500 sale. Gumroad Discover (their marketplace) charges 30% flat.
- **The refund problem (active creator anger in June 2026)**: Gumroad does NOT refund its 10% when a creator issues a refund. Sell $100, refund $100, still owe $10.50 to Gumroad. Multiple Reddit threads, YouTube videos titled "Gumroad fees exposed" are circulating this month. This is a live, hot acquisition window.
- **7-day payout cycle**: Widely complained about. "You wait a week to see your own money" appears repeatedly in Gumroad reviews. Stripe Instant Payouts destroys this disadvantage for any competitor who ships it.
- **Support**: Described as "non-existent" across multiple 2026 sources. Bot responses, slow turnaround, account suspensions without human review.
- **Genuine strength**: Merchant of Record (handles VAT/GST/US sales tax globally). Truly $0 to start. Brand recognition in digital products space.
- **No ecosystem**: No link-in-bio, no bookings, no memberships, no events, no merch, no AutoDM, no email marketing. Pure checkout link only.
- **Verdict**: Gumroad creators are actively migrating. The moment is now.

### Linktree
- **Pricing**: Free (12% seller fee), $8/month Starter, $15/month Pro (9% fee, advanced analytics, Instagram automation, link scheduling), $35/month Premium (0% fee).
- **Fee structure revealed**: 12% fee on free plan. To reach 0% fees, you pay $35/month — more than Stan Store's base. This was a price hike in November 2025 and is still generating backlash.
- **Koji acquisition absorbed**: Linktree acquired Koji (December 2023). 400+ Koji mini-apps (tip jars, fan subscriptions, paid DMs) are being absorbed into Linktree's commerce layer. The commerce story is strengthening but remains an afterthought vs. native tools.
- **Core structural weakness**: A traffic router, not a commerce platform. No email capture on free/Starter tiers. No CRM. No AutoDM. No native merch. A fan clicks through Linktree and vanishes — Linktree retains no memory of the visit.
- **2026 search trend**: "Linktree alternatives 2026" searches remain elevated since the November 2025 price hike. The platform retains users through category name recognition ("link in bio"), not product value.
- **Conversion hook**: Name recognition only. No meaningful product hook.

### Koji
- **Confirmed defunct as independent platform.** Acquired by Linktree December 2023. Remove from standalone tracking — any remaining "koji.com" references in 2026 articles refer to inactive or redirected pages. Features being absorbed into Linktree. Not a competitive threat.

---

## Creator Pain Points

1. **"I can't afford $99/mo just to email my own list."** Stan's email wall is the single most cited reason creators search for Stan alternatives in every 2026 review, roundup, and Reddit thread. Not a niche complaint — the primary churn trigger, confirmed across 7+ independent 2026 sources.

2. **Gumroad fee deception is hitting a peak.** Creators doing the math in public: a $10 Gumroad sale nets $7.91 (20.9% effective rate, not the advertised 10%). The no-refund-on-fees policy is being called a "trap." The 30% Discover fee is labeled "extortion." Multiple June 2026 YouTube videos + Reddit threads on this topic are actively circulating. This is a temporary but intense acquisition window.

3. **Linktree's 12% free-tier fee is invisible until it stings.** Creators set up Linktree free, sell a $100 product, and net $84.25 after Linktree (12%) + Stripe (2.9% + $0.30) + withdrawal fee ($0.25). They discover the math after the sale. "Linktree alternatives" search volume has been elevated and sustained since November 2025.

4. **Pre-revenue creators priced out by subscription walls.** Stan charges $29/month from day 15 of trial with zero revenue yet. Beacons' 9% free plan captures this segment, which later converts to paid. Linktohub has no free tier and no pre-revenue creator funnel.

5. **No analytics depth on any platform.** Stan shows total sales + traffic, nothing more. Instagram vs. TikTok attribution is invisible. No customer LTV. No funnel view. Multi-platform creators are flying blind on what content drives actual purchases — every platform in the space has this gap.

6. **Course tools are inadequate below $119/month.** No quizzes, no certificates, no completion tracking on Stan or Beacons at entry pricing. Creators running $97-$497 educational programs eventually migrate to Kajabi, breaking the all-in-one stack. Certificate issuance is the #1 cited missing feature in this price band.

7. **Mobile experience is decisive but underbuilt.** Mobile/app users are 141% more engaged than web users and log in 63% more often (Uscreen, 2026). Platforms without strong native mobile store experiences are losing engagement. Mobile viewership is surpassing desktop web on most creator platforms.

8. **Generic storefront design kills brand identity.** Every Stan Store uses the same template range (color, font, header). Creators with strong visual brands in fashion, beauty, or fitness immediately feel the friction. "My fans can tell it's just a template" appears regularly in Stan reviews.

---

## Feature Ideas (ranked by impact)

1. **Email marketing in base plan** — Direct attack on Stan's most-exposed weakness. Even basic broadcast + sequences + list management at the $29-tier equivalent wins every head-to-head comparison. Message writes itself: "We do what Stan Pro does at Stan Creator price." Win: converts the large population actively Googling "Stan alternatives" right now.

2. **Instant Payout toggle in creator dashboard** — Stripe Instant Payouts is GA. Toggle: "Standard (3-5 days, free) / Instant (~30 min, 0.25%)." Pass 0.25% to creator — they will pay it willingly. Market: "get paid the moment you make a sale." Direct destruction of Gumroad's 7-day payout complaint. Low engineering cost, high retention value.

3. **Printify integration alongside Gelato** — Expand native POD catalog from ~250 to 1,300+ products. Gelato stays for EU-speed; Printify adds North American breadth + niche products (candles, puzzles, wall art, pet accessories). No link-in-bio competitor does any merch at all — Linktohub's entire POD angle is a moat; make it deeper.

4. **Merch + digital product bundle at checkout** — Bundle a Gelato/Printify item with a digital product. "Buy my preset pack, get the branded tee at 20% off." No competitor offers cross-category bundling (they don't do merch). High AOV lift, zero extra creator work. Linktohub-exclusive feature.

5. **Tip jar + fan shoutout app** — Koji's core monetization micro-apps had a loyal creator audience, especially among musicians. Koji is now defunct. A simple "tip me" + "buy a personalized shoutout video" feature captures these creators who are currently without a home. Low dev complexity, immediate monetization for creators who aren't ready for a full product.

6. **Traffic source attribution analytics** — UTM-aware revenue dashboard showing Instagram vs. TikTok vs. email vs. direct, which drives actual purchases. No platform in the space answers this today. Builds sticky, hard-to-migrate retention. The creator who can attribute revenue by content platform will never want to leave.

7. **TikTok Creator Search Insights API integration** — Surface trending search terms creators' audiences are looking for, directly in the creator dashboard. "Your fans are searching for [X] — build a product around it." First mover. No competitor has this. Ties the AI assistant to actionable data.

8. **Course completion certificates** — Auto-generated PDF cert with creator branding when a student finishes a course. Blocks churn to Kajabi for serious education creators. #1 cited missing feature in sub-$50 course tools. Low dev complexity, high perceived value.

9. **Media kit generator (powered by AI assistant)** — One-click media kit from the creator's existing analytics and product data. Beacons has a version of this. Linktohub's AI-in-creator-voice angle makes the copy uniquely on-brand. Helps creators pitch brand deals from within the platform.

---

## Pricing Intelligence

| Platform | Free Tier | Base Paid | Pro Paid | Platform Fee | Email Mktg | AutoDM | Merch/POD |
|---|---|---|---|---|---|---|---|
| **Stan.store** | None (14-day trial) | $29/mo | $99/mo | 0% | $99 tier only | Yes ($29+) | No |
| **Beacons.ai** | Yes | $10/mo | $30/mo | 9% (free), 0% ($30+) | Limited free, full $30+ | Yes, all tiers | No |
| **Gumroad** | Yes (no monthly) | — | — | ~21% effective (10%+$0.50) | No | No | No |
| **Linktree** | Yes | $8/mo | $15–$35/mo | 12% (free), 9% ($8/$15), 0% ($35) | Integration only | No | No |
| **Koji** | Defunct | — | — | — | — | — | — |
| **Linktohub target** | — | ~$29–39/mo | — | 0% | **Include at base** | Ship now | Yes (Gelato + Printify) |

**The unclaimed position**: $29–39/month with 0% platform fees + email marketing included + native merch + bookings + events + memberships + AI assistant is genuinely unoccupied. Stan has 0% fees but no email under $99. Beacons has email at $30 and 0% fees but no merch and no voice AI. No competitor sits at this intersection.

**The math that should be on the homepage**: On $1,000/month in sales — Gumroad takes ~$105-210. Linktree free takes $120 + Stripe. Beacons free takes $90 + Stripe. Stan takes $0 in fees but $29 flat. Linktohub at $29/month with 0% fees is strictly better than every percentage-fee competitor for creators earning more than ~$300/month. That calculation is a conversion tool, not just positioning.

---

## Tech Opportunities

**Stripe Sessions 2026 (288 features, launched this month):**
- **Instant Payouts (GA)**: Live in 20 additional European markets. 0.25% fee, ~30-minute settlement, 24/7. API flag to add to existing Stripe Connect integration. Afternoon-of-engineering scope.
- **Stablecoin payout rails**: Stripe partnering with Meta to use stablecoin infrastructure for creator payouts across 100 new countries. Meta integration planned H2 2026. Particularly relevant for creators with LatAm, SEA, and African audiences where bank transfer times destroy trust. Join the beta waitlist now.
- **Marketplace seller wallets**: Stripe previewing wallets where marketplace sellers hold earnings, spend on-platform, receive prepaid debit cards from balance. A "Linktohub wallet" where creator earnings directly fund the next Gelato merch order is a natural product extension from this infrastructure.
- **Custom payout schedules per Connect account**: Fine-grained payout timing control per creator. Enables differentiated tier benefits ("Pro creators get weekly payouts, Standard creators get monthly").

**TikTok API (June 2026 confirmed state):**
- **Creator Search Insights API**: New in 2026. Shows what TikTok users are searching for, segmented by creator. Directly actionable for product/content ideation in Linktohub dashboard.
- **Hashtag Analytics API (expanded)**: Now includes audience demographics + trend velocity. Useful for future media kit / brand-matching features.
- **TikTok Shop API**: Production-accessible. Pull product listings, sales metrics, creator partnership data programmatically.
- **TikTok DM API**: Still NOT available to third parties as of May 2026. Do NOT roadmap TikTok AutoDM — it requires TikTok's own partnership program. Instagram-only is the correct scope for AutoDM this year.

**Instagram API (June 2026):**
- Comment-to-DM automation via Messaging API for business/creator accounts: fully supported, production-ready.
- App review for new Messaging API integrations takes 2–4 weeks. If AutoDM isn't already in review, start now.
- Instagram expanding brand partnership integrations with third-party platforms. Opportunity to apply for verified integration status.

**POD Landscape — Gelato upgrade path:**
- **Gelato** (current): ~250 products. Strong EU/international fulfillment speed. Best for global shipping.
- **Printify**: 1,300+ products. Open API. Strong North American network. Best breadth.
- **Printful**: 600+ products. Premium quality + branding tools (pack-ins, neck labels). Best for brand-conscious creators.
- **SPOD**: 48-hour turnaround US + EU. Most affordable + fastest production.
- **Spring (formerly Teespring)**: Native YouTube + TikTok integrations — their primary moat. Relevant if Linktohub integrates TikTok Shop API.
- **Podbase**: 24-hour printing in USA + EU. Specializes in tech accessories and wall art.
- **Recommendation**: Add Printify for breadth (immediate), evaluate Spring for video-platform-native angle (Q3).

**AI creator tool landscape (2026):**
- **Trending tools creators use**: ElevenLabs (voice cloning), Runway ML (video generation), Midjourney (imagery), Jasper/Copy.ai (copy). These are the tools creators affiliate-market for 20–50% recurring commissions.
- **Key insight**: Linktohub's AI assistant trained on the creator's voice is in a category of one. Beacons' "Beam" generates content; it does not speak as the creator. Stan has no AI. The positioning should be sharper: "Your AI, your voice, your store" — it answers fan questions as you, not as a generic chatbot.
- **Emerging trend**: "Experiences not files." Paid challenges (70–80% completion rate) vs. self-paced courses (25%). A creator's AI guiding fans through a paid challenge in the creator's exact voice is a natural product evolution and a feature no competitor can replicate without the same AI infrastructure.

---

## Message for Sprint Planner

**This week: Ship email marketing in base plan. Add instant payout toggle. Start Printify API scoping.**

**Email marketing is the acquisition move.** The population Googling "Stan Store alternatives" in June 2026 is real, measurable, and motivated. Every comparison article they read identifies email marketing as Stan's gap. Linktohub is not in those articles yet. Getting email marketing into the base plan — even basic broadcast + list management + 3-step automations — makes Linktohub the obvious answer to a search that is happening right now. This is not a roadmap feature; it's a retention and acquisition lever being left on the table.

**Instant payout toggle is 1 day, not 1 sprint.** Stripe's Instant Payouts API is GA. Gumroad's 7-day cycle is actively complained about. Adding the toggle in creator payout settings (Standard / Instant) passes the 0.25% Stripe fee to the creator — they will pay it. Assign to one engineer for one day. Market it as "get paid the moment you make a sale." First competitor to market this messaging owns it.

**Printify scope this sprint, integrate next sprint.** Gelato's 250-product catalog limits which creators Linktohub can serve. Printify's API is documented and open. Sprint Planner should assign a technical scoping session this week so integration can begin next sprint. Mid-tier creators selling merch in niches beyond basic apparel (candles, wall art, phone cases, pet products) are currently excluded from Linktohub's POD offering.

**Hold for now**: AutoDM (confirm whether in Instagram app review or still unstarted — if unstarted, this becomes P0 next sprint), course certificates (Q3), media kit generator (Q3), traffic attribution dashboard (Q4 or separate project team).

**Evidence summary**: Email marketing complaint — cited in 7+ independent 2026 Stan Store alternative articles as the #1 switching reason. Instant payouts — Stripe Sessions 2026 (this month), Gumroad payout complaints confirmed across 5+ sources. Printify gap — Gelato vs. Printify catalog comparison confirmed across 4 POD review sources (June 2026). Creator search intent — "stan store alternative," "linktree alternative 2026," "gumroad fees" all showing elevated search volume per multiple SEO roundup sources.

---

## Prior Report Reference
*Previous report (2026-06-13) archived below for continuity. Key carryover items: AutoDM (confirm review status), Gumroad calculator page (still unbuilt by any competitor), Stripe instant payouts (confirmed GA this week).*

---

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
