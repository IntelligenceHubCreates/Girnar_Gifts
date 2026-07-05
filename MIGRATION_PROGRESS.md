# Girnar Gifts Migration — Progress Log (Frontend)

See `MIGRATION_MAP.md` (workspace root, one level up) for the full Phase 0 discovery findings this migration is based on.

## Phase 0 — Discovery
- Completed. Findings in `../MIGRATION_MAP.md`.

## Phase 1 — Safety & Fork
- Tagged Little Loot's stable state as `v1.0-littleloot-stable` on the original `Little_Loot` repo, pushed as a restore point.
- Created local mirror backup: `../_backups/little-loot-backup.git`.
- Re-pointed `origin` to `https://github.com/IntelligenceHubCreates/Girnar_Gifts.git`, pushed `main` + tags.

## Phase 2 — Renaming
- `package.json`: `name` → `girnar-gifts` (version already `1.0.0`).
- App metadata (`app/layout.tsx` title/description) intentionally left as-is here — routed through the brand config in Phase 3 instead of hardcoding a new literal.

## Prerequisite fix — accessToken never populated
- `session.accessToken` was declared in the NextAuth types but never assigned by the `jwt()`/`session()` callbacks (only `backendToken` was) — meaning admin API clients (`adminApi.ts`, `adminShipmentsApi.ts`, `adminReturnsApi.ts`) that read `session.accessToken` always got `undefined` and sent no `Authorization` header. Pre-existing bug, unrelated to the rebrand; fixed at the user's request by also populating `accessToken` from the same backend-issued token used for `backendToken`.

## Phase 3 — Brand-config layer
- New `src/config/brand.ts` — single source of truth (name, contact, social, currency, asset paths). Placeholder SVG logo/favicon/OG-image added under `public/brand/`.
- Replaced every "Little Loot" literal (30 files) with `brand.*` references: Header, Footer, TopBar, WhatsAppButton, PaymentButton, OrderReceipt, admin Sidebar/Topbar, page `<title>`s (now composed via the root layout's title template), mock testimonial/product copy in `lib/data.ts`.
- Renamed old-brand-namespaced localStorage keys: `littleloot_cart_v1` → `girnar_cart_v1`, `littleloot_cart_guest_pending` → `girnar_cart_guest_pending`, `littleloot_gift_message` → `girnar_gift_message` (across `CartContext`, `CartPage`, `CheckoutPage`, `PaymentButton`).
- `app/layout.tsx` metadata now fully brand-driven (`metadataBase`, title template, OpenGraph, favicon) — this also satisfies Phase 6's metadata requirement, done here since it was the same edit.
- **Color palette**: discovered the site's orange accent (`#F47C20`/`#D96910`) was hardcoded directly in 11 stylesheets/components (Header, Footer, NavBar, Hero, Categories, FeaturedProducts, MiniProductList, AccountPage), not just the `--ll-accent`/`--h-orange` CSS variables. Per user's request for a pink palette, replaced all occurrences (hex + rgba forms) with `#EC4899`/`#BE185D`, and updated the placeholder brand assets to match.

## Phase 5 — Categories & Products
- Admin panel category dropdowns/CRUD are already fully DB-driven (`fetchCategories`, `adminApi.ts`) — no change needed.
- **Flagged, not changed** (per user decision — needs subcategory decisions first): the storefront nav (`Header.tsx` `NAV_ITEMS`, `NavBar.tsx`) and ~50 route files under `src/app/{stationery,bags,bottles,toys,beauty,keychains,gifts}/**` hardcode Little Loot's kids/stationery taxonomy as route structure, not just labels. See `MANUAL_STEPS.md` §1 for the full writeup and recommended approach (a single dynamic category/subcategory route instead of ~50 static files).
