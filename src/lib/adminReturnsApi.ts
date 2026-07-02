// lib/adminReturnsApi.ts
/**
 * Admin-side Return Management API (Phase 13, Stage 5).
 *
 * AUTH: admin panel convention — NextAuth getSession() → session.accessToken as
 * Bearer (matches lib/adminApi.ts), plus credentials:'include' cookie fallback.
 * This is DIFFERENT from the customer returnsApi.ts, which uses backendToken.
 *
 * Backend (app/returns/routers.py, Stage 3b — admin_returns_router):
 *   GET  /api/admin/returns                 list (+ skip/limit/status/reason/search/date_from/date_to)
 *   GET  /api/admin/returns/{id}            full detail
 *   PUT  /api/admin/returns/{id}/status     generic move (under_review|pickup_scheduled|picked_up|completed)
 *   PUT  /api/admin/returns/{id}/approve    {admin_notes?, note?}
 *   PUT  /api/admin/returns/{id}/reject     {rejection_reason, admin_notes?, note?}
 *   PUT  /api/admin/returns/{id}/receive    {items:[{return_item_id, condition_status, restock_quantity?}], note?}
 *   PUT  /api/admin/returns/{id}/refund     {amount?, method, status, transaction_reference?, note?}
 *   PUT  /api/admin/returns/{id}/replacement{product_id?, quantity?, tracking_number?, status, note?}
 *   PUT  /api/admin/returns/{id}/notes      {admin_notes}
 */
import { getSession } from 'next-auth/react'

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getSession()
  const token = (session as any)?.accessToken ?? ''
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message: string
    try {
      const j = JSON.parse(body)
      message = typeof j?.detail === 'object' ? JSON.stringify(j.detail) : (j?.detail ?? j?.message ?? body)
    } catch { message = body || res.statusText }
    throw new Error(`API ${res.status}: ${message}`)
  }
  if (res.status === 204) return {} as T
  return res.json()
}

/* ── Shapes (mirror the Stage-3a serializers) ── */
export interface AdminReturnSummary {
  id: string; order_id: string; order_number: string;
  status: string; request_type: string; reason: string;
  customer_name: string; customer_email: string;
  item_count: number; total_units: number;
  total_refund_amount: number | null; created_at: string;
}
export interface AdminReturnListResponse {
  data: AdminReturnSummary[]; totalCount: number; page: number; limit: number;
}
export interface AdminReturnItem {
  id: string; order_item_id: string; product_id: string;
  quantity: number; item_price: number;
  condition_status: string; restock_quantity: number; is_resellable: boolean;
  product_name?: string; product_image?: string | null; current_stock?: number;
}
export interface AdminReturnProof { id: string; file_url: string; file_type: string; created_at: string }
export interface AdminReturnHistory { id: string; old_status: string | null; new_status: string; note: string | null; created_at: string }
export interface AdminReturnRefund { id: string; amount: number; method: string; status: string; transaction_reference: string | null; processed_at: string | null }
export interface AdminReturnReplacement { id: string; product_id: string; quantity: number; status: string; tracking_number: string | null; dispatched_at: string | null; delivered_at: string | null }
export interface AdminReturnDetail {
  id: string; order_id: string; user_id: string;
  status: string; request_type: string; reason: string;
  description: string | null; total_refund_amount: number | null;
  admin_notes: string | null; rejection_reason: string | null;
  created_at: string; updated_at: string;
  items: AdminReturnItem[]; proofs: AdminReturnProof[];
  status_history: AdminReturnHistory[];
  refund: AdminReturnRefund | null; replacement: AdminReturnReplacement | null;
  order?: { id: string; order_number: string; status: string; total_amount: number; created_at: string; delivered_at: string | null; shipping_address: string; razorpay_payment_id?: string | null };
  customer?: { id: string; name: string; email: string; phone: string };
}

/* ── Calls ── */
export async function fetchAdminReturns(params: {
  skip?: number; limit?: number; status?: string; reason?: string;
  search?: string; dateFrom?: string; dateTo?: string;
} = {}): Promise<AdminReturnListResponse> {
  const qs = new URLSearchParams()
  if (params.skip !== undefined) qs.set('skip', String(params.skip))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.status) qs.set('status', params.status)
  if (params.reason) qs.set('reason', params.reason)
  if (params.search) qs.set('search', params.search)
  if (params.dateFrom) qs.set('date_from', params.dateFrom)
  if (params.dateTo) qs.set('date_to', params.dateTo)
  return adminFetch<AdminReturnListResponse>(`/api/admin/returns?${qs}`)
}

export async function fetchAdminReturn(id: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}`)
}
export async function setReturnStatus(id: string, status: string, note?: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) })
}
export async function approveReturn(id: string, admin_notes?: string, note?: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/approve`, { method: 'PUT', body: JSON.stringify({ admin_notes, note }) })
}
export async function rejectReturn(id: string, rejection_reason: string, admin_notes?: string, note?: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejection_reason, admin_notes, note }) })
}
export interface ReceiveItemPayload { return_item_id: string; condition_status: 'resellable' | 'damaged'; restock_quantity?: number }
export async function receiveReturn(id: string, items: ReceiveItemPayload[], note?: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/receive`, { method: 'PUT', body: JSON.stringify({ items, note }) })
}
export async function refundReturn(id: string, body: {
  amount?: number; method?: string; status?: string; transaction_reference?: string;
  note?: string; execute_gateway?: boolean; speed?: string;   // NEW
}): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/refund`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function replacementReturn(id: string, body: { product_id?: string; quantity?: number; tracking_number?: string; status?: string; note?: string }): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/replacement`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function setReturnNotes(id: string, admin_notes: string): Promise<AdminReturnDetail> {
  return adminFetch<AdminReturnDetail>(`/api/admin/returns/${id}/notes`, { method: 'PUT', body: JSON.stringify({ admin_notes }) })
}

/* ── Display maps (admin) ── */
export const RET_STATUS_LABEL: Record<string, string> = {
  requested: 'Requested', under_review: 'Under Review', approved: 'Approved',
  rejected: 'Rejected', pickup_scheduled: 'Pickup Scheduled', picked_up: 'Picked Up',
  received: 'Received', replacement_dispatched: 'Replacement Sent', refunded: 'Refunded',
  completed: 'Completed', cancelled_by_customer: 'Cancelled by Customer',
}
export const RET_STATUS_PILL: Record<string, string> = {
  requested: 'pill-yellow', under_review: 'pill-blue', approved: 'pill-purple',
  rejected: 'pill-red', pickup_scheduled: 'pill-blue', picked_up: 'pill-blue',
  received: 'pill-green', replacement_dispatched: 'pill-green', refunded: 'pill-green',
  completed: 'pill-green', cancelled_by_customer: 'pill-grey',
}
export const RET_REASON_LABEL: Record<string, string> = {
  damaged: 'Damaged', wrong_item: 'Wrong Item', missing_item: 'Missing Item',
  defective: 'Defective', variant_issue: 'Size/Variant', other: 'Other',
}
export const RET_TYPE_LABEL: Record<string, string> = {
  refund: 'Refund', replacement: 'Replacement', store_credit: 'Store Credit',
}

/* Which generic targets are reachable from a given status (mirrors backend
   TRANSITIONS, generic subset only — approve/reject/receive/refund/replacement
   are surfaced as their own buttons, not here). */
export const GENERIC_NEXT: Record<string, string[]> = {
  requested:        ['under_review'],
  under_review:     [],
  approved:         ['pickup_scheduled', 'picked_up'],
  pickup_scheduled: ['picked_up'],
  picked_up:        [],
  received:         ['completed'],
  replacement_dispatched: ['completed'],
  refunded:         ['completed'],
}