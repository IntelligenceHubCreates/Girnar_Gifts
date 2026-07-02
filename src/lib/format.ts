// lib/format.ts
// Shared formatting utilities for the admin panel.
// Extracted from per-page duplicates (Dashboard / Orders / OtherPages).
// Other pages are intentionally left untouched this phase to limit scope;
// this is the shared home they can migrate to later.

/** Indian-numbering currency, compacted for large values (₹1.2L / ₹3.4K / ₹950). */
export function fmtMoney(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`
  return `₹${v.toLocaleString('en-IN')}`
}

/** Full rupee value with Indian grouping, no compaction (₹1,24,500). */
export function fmtMoneyFull(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return `₹${v.toLocaleString('en-IN')}`
}

/** dd Mon yyyy. Returns "—" for empty/invalid input. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Integer with Indian grouping. */
export function fmtCount(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return v.toLocaleString('en-IN')
}