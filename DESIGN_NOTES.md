# Design Notes — Wednesday Audit Pass

---

## Pass: 2026-06-17 · Score before: ~6.5/10 → after: ~7/10

### What Was Fixed

#### 1. `scrollbar-none` CSS missing — tab bars showing scrollbars (`globals.css`)
The class was used everywhere (storefront tabs, products filter tabs) but had no CSS definition. On Firefox and desktop Chromium the scrollbar was visible. Added `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`. Also added `-webkit-tap-highlight-color: transparent` to `button, a` — eliminates the blue flash on mobile taps globally.

#### 2. Storefront tip widget unusable on mobile (`storefront-client.tsx`)
The tip input was `w-14` (56px fixed) and the send button was `px-2 py-1` (too small, unclear label). Changed: input to `flex-1 min-w-0` inside a `min-w-[140px]` container, button to `h-8 px-3` with "Send" text label. Now readable and tappable at 375px.

#### 3. Subscribe button text too long on narrow screens (`storefront-client.tsx`)
"Sign in to subscribe — $X/mo" is ~30 characters and overflows the button on narrow screens. Shortened to "Sign in to subscribe" — the price already shows in the tier header directly above.

#### 4. Mobile tap feedback missing on primary actions (`storefront-client.tsx`, `page.tsx`)
Main CTA buttons (AI chat, Book, tabs, subscribe) had zero visual feedback on tap. Added `active:opacity-75 transition-opacity` to tab buttons, CTA buttons, and subscribe. Homepage hero CTA now has `active:opacity-80`.

#### 5. Dashboard stats cards — dead `group` class and weak hierarchy (`dashboard/page.tsx`)
Cards had `group transition-all` but no `group-hover:` children — dead class. Also the label was on top with the value at bottom, making the metric hard to scan. Restructured: icon at top-left, value `text-2xl font-black` prominent, label `text-xs text-white/35` beneath. Mirrors Stan/Linear card patterns. Removed generic "Here's what's happening with your storefront." subtitle from the greeting — it said nothing.

#### 6. Create product event form felt like a government form (`products/create/page.tsx`)
6 fields each with its own uppercase `tracking-wider` label above (`Date`, `Time`, `Duration (min)`, `Max spots`, `Price ($)`, `Type`) — 12 DOM elements for data entry. Replaced with placeholder-only inputs in the same grid. A single brief prompt line ("When is it happening?") replaces all 6 labels. Date/time inputs show format hints natively; number inputs use `placeholder=` text.

#### 7. Products empty state too sparse (`products/products-client.tsx`)
Was a bare `border border-white/[0.06] rounded-2xl py-20` box — no visual hierarchy, no energy. Now has: `bg-gradient-to-b from-violet-500/[0.05]` background, a framed icon container (`w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20`), stronger title (`font-black text-white` instead of `text-white/40 font-semibold`), and a properly sized CTA (`h-11 px-7` instead of `py-3 px-6`).

#### 8. Homepage "How it works" padding crushed on mobile (`page.tsx`)
Section card had `p-10` (40px all sides) — on 375px that left only 295px of content width. Changed to `p-6 md:p-10`.

---

### What Still Needs Work (Next Pass)

**High priority**
- **Products list row overflow on 375px**: with emoji + title + price + edit + toggle + delete, fixed elements total ~300px leaving only ~35–75px for the product title. Needs swipe-to-reveal actions or a "..." kebab menu on mobile.
- **Storefront product modal close button**: `X` at `top-4 right-4` overlaps long product titles in the `p-6` content area. Add `pr-10` to the title container.
- **Digital tab empty state** (storefront): bare `<p className="text-white/25 text-center py-16">No digital products yet</p>` — one line. Apply same empty state treatment as products page.

**Medium priority**
- AI chat paywall icon uses `brandColor + "22"` (8% opacity) — invisible with light brand colors. Use fixed `bg-violet-500/10` instead.
- ProductCard "Add" button is `h-9` (36px) — below 44px tap target minimum. Needs `h-10`.
- Homepage features grid `p-5` cards compress to ~100px wide at 375px (2-col). Consider `p-4` on mobile or a horizontal list.
- Subscription tier cards have no visual differentiation — consider a "Most popular" badge on the middle tier.

**Low priority**
- Storefront acquisition bar at bottom could be a gradient-border card rather than bare `border-t` for more premium feel.
- Footer on homepage has only 3 links — add Privacy / Terms before launch.
- Sidebar nav: "Products" and "Digital" both point to `/dashboard/products` — confusing duplication.

---

## Pass: 2026-06-10 · Score before: ~5.5/10 → after: ~6.5/10

### What Was Fixed

#### 1. Dark mode CSS variables applied (`layout.tsx` + `globals.css`)
`<html>` had no `dark` class. The shadcn variable system puts light colors in `:root` and dark in `.dark` — without the class, any shadcn component (toaster, future dialogs) renders with white backgrounds on a dark page. Fixed. Also fixed `--font-sans: var(--font-sans)` (circular self-reference) → `var(--font-geist-sans)` so Geist is the actual applied UI font.

#### 2. Unreadable 10px form labels (`create/page.tsx`)
All 6 event form labels used `text-[10px]` — below the readable minimum for uppercase tracking text at low opacity. Changed to `text-xs` (12px). Added `[color-scheme:dark]` to the event type `<select>` so the native dropdown uses dark styling.

#### 3. Small touch targets on products list (`products-client.tsx`)
Edit and delete icon buttons were `w-8 h-8` (32px) — below the 44px minimum. Changed to `w-10 h-10 rounded-xl`.

#### 4. Tab bar edge clip on mobile (`products-client.tsx`)
Category filter tabs had no edge bleed — the scrollable row started 20px from screen edge (parent `p-5`). Added `-mx-5 px-5 md:mx-0 md:px-0`. Matches the storefront tab pattern.

#### 5. Near-invisible footer links (`page.tsx`)
Footer nav links were `text-white/20` — ~1.3:1 contrast ratio. Changed to `text-white/40`.

#### 6. ProductCard "Add" button too small to tap (`storefront-client.tsx`)
Button was ~24px tall (`py-1.5`). Added `h-9 flex items-center justify-center` to the button. Added `active:scale-[0.98] transition-transform` to cards and `active:scale-95` to the button for mobile tap feedback. (This was flagged in the 2026-06-03 pass as high priority and is now done.)

#### 7. Duplicate `cn` utility in dashboard (`dashboard/page.tsx`)
Local `cn` function duplicated `@/lib/utils`. Removed, imported from utils.

### What Still Needs Work (Next Pass)

**High priority**
- Auth pages and onboarding form styling — not audited. May have light-mode rendering issues in shadcn form components.
- Event register button on storefront still small (`text-xs px-3 py-1.5`) — needs `h-9` treatment.
- Storefront CTA row (Book / AI Chat / Tip) can stack awkwardly at 375px when all three are enabled.
- Dashboard stats cards have no `active:scale` press feedback on mobile.

**Medium priority**
- Landing hero `leading-[0.9]` on mobile: 5-line wrap at `text-5xl` is very tight. Consider `leading-[0.95] md:leading-[0.9]`.
- "View storefront" link in sidebar nav: sub-16px touch target, needs `py-1` or button treatment.
- Sidebar nav redundancy: "Products" and "Digital" are separate items but both go to `/dashboard/products`.

**Low priority**
- Storefront tab scroll indicator: no visual fade-right cue that tabs are horizontally scrollable.
- Subscription tier cards lack visual differentiation between tiers.
- ProductCard emoji placeholder (👕, 📦) when no image — should be a gradient placeholder using brand color.

---

## Pass: 2026-06-03 · Score before: 5/10 → after: ~5.5/10

### What Was Fixed

### 1. Landing page — mobile overflow on "How it works" and Pricing grids
`src/app/page.tsx`

Both sections used `grid-cols-3` with zero mobile breakpoint. On 375px they crammed three columns into ~100px each — completely unreadable. Fixed: `grid-cols-1 md:grid-cols-3` for "How it works", `grid-cols-1 sm:grid-cols-3` for pricing.

### 2. Nav — duplicate Earnings link
`src/components/dashboard/nav.tsx`

The "Account" group duplicated `/dashboard/payouts` (Earnings) which was already in the "Monetize" group. Removed duplicate.

### 3. Mobile bottom nav — active state
`src/components/dashboard/nav.tsx`

Active state was only a color change (`text-violet-400`). Added `bg-violet-500/[0.12]` background pill so the active tab is visually distinct. Matches the desktop nav treatment.

### 4. Storefront banner — background color seam
`src/app/[username]/storefront-client.tsx`

Banner overlay gradient stopped at `#0a0a0a` while page bg is `#050508`. Caused a visible color seam on the banner-to-content transition. Fixed both the gradient stop and the avatar border.

### 5. Dashboard storefront card — URL overflow
`src/app/dashboard/page.tsx`

The `<code>` URL element had no width constraint. Long usernames overflowed the card on mobile. Now hidden on mobile (`hidden sm:block`) with `max-w-[180px] truncate` on larger screens.

### 6. Products list — delete button icon
`src/app/dashboard/products/products-client.tsx`

Delete used a unicode `✕` character — inconsistent with the Lucide icon system used everywhere else. Replaced with `<Trash2 />`. Added `animate-pulse` on loading state.

### 7. Create product page — padding alignment
`src/app/dashboard/products/create/page.tsx`

Used `p-6` while the design system standard is `p-5`. Aligned.

---

## Previous pass notes (2026-05-31)

---

## What Was Fixed

### 1. Active tab pill — products-client.tsx
**Problem:** Active filter tab used `bg-white text-black` — a harsh white pill that broke dark-mode consistency entirely.  
**Fix:** Changed to `btn-gradient text-white` (violet→fuchsia gradient). Now consistent with every other primary action in the app.

### 2. Mobile nav tap targets — nav.tsx
**Problem:** Bottom nav items had `py-1.5 text-[10px]` = ~34px total height. Apple HIG and Material both require 44px minimum.  
**Fix:** Changed to `py-2.5 min-h-[52px] text-[11px] font-semibold`. Comfortable tapping area on any thumb size.

### 3. iOS safe-area-inset — globals.css + nav.tsx
**Problem:** `safe-area-bottom` CSS class was referenced in the mobile nav but never defined anywhere. On iPhones with a home indicator, the nav tabs were partially obscured.  
**Fix:** Added `.safe-area-bottom { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px); }` to globals.css. Falls back to `8px` on non-iOS devices.

### 4. Storefront background color — storefront-client.tsx
**Problem:** Storefront used `bg-[#0a0a0a]` while the design system and homepage use `#050508`. Subtle but creates a mismatched feel on direct comparison.  
**Fix:** Changed to `bg-[#050508]`.

### 5. Chat send button tap target — storefront-client.tsx
**Problem:** The AI chat send button was `px-4 rounded-xl` with no explicit height — browser determined height from font-size only, giving ~28-30px. Unreliable and undersized on mobile.  
**Fix:** Added `h-11 min-w-[44px] flex items-center justify-center` — guaranteed 44px touch area.

### 6. Delete button tap target — products-client.tsx
**Problem:** Delete button was `w-5 text-center` (20px wide, no height). Positioned directly next to the live/draft toggle. Essentially untappable on mobile, and triggering the wrong one could accidentally delete a product.  
**Fix:** Changed to `w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10` — 32px target with visual feedback on hover.

### 7. Invalid HTML — Link > button nesting — page.tsx
**Problem:** Homepage nav and hero CTAs wrapped `<button>` inside `<Link>`, producing `<a><button></button></a>` — invalid per HTML spec, accessibility tools flag it.  
**Fix:** Moved all button styles directly onto the `<Link>` (which renders an `<a>`). Added `inline-flex items-center justify-center` so text vertically centers correctly.

### 8. Email placeholder verbosity — storefront-client.tsx
**Problem:** Placeholder read "Your email for exclusive updates" — 5 words of label text inside an input that already communicates its purpose via `type="email"` and an adjacent "Join" button.  
**Fix:** Replaced with `your@email.com` — minimal, scannable, still communicates context.

---

## What Still Needs Work (Next Pass)

### High priority
- **Product card "Add" button** (storefront-client.tsx:909) — `px-3 py-1.5` = ~30px tall. Needs `h-9 min-w-[60px]` at minimum.
- **Storefront CTA row** (storefront-client.tsx:403-428) — The `flex-wrap` row with Book / AI Chat / Tip can stack awkwardly at 375px if all three are enabled. Needs explicit layout logic.
- **Dashboard stats cards** — `hover:` state exists via `card-glass:hover` in CSS but there's no `active:scale-[0.98]` press feedback. Feels inert on mobile.

### Medium priority
- **Empty states** — Products page empty state is decent (has CTA). Dashboard has no empty state if stats are all zero — first-time users see four big "0" values which feels unfinished.
- **Dashboard "Quick actions" label** — Uses `text-sm font-semibold text-white/40 uppercase tracking-widest` while stats section has no label. Inconsistent hierarchy pattern across the page.
- **Sidebar nav redundancy** — "Products" and "Digital" are separate nav items under Monetize but both live under `/dashboard/products`. Confusing for users.

### Low priority
- **`<Link><button>` pattern** also exists in dashboard pages — do a global grep for `<Link` followed by `<button` and clean up remaining instances.
- **Merch product card image placeholder** — Shows text emoji "👕" when no image is set. Should be a proper icon component or styled empty state with upload CTA.
- **Homepage feature grid cards** — Have no hover interaction (`transition-all` is set but `card-glass:hover` only slightly brightens). Consider a subtle border highlight or lift on hover.
