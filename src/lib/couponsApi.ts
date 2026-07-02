// src/lib/couponsApi.ts
import { _get } from '@/shared/fetchwrapper';

export interface PublicCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order: number;
  expires_at: string | null;
}

export async function fetchPublicCoupons(signal?: AbortSignal): Promise<PublicCoupon[]> {
  const res: any = await _get('/api/admin/coupons/public', { signal });
  return Array.isArray(res) ? res : (res?.data ?? []);
}