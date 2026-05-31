# Design Notes — Wednesday Audit Pass

**Date:** 2026-05-31  
**Rating before:** 4/10 → **Target:** 8/10  
**This pass:** ~5.5/10 (foundational fixes)

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
