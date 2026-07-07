# DESIGN_SYSTEM.md — Girnar Gifts Redesign

**Status: sitewide rollout complete.** Branch `feat/girnar-redesign`, every surface committed individually (global shell → home → PLP → PDP → cart → checkout → auth/account/wishlist → static/legal/404 → motion system → admin → a11y/performance pass). See `MIGRATION_PROGRESS.md` for the running phase-by-phase log and git log on `feat/girnar-redesign` for the full commit history.

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

**Revision history:** the hero has gone through two redesigns since the original Phase 0 checkpoint, both by explicit later direction:

1. First revision: the one-shot "gift reveal" SVG animation was replaced with a rotating product showcase (color blobs, script watermark, products auto-cycling in the visual, clickable mini cards).
2. **Current version** (`feat/girnar-hero` branch, off a formal written brief referencing a specific competitor hero layout): the rotating/auto-advancing carousel was dropped in favor of a **static hero composition** matching the brief's exact structure — one fixed "signature gift" image (not cycling) plus 3 independent mini product cards, with a cursor-follow parallax on the hero image as the interactive "delight" instead of auto-rotation. Girnar's own locked wine/rose/blush palette is used throughout, not the reference's colors.

**Current layout:**
- **Headline column**: Cinzel headline ("The Art of / Thoughtful Gifting") → Manrope subhead → wine-filled pill CTA ("Shop Gifts") + wine-outlined pill CTA ("Explore Collections") → 3 mini product cards (real data, `/api/product/all?limit=4&in_stock=true` — item 1 is reserved for the big hero image, items 2-4 populate the cards so nothing repeats). Each mini card has a real, working **Add to Cart** wired to the existing `useCart().addItem()` — same guardrail-safe reuse pattern as `FeaturedProducts.tsx`, no new cart logic invented. The card's product image "pops" above the card via absolute positioning, per the brief's spec.
- **Visual column**: an organic (non-circular) blob shape (`border-radius: 42% 58% 63% 37% / 45% 42% 58% 55%`, `--gg-blush-deep`) bleeding off the top-right, a plain circle (`--gg-muted-fill`) lower down, a small restrained decorative bleed circle bottom-left (`--gg-petal` at low opacity — the brief's "optional" element, kept deliberately subtle), a rotated white script watermark ("wrapped with love"), and the tilted hero product image on top, bleeding off the bottom-right edge.
- **Typeface decision**: the brief's own spec called for a bold geometric sans (Poppins) headline, which would have clashed with the Cinzel serif locked in across every other page. Flagged to the user per the brief's own "Style note," and resolved as: **keep Cinzel for this hero's H1 too, use Poppins nowhere** — the rest of the hero's playful-warm composition (blob, script, pill buttons, mini cards) still follows the brief exactly; only the headline typeface differs from the brief's literal spec, by design.
- **Navigation**: the brief's reference mockup bakes a minimal transparent nav into the hero image itself. Not duplicated — Girnar's real header (topbar, full category mega-nav, search, wishlist, cart) already renders above every page including this one; forking a second, different nav just for the hero would violate "reuse existing nav, don't fork" more than it would help visual fidelity.
- **No fabricated photography**: the hero image and any mini card without an uploaded photo fall back to a flat illustrated gift-hamper glyph (inline SVG, three palette variants) rather than inventing or stand-in-claiming real product photography — see `MANUAL_STEPS.md` §12 for what to upload to get the full effect.
- **Motion** (all `transform`/`opacity` only, zero CLS): on-load stagger (headline → subhead → CTAs → mini cards), ambient looped drift on the blob (`translateY`) and gentle sway on the script + hero image tilt, and a spring-smoothed cursor-follow parallax on the hero image (desktop pointer only — `e.pointerType === 'mouse'` gates it off touch). Everything ambient/parallax is skipped under `prefers-reduced-motion`, degrading to the settled final state with no looping.

The now-superseded rotating-showcase code (AnimatePresence cross-fade/flip on a timer) was fully replaced, not left dead, since the hero can only show one visual treatment at a time.

Verified: typechecks clean, production build succeeds. Visual verification used a real (non-headless-flag) Chromium session via `puppeteer-core` with an actual multi-second wall-clock wait before capture — an earlier attempt using Chrome's `--virtual-time-budget` flag produced misleadingly "broken-looking" screenshots (buttons at partial opacity, or missing entirely) that turned out to be a virtual-time/`requestAnimationFrame` timing artifact of that flag, not a real rendering bug; the puppeteer-based capture confirmed the actual page renders correctly at both desktop and mobile widths.

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

**The signature element** (superseded — see §5's "Revision" note): originally the one-shot **gift-reveal hero**. Per explicit later direction, the hero's visual was rebuilt around a rotating real-product showcase (color-blob backdrop, script watermark, auto-advancing product image) instead — see §5 for the current design and the reasoning. Everything else on the page still stays quiet by comparison, per the brief's "boldness spent in one place" rule; the showcase is still the one place bold/animated attention is spent.

---

## 7. Rollout log (Phase 0 checkpoint → completion)

Every surface was restyled and committed individually on `feat/girnar-redesign`:

1. Phase 0 checkpoint — divergence matrix, token system, signature hero.
2. Token system rollout — `globals.css`'s legacy `--ll-*`/`--h-*`/`--coral`/`--navy`/etc. variable **names** were repointed to resolve to the new `--gg-*` palette (values changed, names kept stable), so every not-yet-individually-migrated component inherited the new identity immediately instead of waiting for a file-by-file pass.
3. Global shell — Header (real Girnar category taxonomy replacing Little Loot's kids/stationery nav), Footer, MobileBottomNav.
4. Homepage — all 9 sections token-migrated; two new sections built (`EditorialStory`, `InstagramSection`) to fill gaps left by removing Little Loot's kids-specific `PromoGrid`/`StationerySpotlight`/`BlogSection`.
5. PLP (`CategoryPage`), PDP (`ProductPage` — including trust-strip/cert-chip copy fixes and a live "Are the products safe for kids?"-style FAQ removed from Account page later).
6. Cart, Checkout.
7. Auth (Login/Signup), Account, Wishlist.
8. Static/legal pages, a new branded `not-found.tsx` (404) and `global-error.tsx` (root error boundary) — neither existed before, the app fell back to Next.js defaults.
9. Motion system utilities (§2 of the brief) — `MotionConfig reducedMotion="user"` wraps the whole app so every framer-motion animation respects the OS reduced-motion setting automatically; `lib/motion.ts` centralizes the entrance/scroll-reveal variants (`fadeUp`, `fadeIn`, `scaleIn`) using the same duration/easing tokens as the CSS system; a generic `<Reveal>` wrapper applies the treatment without touching a section's internals.
10. Admin panel — `styles/admin.css`'s brand-token `:root` block repointed the same way `globals.css` was, plus the remaining inline hex in `OrderReceipt`/`OrdersPage`/`ProductsPage`.
11. A11y + performance pass — see §9 below.

A project-wide grep swept for every previously-found old-brand hex pattern after each surface, which repeatedly turned up stragglers a per-file pass had missed (a page-level background gradient in `HomePage.module.css`, inline hex in `style=` props across `Header`/`FeaturedProducts`/`ProductPage`/mobile-account components, and old-brand colors expressed as decimal `rgba()` rather than hex). Each was fixed as found; see the git log for the itemized breakdown per commit.

## 8. Open items for `MANUAL_STEPS.md`

- If pixel-exact match to the logo's inscribed serif wordmark is wanted, identifying/licensing that exact typeface (vs. Cinzel, its close free kin) is a manual step.
- The signature hero currently uses an original vector gift-box illustration, not real product photography — real photography can complement or eventually replace it once available.
- PDP personalisation/engraving input (backend field exists, no frontend UI yet — see §"Flagged for MANUAL_STEPS.md" above).
- Instagram feed is an honest follow-CTA, not a live feed (needs Instagram API credentials).

## 9. A11y + performance pass

Ran Lighthouse (mobile, simulated throttling) against a local production build (`npm run build && npm run start`) for the homepage, cart, checkout, login, and wishlist.

**Accessibility: every surface checked is now 100/100** (homepage started at 88/100). Real findings fixed, not just score-chased:
- Header search input's `aria-expanded`/`aria-haspopup` weren't valid on its implicit role — made it a proper ARIA combobox (`role="combobox"` + `aria-controls` + `aria-autocomplete`).
- WhatsAppButton's tooltip text was nested inside the same link as its aria-label (a content/label mismatch, and invalid nested-interactive HTML) — moved the tooltip to a sibling of the link.
- LoginPage's Google button had an aria-label that didn't match its own visible text — removed the redundant label.
- CategoriesSection's carousel dots and the Login/Signup password-visibility toggle were under the 24×24px touch-target minimum — hit areas enlarged without changing the visual design.
- `--gg-muted` and the three semantic status colors (success/warning/error) only reached ~2.6–4.1:1 contrast on light backgrounds, short of AA's 4.5:1 for text. Darkened `--gg-muted` slightly and added `--gg-success-text`/`--gg-warning-text`/`--gg-error-text` variants for text-on-light-background use (the base tokens are still correct for badges/borders/dots).
- Found and fixed a **pre-existing invisible-text bug** (not introduced by this redesign): several success/warning/error badges and buttons across PDP, Cart, and Login/Signup had `background` and `color` set to the *literal same token* — 1:1 contrast, completely unreadable. Fixed each to either white-on-solid (buttons) or dark-text-on-light-tint (inline badges).

**Performance: homepage sits at 87–89/100** (mobile, simulated throttling), just under the 90 budget; cart/checkout/login/wishlist all score 95–97. CLS is a clean 0 everywhere. The homepage gap traces almost entirely to Largest Contentful Paint (~3.5s) driven by ~450ms of render-blocking CSS parse cost under Lighthouse's simulated mobile network+CPU throttle — this is being measured against a bare `next start` on localhost with no CDN, no HTTP/2 multiplexing, and no edge compression in front of it. A real production deploy (Vercel or similar, with a CDN and HTTP/2) would very likely close most or all of this gap on its own; restructuring the CSS bundling/splitting to chase it locally would mean touching Next.js build configuration, which is outside a presentation-layer redesign's guardrails. Recommend re-measuring against the actual production deployment before investing further here.

Also worth noting: `errors-in-console` (a `best-practices` audit) flags three network 500s on every page — these come from local API routes failing because no backend/`NEXT_PUBLIC_API_URL` is configured in this local test environment, not from anything introduced by the redesign.
