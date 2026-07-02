// lib/adminShipmentsApi.ts
/**
 * Admin Shipping API (Phase 14, Stage 4).
 * AUTH: NextAuth getSession() → session.accessToken as Bearer, identical to
 * lib/adminReturnsApi.ts. Self-contained adminFetch (no coupling to other api files).
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

/* multipart variant for label upload (no Content-Type — browser sets boundary) */
async function adminUpload<T>(path: string, form: FormData): Promise<T> {
  const session = await getSession()
  const token = (session as any)?.accessToken ?? ''
  const res = await fetch(path, {
    method: 'PUT', body: form, credentials: 'include',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    try { const j = JSON.parse(body); throw new Error(j?.detail ?? body) } catch { throw new Error(body || res.statusText) }
  }
  return res.json()
}

/* ── Shapes ── */
export interface ShipmentSummaryRow {
  id: string; order_id: string; order_number: string;
  status: string; is_prepaid: boolean;
  cod_amount: number | null; cod_collected: boolean; cod_remitted: boolean;
  courier_name: string | null; awb_number: string | null;
  ship_city: string | null; ship_state: string | null; ship_pincode: string | null;
  customer_name: string; customer_phone: string;
  item_count: number; created_at: string;
}
export interface ShipmentListResponse {
  data: ShipmentSummaryRow[]; totalCount: number; page: number; limit: number;
}
export interface ShipmentsSummary {
  by_status: Record<string, number>;
  pending_packing: number; ready_for_pickup: number; in_transit: number;
  out_for_delivery: number; delivered: number; failed: number; rto: number;
  exceptions: number; cod_remittance_pending: number; total: number;
}
export interface ShipmentItem {
  id: string; order_item_id: string; product_id: string; quantity: number;
  condition_status: string; restock_quantity: number; is_resellable: boolean;
  product_name?: string; product_image?: string | null; current_stock?: number;
}
export interface ShipmentAttempt {
  id: string; attempt_number: number; attempted_at: string | null; status: string;
  failure_reason: string | null; courier_remarks: string | null;
  next_attempt_at: string | null; customer_contacted: boolean; created_at: string;
}
export interface ShipmentHistory { id: string; old_status: string | null; new_status: string; note: string | null; created_at: string }
export interface ShipmentDetail {
  id: string; order_id: string; user_id: string | null;
  status: string; is_prepaid: boolean;
  cod_amount: number | null; cod_collected: boolean; cod_collected_at: string | null;
  cod_remitted: boolean; cod_remittance_reference: string | null; cod_remitted_at: string | null;
  courier_partner_id: string | null; courier_name: string | null; courier_service: string | null;
  awb_number: string | null; tracking_url: string | null;
  label_url: string | null; label_generated_at: string | null;
  shipping_cost: number | null;
  package_weight: number | null; package_length: number | null; package_width: number | null; package_height: number | null;
  ship_name: string | null; ship_phone: string | null; ship_line1: string | null;
  ship_city: string | null; ship_state: string | null; ship_pincode: string | null;
  expected_delivery_date: string | null; pickup_scheduled_at: string | null; pickup_attempts: number;
  packed_at: string | null; picked_up_at: string | null; delivered_at: string | null;
  rto_initiated_at: string | null; rto_received_at: string | null;
  admin_notes: string | null; created_at: string; updated_at: string;
  items: ShipmentItem[]; status_history: ShipmentHistory[]; attempts: ShipmentAttempt[];
  labels: { id: string; label_url: string; file_name: string | null; generated_by: string | null; created_at: string }[];
  order?: { id: string; order_number: string; status: string; total_amount: number; razorpay_payment_id: string | null; created_at: string; delivered_at: string | null };
  customer?: { id: string; name: string; email: string; phone: string };
}
export interface CourierPartner {
  id: string; name: string; service_type: string | null;
  is_active: boolean; supports_cod: boolean; tracking_url_template: string | null; created_at: string;
}

/* ── Reads ── */
export async function fetchShipmentsSummary(): Promise<ShipmentsSummary> {
  return adminFetch<ShipmentsSummary>('/api/admin/shipments/summary')
}
export async function fetchShipments(params: {
  skip?: number; limit?: number; status?: string; courier?: string; payment?: string;
  search?: string; city?: string; state?: string; pincode?: string;
  date_from?: string; date_to?: string; sort?: string;
} = {}): Promise<ShipmentListResponse> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return adminFetch<ShipmentListResponse>(`/api/admin/shipments?${qs}`)
}
export async function fetchShipment(id: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}`)
}

/* ── Lifecycle writes (used by Stage-5 modals; defined now so the client is complete) ── */
export async function createShipment(body: { order_id: string; items?: { order_item_id: string; quantity: number }[] }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>('/api/admin/shipments', { method: 'POST', body: JSON.stringify(body) })
}
export async function packShipment(id: string, body: { package_weight?: number; package_length?: number; package_width?: number; package_height?: number; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/pack`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function assignCourier(id: string, body: { courier_partner_id?: string; courier_name: string; courier_service?: string; awb_number: string; tracking_url?: string; shipping_cost?: number; expected_delivery_date?: string; override?: boolean; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/assign-courier`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function uploadLabel(id: string, file: File, note?: string): Promise<ShipmentDetail> {
  const fd = new FormData(); fd.append('file', file); if (note) fd.append('note', note)
  return adminUpload<ShipmentDetail>(`/api/admin/shipments/${id}/label-upload`, fd)
}
export async function schedulePickup(id: string, body: { pickup_scheduled_at?: string; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/pickup`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function pickupFailed(id: string, body: { reason?: string; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/pickup-failed`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function markPickedUp(id: string, note?: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/picked-up`, { method: 'PUT', body: JSON.stringify({ note }) })
}
export async function setShipmentStatus(id: string, status: string, note?: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) })
}
export async function recordDeliveryAttempt(id: string, body: { status: string; failure_reason?: string; courier_remarks?: string; next_attempt_at?: string; customer_contacted?: boolean; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/delivery-attempt`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function initiateRto(id: string, note?: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/rto`, { method: 'PUT', body: JSON.stringify({ note }) })
}
export async function receiveRto(id: string, items: { shipment_item_id: string; condition_status: string; restock_quantity?: number }[], note?: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/rto-receive`, { method: 'PUT', body: JSON.stringify({ items, note }) })
}
export async function updateCod(id: string, body: { action: 'collect' | 'remit'; reference?: string; note?: string }): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/cod`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function cancelShipment(id: string, note?: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ note }) })
}
export async function setShipmentNotes(id: string, admin_notes: string): Promise<ShipmentDetail> {
  return adminFetch<ShipmentDetail>(`/api/admin/shipments/${id}/notes`, { method: 'PUT', body: JSON.stringify({ admin_notes }) })
}

/* ── Couriers ── */
export async function fetchCouriers(): Promise<{ data: CourierPartner[] }> {
  return adminFetch<{ data: CourierPartner[] }>('/api/admin/couriers')
}
export async function createCourier(body: Partial<CourierPartner>): Promise<CourierPartner> {
  return adminFetch<CourierPartner>('/api/admin/couriers', { method: 'POST', body: JSON.stringify(body) })
}
export async function updateCourier(id: string, body: Partial<CourierPartner>): Promise<CourierPartner> {
  return adminFetch<CourierPartner>(`/api/admin/couriers/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

/* ── Display maps ── */
export const SHIP_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', ready_to_pack: 'Ready to Pack', packed: 'Packed',
  label_generated: 'Label Generated', pickup_scheduled: 'Pickup Scheduled', picked_up: 'Picked Up',
  in_transit: 'In Transit', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  delivery_failed: 'Delivery Failed', rto_initiated: 'RTO Initiated', returned_to_origin: 'Returned to Origin',
  lost: 'Lost', damaged_in_transit: 'Damaged in Transit', cancelled: 'Cancelled',
}
export const SHIP_STATUS_PILL: Record<string, string> = {
  pending: 'pill-grey', ready_to_pack: 'pill-yellow', packed: 'pill-yellow',
  label_generated: 'pill-blue', pickup_scheduled: 'pill-blue', picked_up: 'pill-blue',
  in_transit: 'pill-blue', out_for_delivery: 'pill-purple', delivered: 'pill-green',
  delivery_failed: 'pill-red', rto_initiated: 'pill-red', returned_to_origin: 'pill-grey',
  lost: 'pill-red', damaged_in_transit: 'pill-red', cancelled: 'pill-grey',
}
export const FAILURE_REASON_LABEL: Record<string, string> = {
  customer_unavailable: 'Customer unavailable', incorrect_address: 'Incorrect address',
  phone_not_reachable: 'Phone not reachable', customer_refused: 'Customer refused',
  cod_issue: 'COD issue', courier_delay: 'Courier delay', weather: 'Weather', other: 'Other',
}

export interface AwaitingOrderRow {
  order_id: string; order_number: string; status: string;
  total_amount: number; item_count: number; line_count: number;
  is_prepaid: boolean; customer_name: string; customer_phone: string; created_at: string;
}
export async function fetchAwaitingShipment(params: { skip?: number; limit?: number } = {}): Promise<{ data: AwaitingOrderRow[]; totalCount: number; page: number; limit: number }> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)) })
  return adminFetch(`/api/admin/shipments/awaiting?${qs}`)
}
export async function fetchShipmentsByOrders(orderIds: string[]): Promise<{ data: Record<string, { shipment_id: string; status: string }> }> {
  if (orderIds.length === 0) return { data: {} }
  return adminFetch(`/api/admin/shipments/by-orders?ids=${encodeURIComponent(orderIds.join(','))}`)
}