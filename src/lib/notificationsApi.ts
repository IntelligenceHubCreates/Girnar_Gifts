// lib/notificationsApi.ts
'use client';

/**
 * Customer notifications API (Phase 14, Stage 6).
 * AUTH: storefront convention — session.backendToken as Bearer (NOT accessToken,
 * which is the admin side). Mirrors returnsApi.ts.
 * Backend: app/notifications/routers.py (Stage 2a).
 */
function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ServerNotification {
  id: string;
  type: string;            // 'order' | 'shipping' | 'return' | 'offer' | 'system'
  title: string;
  body: string | null;
  link: string | null;
  meta: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: ServerNotification[];
  unread_count: number;
}

export async function fetchMyNotifications(token?: string | null, opts?: { limit?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> {
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set('limit', String(opts.limit));
  if (opts?.unreadOnly) qs.set('unread_only', 'true');
  const res = await fetch(`/api/notifications/my?${qs}`, {
    headers: authHeaders(token), cache: 'no-store', credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { data: Array.isArray(data?.data) ? data.data : [], unread_count: Number(data?.unread_count || 0) };
}

export async function markNotificationRead(id: string, token?: string | null): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, credentials: 'include',
  }).catch(() => {});
}

export async function markAllNotificationsRead(token?: string | null): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, credentials: 'include',
  }).catch(() => {});
}

/* Map a server notification type → an emoji + color for the bell UI. */
export const NOTIF_TYPE_STYLE: Record<string, { icon: string; color: string }> = {
  shipping: { icon: '🚚', color: '#3b82f6' },
  order:    { icon: '📦', color: '#FF6B35' },
  return:   { icon: '🔄', color: '#a855f7' },
  offer:    { icon: '🎁', color: '#f59e0b' },
  system:   { icon: '🔔', color: '#6b7280' },
};