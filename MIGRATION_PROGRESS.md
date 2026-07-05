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

## Phase 6 — SEO & Legal
- `app/sitemap.ts` (static + legal pages + dynamic product URLs from the API) and `app/robots.ts` (disallow `/admin` `/api`, brand-driven sitemap/host) added.
- Privacy/Terms/Refund/Shipping policy pages added via a shared `components/legal/LegalPageLayout`, brand-driven, placeholder text flagged for lawyer review.
- `app/layout.tsx` metadata (metadataBase/title-template/OpenGraph/favicon) was already done in Phase 3.
- **Fixed a pre-existing production-build blocker** (unrelated to rebrand, found while verifying `npm run build` passes per the DoD): `/track-order` used `useSearchParams()` without a Suspense boundary, which Next.js's static export rejects. Wrapped in `<Suspense>`.
- **Found `.next/` build output already committed to git history** (829 files changed by a single fresh build). Added `.next/` to `.gitignore` going forward; left the already-tracked files alone rather than remove 1272 tracked files unprompted — see `MANUAL_STEPS.md` §11 for the one-line follow-up.

## Phase 7-8 — Payment/notifications, Cloudinary
- No frontend changes needed. Razorpay `key_id` is sourced from the backend's create-order response, not a separate hardcoded frontend constant — nothing to rewire. Cloudinary folder rebrand is backend-only.

## Phase 9 — .env.example
- **Found and fixed a real secret committed to git**: `.env.example` had Little Loot's actual Razorpay test `key_id` + `key_secret` hardcoded in plain text instead of placeholders. Replaced with a placeholder `NEXT_PUBLIC_RAZORPAY_KEY_ID` (the secret itself is backend-only and was never needed here). Also added the missing `NEXT_PUBLIC_SITE_NAME`/`NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_BASE` vars.
