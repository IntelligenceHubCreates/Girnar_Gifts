// lib/returnsApi.ts
'use client';

/**
 * returnsApi.ts — customer-side Return & Damaged Product API (Phase 13, Stage 4).
 *
 * AUTH: this storefront keeps the backend JWT on the NextAuth session as
 * `backendToken` (NOT `accessToken`, which is the admin-panel convention).
 * AccountPage passes that token in; we send it as a Bearer header AND include
 * cookies, matching the rest of the storefront's fetch calls.
 *
 * Backend contract (app/returns/routers.py, Stage 3b):
 *   POST /api/returns                create
 *   GET  /api/returns/my             list (summaries)
 *   GET  /api/returns/my/{id}        detail (items, proofs, timeline, refund, replacement)
 *   POST /api/returns/{id}/cancel    cancel (requested / under_review only)
 *   POST /api/returns/{id}/proof     multipart image/video upload (Cloudinary)
 */

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function jsonHeaders(token?: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders(token) };
}

async function readError(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const j = JSON.parse(body);
    const d = j?.detail ?? j?.message;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x: any) => x?.msg).filter(Boolean).join(', ') || body;
    if (d) return JSON.stringify(d);
  } catch { /* not json */ }
  return body || res.statusText || `HTTP ${res.status}`;
}

/* ── Value sets (must match backend enums exactly) ── */
export type ReturnReason = 'damaged' | 'wrong_item' | 'missing_item' | 'defective' | 'variant_issue' | 'other';
export type RequestType  = 'refund' | 'replacement' | 'store_credit';

/* ── Shapes ── */
export interface ReturnSummary {
  id: string; order_id: string; order_number: string;
  status: string; request_type: string; reason: string;
  customer_name?: string; customer_email?: string;
  item_count: number; total_units: number;
  total_refund_amount: number | null; created_at: string;
}

export interface ReturnDetailItem {
  id: string; order_item_id: string; product_id: string;
  quantity: number; item_price: number;
  condition_status: string; restock_quantity: number; is_resellable: boolean;
  product_name?: string; product_image?: string | null; current_stock?: number;
}
export interface ReturnProof { id: string; file_url: string; file_type: string; created_at: string }
export interface ReturnHistory { id: string; old_status: string | null; new_status: string; note: string | null; created_at: string }
export interface ReturnRefund { id: string; amount: number; method: string; status: string; transaction_reference: string | null; processed_at: string | null }
export interface ReturnReplacement { id: string; product_id: string; quantity: number; status: string; tracking_number: string | null; dispatched_at: string | null; delivered_at: string | null }

export interface ReturnDetail {
  id: string; order_id: string; user_id: string;
  status: string; request_type: string; reason: string;
  description: string | null;
  total_refund_amount: number | null;
  admin_notes: string | null; rejection_reason: string | null;
  created_at: string; updated_at: string;
  items: ReturnDetailItem[];
  proofs: ReturnProof[];
  status_history: ReturnHistory[];
  refund: ReturnRefund | null;
  replacement: ReturnReplacement | null;
  order?: { id: string; order_number: string; status: string; total_amount: number; created_at: string; delivered_at: string | null; shipping_address: string };
  customer?: { id: string; name: string; email: string; phone: string };
}

export interface CreateReturnPayload {
  order_id: string;
  request_type: RequestType;
  reason: ReturnReason;
  description?: string;
  items: { order_item_id: string; quantity: number }[];
}

/* ── Calls ── */
export async function createReturn(payload: CreateReturnPayload, token?: string | null): Promise<ReturnDetail> {
  const res = await fetch('/api/returns', {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(payload), credentials: 'include',
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function uploadReturnProof(returnId: string, file: File, token?: string | null): Promise<ReturnDetail> {
  const fd = new FormData();
  fd.append('file', file); // do NOT set Content-Type — browser sets the multipart boundary
  const res = await fetch(`/api/returns/${returnId}/proof`, {
    method: 'POST', headers: authHeaders(token), body: fd, credentials: 'include',
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchMyReturns(token?: string | null): Promise<ReturnSummary[]> {
  const res = await fetch('/api/returns/my', { headers: authHeaders(token), cache: 'no-store', credentials: 'include' });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function fetchMyReturn(returnId: string, token?: string | null): Promise<ReturnDetail> {
  const res = await fetch(`/api/returns/my/${returnId}`, { headers: authHeaders(token), cache: 'no-store', credentials: 'include' });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function cancelReturn(returnId: string, token?: string | null): Promise<ReturnDetail> {
  const res = await fetch(`/api/returns/${returnId}/cancel`, {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({}), credentials: 'include',
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/* ── Display maps (single source of truth — shared with ReturnModal + AccountPage) ── */
export const RETURN_STATUS_LABEL: Record<string, string> = {
  requested: 'Requested', under_review: 'Under Review', approved: 'Approved',
  rejected: 'Rejected', pickup_scheduled: 'Pickup Scheduled', picked_up: 'Picked Up',
  received: 'Received', replacement_dispatched: 'Replacement Sent', refunded: 'Refunded',
  completed: 'Completed', cancelled_by_customer: 'Cancelled',
};

export const RETURN_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  requested:              { bg: '#fffbeb', color: '#b45309' },
  under_review:           { bg: '#eff6ff', color: '#1d4ed8' },
  approved:               { bg: '#eef2ff', color: '#4338ca' },
  rejected:               { bg: '#fef2f2', color: '#b91c1c' },
  pickup_scheduled:       { bg: '#f0f9ff', color: '#0369a1' },
  picked_up:              { bg: '#f0f9ff', color: '#0369a1' },
  received:               { bg: '#f0fdfa', color: '#0f766e' },
  replacement_dispatched: { bg: '#ecfdf5', color: '#15803d' },
  refunded:               { bg: '#ecfdf5', color: '#15803d' },
  completed:              { bg: '#ecfdf5', color: '#15803d' },
  cancelled_by_customer:  { bg: '#f3f4f6', color: '#4b5563' },
};

export const RETURN_REASON_LABEL: Record<string, string> = {
  damaged: 'Damaged', wrong_item: 'Wrong Item', missing_item: 'Missing Item',
  defective: 'Defective', variant_issue: 'Size/Variant', other: 'Other',
};

export const REQUEST_TYPE_LABEL: Record<string, string> = {
  refund: 'Refund', replacement: 'Replacement', store_credit: 'Store Credit',
};