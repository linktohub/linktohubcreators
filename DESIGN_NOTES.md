# Design Notes — Wednesday Audit Pass

---

## Pass: 2026-07-22 · Score before: ~4/10 → estimated: ~5.5/10

### What Was Fixed

#### 1. Horizontal tab bars had no scroll affordance (`storefront-client.tsx`, `products-client.tsx`, `globals.css`)
Both the storefront tab bar and the dashboard products tab bar are `overflow-x-auto` on mobile but gave zero visual cue that more tabs exist. Users at 375px would see 3-4 tabs and assume they'd seen them all.
Fix: Added `.scroll-fade-right` CSS utility in `globals.css` — a `::after` pseudo-element that fades the right edge to `#050508`. Applied as a wrapper div to both tab bars.

#### 2. ProductCard "Add" button — cramped layout and ambiguous label (`storefront-client.tsx`)
The "Add" button was `px-3 h-11` positioned inline-right next to the price. On a ~156px card (2-column grid, 375px viewport), the total button area was ~48px wide — technically meeting the 44px minimum but feeling undersized and easy to miss. The label "Add" was also ambiguous (add what, where?).
Fix: Button is now `w-full h-10` spanning the full card width with label "Add to cart". Price moved above it. Visually stronger and immediately understandable.

#### 3. Acquisition bar — duplicate conflicting border classes (`storefront-client.tsx`)
The storefront footer CTA had `border-t border-white/[0.06]` immediately followed by `border border-violet-500/20` in the same className string. In Tailwind, the second `border` class (all-sides) overrides the first border-color set by `border-t`, making the white/6 rule a dead declaration.
Fix: Removed the redundant `border-t border-white/[0.06]` — only `border border-violet-500/20` remains.

#### 4. Low-contrast text in critical user paths (`storefront-client.tsx`, `dashboard/page.tsx`)
Multiple labels were at opacity levels where they fail to read on OLED panels and lower-brightness mobile screens:
- `@username` slug: `text-white/40` → `text-white/50`
- "Tap to view" hint: `text-white/30` → `text-white/45`
- Dashboard stats card labels: `text-white/35` → `text-white/55`
- Storefront card description: `text-white/35` → `text-white/50`

#### 5. Dashboard storefront card — "Open" button orphaned on mobile (`dashboard/page.tsx`)
The card used `flex items-center justify-between flex-wrap gap-4`. On mobile the URL `<code>` block is `hidden sm:block`, so the right div contained only the small "Open" button — which wrapped alone to its own row, appearing disconnected from the content above it.
Fix: Changed to `flex flex-col sm:flex-row`. On mobile the button gets `w-full sm:w-auto` and fills the card width naturally. Also renamed to "Open storefront" for clarity.

#### 6. No `focus-visible` styles — browser default clashes with dark design (`globals.css`)
No custom focus-visible styles were defined. Browser default is a blue outline that looks accidental on a dark violet/fuchsia design system.
Fix: Added `button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid rgba(139, 92, 246, 0.7); outline-offset: 2px; }` to `globals.css`.

#### 7. Mobile bottom nav active state — background only, no position indicator (`nav.tsx`)
The active mobile nav item had only a faint background (`bg-violet-500/[0.12]`). Small background fills on dark surfaces read weakly — users can miss the active state entirely.
Fix: Added a short `w-8 h-0.5` violet-to-fuchsia gradient line absolutely positioned at `top-0` of the active item. iOS/Linear-style indicator that clearly communicates "current page."

---

### What Still Needs Work (Next Pass)

**High priority**
- **Create product form feels like a form** — The feedback input on `/dashboard/products/create` step 3 has an uppercase `tracking-wider` label ("Tell AI what to change") that reads bureaucratic. Should be inline conversational prompt text, not a section header.
- **Storefront empty state for Merch tab** — "Store coming soon" with a shopping bag emoji is generic system-message energy. Should reference the creator's name, e.g. "Drop incoming from @username — join their list."
- **Subscription tier `/mo` suffix contrast** — `$49/mo` price display: the `/mo` suffix is `text-sm font-normal text-white/40` which is nearly invisible at small sizes. Raise to `text-white/60`.

**Medium priority**
- Social link chips have no `active:` state — tap feedback is entirely suppressed by `-webkit-tap-highlight-color: transparent`. Add `active:bg-white/[0.12]`.
- Storefront active tab uses flat `brandColor` background — consider `btn-gradient` fallback when brandColor is too close to white or black to read.
- Dashboard quick action "Create tier" label — 11 chars — can feel tight in 2-col grid on 375px. Consider short labels or icon-only with tooltip.
- Delete action is immediate with no undo — add `toast.success("Deleted", { action: { label: "Undo", onClick: () => {} } })`.

**Low priority**
- No skeleton loading on dashboard stats — shows `0` flash before server data. Add `animate-pulse` placeholder.
- Booking form date/time inputs: `[color-scheme:dark]` helps but Android Chrome native pickers still white-flash on some versions.

---

## Pass: 2026-07-15 · Score before: ~7.5/10 → after: ~8/10

### What Was Fixed

#### 1. Nav active state only matched exact paths — sub-pages showed no active item (`nav.tsx`)
`pathname === href` made the entire left sidebar and mobile bottom nav go dark when visiting sub-pages like `/dashboard/products/create` or `/dashboard/products/123`. Changed both desktop and mobile checks to `href === "/dashboard" ? pathname === href : pathname.startsWith(href)`. Dashboard gets exact-match to prevent it being active on all sub-routes; everything else gets prefix-match. Also bumped mobile active pill from `bg-violet-500/[0.12]` to `bg-violet-500/[0.15]` — the previous value was too faint on OLED screens.

#### 2. Storefront "Book" button had zero background — invisible and untappable (`storefront-client.tsx`)
The Book CTA was `border border-white/20` with no background fill. On `#050508` that's ~1.5:1 contrast — the button was essentially a faint outline on black. Added `bg-white/[0.07]` base and `hover:bg-white/[0.12]` for hover. Also changed from `font-bold` → `font-black` (matches design rule: primary actions use font-black).

#### 3. All storefront CTA buttons used `font-bold` instead of `font-black` (`storefront-client.tsx`)
Design rule: "Large bold fonts (font-black) for headlines" and primary actions. "Chat with AI", "Send" (tip), "Join" (email), "Subscribe", event "Register" buttons were all `font-bold`. Changed to `font-black`. Also bumped the event register button from `h-9` (36px) → `h-10` (40px) for a slightly better touch target.

#### 4. Floating cart button needed safe-area clearance for iOS home indicator (`storefront-client.tsx`, `globals.css`)
The cart button was `fixed bottom-6 right-6` — on iPhones with home indicator, `24px` bottom offset puts it directly behind the gesture bar. Added a `.floating-action` class in globals.css using `bottom: calc(env(safe-area-inset-bottom, 0px) + 24px)` and applied it to the cart button. Fallback is 24px on non-iOS. Also changed `font-bold` → `font-black` and added a `shadow-black/40` to the drop shadow for depth.

#### 5. Kebab dropdown background was `#1a1a2e` — blue-tinted, off-palette (`products-client.tsx`)
The mobile kebab menu rendered with a blue-purple tinted background from an earlier copy-paste. Changed to `bg-[#111]` (matches the cart drawer and auth modal backgrounds) with `border-white/[0.12]` and `shadow-2xl shadow-black/60` for better layering depth. Also bumped minimum width from 120px to 140px so "Delete" text doesn't wrap.

#### 6. Create page back button used `rounded-lg` — inconsistent with `rounded-xl` design rule (`create/page.tsx`)
Both back button variants (Link and button) were `w-8 h-8 rounded-lg`. Design rule says `rounded-xl` for buttons. Changed to `w-9 h-9 rounded-xl` (also bumped size for a slightly more generous touch area). Changed text opacity from `text-white/30` → `text-white/40` for better visibility. Type picker cards now use `active:scale-[0.97] active:opacity-80` instead of the very subtle `active:scale-[0.99]`.

#### 7. `btn-gradient` and `card-glass` lacked active-state transitions (`globals.css`)
`btn-gradient:active` had no definition — pressing primary CTA buttons gave no haptic-aligned visual feedback. Added `transform: scale(0.985)` and `opacity: 0.75` on active. Added `transition: background 0.15s, border-color 0.15s` to `.card-glass` so hover state animates in instead of snapping. Also added `.mobile-nav-item` utility class with transition for future use.

#### 8. Landing page hero line-height too tight on mobile (`page.tsx`)
`leading-[0.9]` at `text-5xl` (48px) gives 43px line height — extremely tight for 2 wrapped lines. Changed to `leading-[0.93]` on mobile, preserving `sm:leading-[0.9]` for larger screens where the heading is single-line. Feature cards gained `border border-violet-500/20` on icon containers and a `group-hover:bg-violet-500/20` fill for subtle hover depth. Secondary CTA ("View pricing") got `active:opacity-70` and `transition-all`.

---

### What Still Needs Work (Next Pass)

**High priority**
- **ProductCard "Add" button**: `h-11` (44px) is the correct size, but the button is on the bottom-right of a 2-col grid card — it's easy to tap accidentally when scrolling. Consider adding a brief `scale` animation as confirmation before dispatching the add action.
- **Storefront CTA row with all three enabled**: Book + AI Chat + Tip spans a `grid-cols-2` + `col-span-2` layout. If the brand color is very light (near white), the Book button at `bg-white/[0.07]` may not be distinguishable. Add a `border-white/30` on Book when brand color is light.
- **Auth modal feels too generic**: The sign-in/sign-up bottom sheet has no branding — it's a plain dark modal. Should show the creator avatar and name above the form so fans know who they're subscribing to.

**Medium priority**
- **Sidebar nav labels** (`text-white/20`) are decorative but still ~1.4:1 contrast. Nudge to `text-white/30`.
- **Storefront acquisition footer** still uses `border-t` divider — a gradient-border card with soft violet glow would feel more premium.
- **Dashboard greeting has no date or revenue context** — "Hey, Name 👋" with four zero-state stats on first login feels like a blank form. Consider a first-time onboarding nudge card.
- **Product detail modal `pr-10` on title**: Long product names with close button overlapping — add `pr-10` to the title `<h2>` in the product modal.

**Low priority**
- Subscription tier cards lack visual differentiation — a "Most popular" badge on the middle tier would drive more conversions.
- Footer on homepage has only 3 links — add Privacy / Terms before launch.
- ProductCard emoji placeholder (👕, 📦) when no image — should be a branded gradient placeholder using `brandColor`.

---

## Pass: 2026-07-08 · Score before: ~7/10 → after: ~7.5/10

### What Was Fixed

#### 1. Cart button `absolute`+`relative` conflict — broken positioning on storefront (`storefront-client.tsx`)
The cart button in the banner had both `absolute` and `relative` in its class list: `className="absolute top-4 right-4 ... relative"`. In Tailwind v4's CSS cascade, both emit `position:` rules with identical specificity; `relative` is registered after `absolute` in the generated stylesheet, so it wins. The button was rendered `position: relative` — it appeared in document flow after the back button rather than anchored to the top-right corner of the banner. Fixed by removing `relative` (the `absolute` value alone creates a positioning context for the badge child). Also bumped from `w-10 h-10` to `w-11 h-11` (44px — proper minimum tap target).

#### 2. Kebab dropdown clipped by `overflow-hidden` on product rows (`products-client.tsx`)
The product list item row had `overflow-hidden` on the flex container. The kebab dropdown uses `absolute right-0 top-full` to render below its trigger, but `overflow-hidden` on the ancestor clipped it. Removed `overflow-hidden` from the row. There is no content that requires clipping — truncation is already handled via `truncate` on the title element. Kebab menus on mobile now open correctly.

#### 3. Event "Register" button tap target — flagged 3 passes in a row (`storefront-client.tsx`)
The event register button was `text-xs py-1.5 px-3 rounded-lg` (~28px tap height, well below 44px minimum). Changed to `h-9 px-3 rounded-xl flex items-center justify-center` (36px — acceptable for a secondary action in a compact list row). Also renamed "Register free" to "Free RSVP" — shorter text fits better in the right-aligned slot.

#### 4. Product title `max-w-[120px]` constraint removed (`products-client.tsx`)
The title `<p>` had `max-w-[120px] sm:max-w-none` — a workaround from before the kebab menu was implemented. Now that the fixed-width desktop buttons (Edit, Delete) are hidden on mobile and replaced by the kebab, the flex-1 title container has sufficient space without an artificial cap. The existing `truncate` class handles overflow cleanly. Removed `max-w-[120px] sm:max-w-none`.

#### 5. Badge text `text-[9px]` below readability floor (`products-client.tsx`)
The product type badge used `text-[9px]` — 9px is below the usable minimum for uppercase tracking text, especially at low opacity. Changed to `text-[10px]` and nudged opacity from `text-white/35` to `text-white/40` for a small contrast improvement.

#### 6. Dashboard stat cards and quick action cards lack mobile press feedback (`dashboard/page.tsx`, `globals.css`)
Flagged twice in previous passes. Stat cards and quick action links had `transition-all` but no `active:` variant — pressing them on mobile gave zero visual response. Added `active:scale-[0.98] transition-transform` to stat cards and `active:scale-[0.97] active:opacity-80` to quick action links. Also added `.card-glass:active` to globals.css with a slight darkening, so any other `card-glass` element across the app picks up mobile press feedback without individual class-by-class fixes.

#### 7. Nav sidebar always shows initials, ignores `avatar_url` (`nav.tsx`)
The Creator type includes `avatar_url?: string` but the sidebar avatar always rendered the first initial of `display_name`. Added the same `avatar_url ? <img> : initial` pattern used consistently in the storefront. Added `overflow-hidden` to the container so the image is cropped to the `rounded-xl` shape correctly.

---

### What Still Needs Work (Next Pass)

**High priority**
- **Storefront CTA row (Book + AI Chat + Tip)**: With all three enabled, the `flex-wrap` row tries to fit `min-w-[90px] + min-w-[100px] + min-w-[140px]` = 330px into ~311px at 375px — wraps awkwardly. Needs explicit column count logic or a re-layout when tip is enabled.
- **ProductCard "Add" button**: Still `h-10 px-3` = 40px. Needs `h-11` or proper touch-target treatment.
- **Storefront subscription tier CTA button text**: "Subscribe — $X/mo" at wider prices (e.g. "$249/mo") can overflow the button on narrow screens. Either truncate the price or use a shorter label.

**Medium priority**
- **Storefront product modal body text contrast**: Description uses `text-white/60` which passes WCAG AA at ~4.1:1 against `#111`, but only barely. Consider bumping to `text-white/70` for first-render readability.
- **Empty state on AI chat tab when `ai_chat_enabled` is false**: No tab is shown, so this state can't be reached — but if a creator disables AI mid-session, the UI has no graceful fallback.
- **Sidebar nav section labels** (`text-white/20`) fail WCAG AA at ~1.4:1. These are decorative section headers but still legible text. Consider `text-white/30`.
- **Landing page hero `leading-[0.9]` on mobile**: 48px × 0.9 = 43px line height on a 2-line h1 is very tight. Consider `leading-[0.95] md:leading-[0.9]`.
- **Dashboard greeting lacks date context**: The "Hey, {name} 👋" header could show today's date or a quick KPI summary line ("↑ 3 sales this week") to make the dashboard feel live rather than static.

**Low priority**
- Sidebar "Products" and "Digital" are separate items under Monetize but both route to `/dashboard/products` — confusing. Remove or re-route the "Digital" nav item.
- Storefront acquisition bar uses `border-t` — a gradient-border card treatment would look more premium.
- Footer on homepage has only 3 links — add Privacy / Terms before launch.

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
