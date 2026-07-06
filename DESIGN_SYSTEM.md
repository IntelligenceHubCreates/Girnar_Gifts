# DESIGN_SYSTEM.md — Girnar Gifts Redesign

**Status: Phase 0 checkpoint approved — sitewide rollout in progress.** Branch `feat/girnar-redesign`, committing per surface. See `MIGRATION_PROGRESS.md` for the running phase-by-phase log.

## Confirmed dead/unused code (found during rollout, left untouched)

These files are never imported anywhere live - restyling them would be wasted effort on unreachable code, so they were left as-is rather than force-fit into the new system:
- `components/layout/NavBar.tsx`, `components/layout/TopBar.tsx` — Header.tsx renders its own inline nav/topbar instead.
- `components/ui/ProductCard.tsx` — references the also-dead mock `Product` type/`PRODUCTS` array in `lib/data.ts`.
- `components/sections/PromoGrid.tsx`, `StationerySpotlight.tsx`, `BlogSection.tsx`, `BrandsSection.tsx` — Little Loot's kids/stationery-specific promo tiles, a stationery-category spotlight fetching a category slug Girnar doesn't have, fabricated blog-post mock content, and a toy-brands strip. Removed from the homepage composition rather than reskinned with invented Girnar content.
- `lib/data.ts`'s `PRODUCTS` and `BLOG_POSTS` mock arrays — imported nowhere.

## Flagged for `MANUAL_STEPS.md` (data-layer work, out of scope for a presentation-only redesign)

- **PDP personalisation/engraving input**: the backend already has a `personalisation_options` field on `Product` (added in the earlier white-label migration) but no frontend UI reads or collects it. The existing `gift_message` field IS wired end-to-end (CartPage → checkout → order), so the PDP was given a gift-wrap trust signal, but a proper per-product personalisation/engraving input on the PDP itself needs new state + API wiring, which this presentation-only pass doesn't do per guardrail #2.
- **Instagram feed**: `InstagramSection` is an honest follow-CTA, not a real feed - a live feed needs Instagram API credentials/integration.

---

## 1. Little Loot design inventory (what we are diverging from)

Audited from `src/styles/globals.css`, `Header.module.css`, `HeroSection.module.css`, `ProductCard.module.css`, and `HeroSection.tsx` (see full inventory in session notes; summarized here).

| Axis | Little Loot's current approach |
|---|---|
| **Palette** | Saturated rainbow, multi-hue: sun yellow `#FFD336`, coral `#FF6B5B`, mint `#3ECFB2`, sky `#5BBEF5`, lilac `#C7A4F5`, peach `#FFAD8A`, navy `#1A2540`. Reads as a toy-aisle palette — every hue competes for attention. |
| **Type pairing** | Baloo 2 (rounded, bubbly display face) + Nunito (rounded humanist body), with Syne and Orbitron also pulled in via a legacy CDN `@import` — playful, kid-friendly, geometric-quirky. |
| **Layout & rhythm** | Dense and pill-heavy. Search bars, nav chips, badges, and buttons are almost universally full `50px` radius. Hero is a two-column "mascot" layout with emoji floaters. |
| **Component silhouette** | Maximal pill radius (`50px`) on interactive elements, `24px` on cards, circular icon buttons, multi-layer bouncy drop-shadows (`shadow-pop`, `shadow-hover`). |
| **Imagery treatment** | A cartoon mascot character (`boy.png`) in the hero, emoji "floaters" (🚗🧩🚀🧺🍱) as decoration, soft blob shapes. |
| **Motion signature** | Continuous CSS-keyframe float/pulse loops that never stop (`h-float`, `h-pulse`, `floatSpin1-4`) — a toy that's always bouncing — plus spring-based scale pop on hover (`whileHover:{scale:1.04}`). |

**Confirmed:** framer-motion `^12.38.0` is the only animation library installed, currently used in exactly two files (`HeroSection.tsx`, `CategoriesSection.tsx`). Styling is CSS Modules + one global stylesheet — no Tailwind/shadcn.

---

## 2. Divergence Matrix

| Axis | Little Loot | **Girnar Gifts (new)** |
|---|---|---|
| **Palette** | Rainbow, multi-hue, saturated (7+ competing brand hues) | Restrained duotone — `wine` `#7A1E33` primary + `rose` `#E84C88` accent, with tonal `blush`/`petal` support and a warm near-white canvas. One dominant hue family, not a rainbow. |
| **Type pairing** | Baloo 2 (rounded/bubbly) + Nunito (rounded humanist) + incidental Syne/Orbitron | **Cinzel** (classical inscribed serif, kin to the logo wordmark) + **Manrope** (clean geometric/humanist sans). Considered and editorial, not rounded/playful. |
| **Layout & rhythm** | Dense, pill-heavy, cartoon-mascot hero | Generous whitespace, editorial grid, deliberate asymmetry in marketing sections; strict alignment/density retained only in commerce-critical surfaces (PDP buy-box, cart, checkout). |
| **Component silhouette** | Maximal `50px` pill radius on nearly everything, `24px` cards, bouncy multi-layer shadows | Refined radius scale (`8/12/16/24px`), pill reserved for chips/badges only, elevation re-tuned to the wine hue instead of neutral gray. |
| **Imagery treatment** | Cartoon mascot + emoji floaters + blobs | Gift/ribbon motif illustration (the signature reveal), product-photography-forward — canvas deliberately kept near-white so real product photos read cleanly, not competing with a heavy tint. |
| **Motion signature** | Continuous bounce/float/pulse loops that never settle | **One** orchestrated "gift reveal" signature moment that runs once and settles; purposeful entrance/scroll-reveal choreography elsewhere; disciplined, quiet micro-interactions. Motion stops — it doesn't loop forever. |

**On the "both are pink" question:** Little Loot's actual brand hue is orange/rainbow, not pink — the pink currently live on the site is a placeholder accent from the earlier white-label migration (a name/identity fork), not Little Loot's real identity. Even so, per the brief's caution, Girnar's distinction is deliberately not resting on hue alone: it leans hardest on **wine as the dominant, near-black-adjacent primary** (not rose/pink as the lead color), the classical-serif/geometric-sans pairing, the editorial layout rhythm, and the single-settling motion signature — four axes where the two brands are unmistakably different regardless of any hue overlap.

---

## 3. Current Girnar surface audit

**Styling system:** CSS Modules + `src/styles/globals.css` (two legacy `:root` blocks: a named-color/`ll`-prefixed block and an `h`-prefixed hero block — both still rainbow/orange-turned-pink, not yet touched by this redesign). No Tailwind/shadcn.

**Motion libraries installed:** `framer-motion@^12.38.0` only.

**Full surface inventory to be restyled** (real file paths, later phases):

- **Global shell:** `components/layout/{Header,NavBar,TopBar,Footer,MobileBottomNav}.tsx`
- **Homepage sections:** `components/sections/{HeroSection,CategoriesSection,FeaturedProducts,StationerySpotlight,PromoGrid,ThreeColumnSection,BrandsSection,TrustBar,TestimonialsSection,BlogSection,NewsletterSection}.tsx`
- **Shared UI:** `components/ui/{ProductCard,MiniProductList,WhatsAppButton}.tsx`
- **Routes:** `/`, `/products`, `/product/[id]`, `/cart`, `/checkout`, `/account`, `/wishlist`, `/login`, `/signup`, `/track-order`, `/order-confirmation`, `/search`, `/sale`, `/admin`, `/privacy-policy`, `/terms`, `/refund-policy`, `/shipping-policy`
- **Category route pattern** (~50 near-duplicate files under `stationery/`, `bags/`, `beauty/`, `bottles/`, `toys/`, `gifts/`, `keychains/`) — held pending the category-taxonomy redesign already flagged in `MANUAL_STEPS.md` from the white-label migration; out of scope until that's resolved, noted here so it isn't silently skipped.
- **Admin:** `components/admin/{AdminShell,layout/*,pages/*,dashboard/*,analytics/*,orders/*,ui/*}.tsx` — lower priority per the brief, functionality-first.

---

## 4. Token system (locked palette → CSS custom properties)

New file: `src/styles/design-tokens.css`, imported in `app/layout.tsx` alongside (not yet replacing) the legacy `globals.css` tokens.

```css
/* excerpt — see src/styles/design-tokens.css for the full, canonical file */
:root {
  --gg-wine: #7A1E33;       --gg-wine-dark: #5F1526;
  --gg-rose: #E84C88;       --gg-rose-dark: #D13A75;
  --gg-petal: #F49FB3;      --gg-blush: #F6D7DE;      --gg-blush-deep: #F1C6CF;

  --gg-canvas: #FFFBFC;     --gg-surface: #FFFFFF;
  --gg-ink: #2A1218;        --gg-body: #5B474C;       --gg-muted: #8C767C;
  --gg-border: #F0E1E5;     --gg-muted-fill: #FAF1F3;

  --gg-success: #2F8F63;    --gg-warning: #D08A1E;    --gg-error: #DE3B3B;

  --gg-gradient-signature: linear-gradient(135deg, #F49FB3 0%, #E84C88 100%);

  --gg-primary: var(--gg-wine);   --gg-primary-hover: var(--gg-wine-dark);
  --gg-accent: var(--gg-rose);    --gg-accent-hover: var(--gg-rose-dark);
  --gg-background: var(--gg-canvas); --gg-card: var(--gg-surface); --gg-foreground: var(--gg-ink);

  --gg-text-display: clamp(2.75rem, 2rem + 3vw, 4.875rem);
  /* ...h1-h4, body, small, caption, overline — see file */

  --gg-font-display: var(--font-cinzel), 'Cinzel', Georgia, serif;
  --gg-font-body: var(--font-manrope), 'Manrope', system-ui, sans-serif;

  --gg-radius-sm: 8px; --gg-radius: 12px; --gg-radius-lg: 16px; --gg-radius-xl: 24px; --gg-radius-pill: 999px;

  --gg-shadow-card: 0 2px 6px rgba(122,30,51,0.05), 0 12px 32px rgba(122,30,51,0.08);
  --gg-shadow-hover: 0 4px 12px rgba(122,30,51,0.08), 0 20px 48px rgba(122,30,51,0.12);

  --gg-duration-fast: 150ms; --gg-duration-base: 250ms; --gg-duration-expressive: 400ms;
  --gg-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --gg-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --gg-duration-fast: 0ms; --gg-duration-base: 0ms; --gg-duration-expressive: 0ms; }
}
```

Every brand-on-neutral and text-on-fill pairing in the locked palette passes WCAG AA: `wine`-on-white (primary CTA) is high contrast; `rose` is reserved for badges/accents/large or bold text, never small body text on its own fill.

### Type specimen

- **Display / headings** — **Cinzel** (400/500/600/700), a classical inscribed serif kin to the logo wordmark. Used for `h1`-`h3` and the hero headline only — never body copy.
- **Body / UI** — **Manrope** (400/500/600/700/800), a clean geometric-humanist sans. Used for paragraphs, nav, buttons, forms, captions.
- Both loaded via `next/font/google` (self-hosted, zero CDN round-trip) — a performance improvement over the legacy setup's three separate Google Fonts CDN `@import`s.
- **Not reused from Little Loot**: confirms zero overlap with Baloo 2 / Nunito / Syne / Orbitron.
- If the client wants the headline to pixel-match the logo's exact wordmark typeface, identifying that exact face is a `MANUAL_STEPS.md` item — Cinzel is a close, real, freely-licensed kin, not a forced match.

---

## 5. Signature hero — rendered in real code

`src/components/sections/GirnarHeroSection.tsx` + `.module.css`, currently swapped into `src/app/page.tsx` in place of the old `HeroSection` (which is left untouched/unused for easy side-by-side comparison or revert — nothing was deleted).

**What it does:**
- Editorial asymmetric split: headline column (eyebrow → Cinzel display headline "Gifts worth *unwrapping*" → Manrope subhead → primary/secondary CTA → a quiet three-item trust list) opposite a **signature "gift reveal"**.
- The gift reveal is an SVG gift box (wine base, rose lid, blush ribbon, rose-dark bow) that lifts its lid open once on mount — `transform`/`opacity` only, choreographed with framer-motion — revealing a soft radial bloom in the signature gradient plus two petals drifting upward. It runs once and settles; it does not loop forever the way Little Loot's hero float/pulse does.
- Under `prefers-reduced-motion: reduce` (read via the new shared `usePrefersReducedMotion` hook), the lid renders already-open and the bloom/petals render static/omitted instead of animating — no motion is lost as *information*, only as *movement*.
- No fabricated photography: the gift box is an original vector illustration built from the locked palette, not a stand-in claiming to be final photography (flagged in `MANUAL_STEPS.md` that real product photography should eventually feature alongside/instead of it).

Verified: typechecks clean, production build succeeds, and the homepage was rendered on a local dev server and confirmed to output "Gifts worth" / "unwrapping" with zero references to the old mascot image and no console errors.

---

## 6. ASCII wireframe — homepage (target IA after full rollout)

```
┌──────────────────────────────────────────────────────────────────┐
│ Announcement bar (dismissible)                                   │
├──────────────────────────────────────────────────────────────────┤
│ Header: logo · nav (gift categories / shop-by-occasion / by-     │
│ recipient mega-menu) · search · wishlist+cart (counts) · account │
│ — scroll-shrink/elevate on scroll                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   HERO — signature "gift reveal"                                 │
│   [eyebrow]                              ┌──────────────┐        │
│   Gifts worth                            │  blush band  │        │
│   unwrapping.                            │   ┌──────┐   │        │
│   [subhead copy, ~50ch]                  │   │ 🎁box │   │        │
│   [Shop the collection] [Explore →]      │   └──────┘   │        │
│   · wrap · delivery · secure ·           └──────────────┘        │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│  SHOP BY OCCASION           ░░ tiles: birthday · anniversary ·    │
│                              festive · corporate · thank-you ░░  │
├──────────────────────────────────────────────────────────────────┤
│  SHOP BY RECIPIENT          ░░ tiles: for her · for him ·         │
│                              for parents · for kids · for team ░ │
├──────────────────────────────────────────────────────────────────┤
│  FEATURED / BESTSELLERS      [card][card][card][card] →scroll    │
├──────────────────────────────────────────────────────────────────┤
│  VALUE BAR   🎁 gift-wrap   🚚 pan-India   🔒 secure   ↩ easy    │
├──────────────────────────────────────────────────────────────────┤
│  EDITORIAL BRAND-STORY BLOCK  — asymmetric image + Cinzel pull-  │
│  quote, "the art of gifting" narrative                            │
├──────────────────────────────────────────────────────────────────┤
│  TESTIMONIALS / UGC           quote · quote · quote (carousel)   │
├──────────────────────────────────────────────────────────────────┤
│  NEWSLETTER      [email input] [Subscribe]                       │
├──────────────────────────────────────────────────────────────────┤
│  INSTAGRAM FEED   [img][img][img][img][img][img]                 │
├──────────────────────────────────────────────────────────────────┤
│  FOOTER — brand story line · occasion/category links · support · │
│  policies · social · newsletter · payment/trust badges           │
└──────────────────────────────────────────────────────────────────┘
[Mobile] sticky bottom nav: home · search · wishlist · cart · account
```

**The signature element** the brand will be remembered by: the **gift-reveal hero** — one orchestrated unwrap moment using the logo's own gradient, appearing exactly once per page load, never repeated as a gimmick elsewhere on the site. Everything else stays quiet by comparison, per the brief's "boldness spent in one place" rule.

---

## 7. What is NOT done yet (deliberately, pending this checkpoint)

- The legacy `--ll-*`/`--h-*` rainbow tokens in `globals.css` are untouched — `ProductCard`, `Header`, `Footer`, `NavBar`, `TopBar`, and every other component still render the old Little Loot silhouette. Only the hero has been swapped.
- No motion-system-wide rollout (scroll reveals, cart drawer, nav transitions) yet — that's §2 of the brief, after this checkpoint.
- No PLP/PDP/cart/checkout/auth/account/admin restyling yet — that's §3-8.
- No a11y/performance pass yet (though the new hero was built with AA-safe token pairings, `transform`/`opacity`-only motion, and a reduced-motion fallback from the start).

## 8. Open items for `MANUAL_STEPS.md`

- If pixel-exact match to the logo's inscribed serif wordmark is wanted, identifying/licensing that exact typeface (vs. Cinzel, its close free kin) is a manual step.
- The signature hero currently uses an original vector gift-box illustration, not real product photography — real photography can complement or eventually replace it once available.
