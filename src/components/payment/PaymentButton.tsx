// components/payment/PaymentButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRazorpay, RazorpaySuccessResponse } from '@/hooks/useRazorpay';
import styles from './PaymentButton.module.css';
import { brand } from '@/config/brand';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

// FIX: added color, color_hex, image so they reach POST /api/payments/create-order
// which forwards cart_items to POST /api/orders → services.create_order → OrderItem.color
interface CartItem {
  product_id: string;
  name:       string;
  price:      number;
  quantity:   number;
  color?:     string | null;     // selected color variant name e.g. "Blue"
  color_hex?: string | null;     // selected color hex e.g. "#5ca3ff"
  image?:     string | null;     // color-specific image URL
}

interface ShippingAddress {
  fullName:      string;
  phone:         string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  pincode:       string;
  addressId?:    string;
}

interface Props {
  amount:          number;
  cartItems:       CartItem[];
  shippingAddress: ShippingAddress;
  userEmail:       string;
  couponCode?:     string | null;
  giftMessage?:    string | null;
  disabled?:       boolean;
  onSuccess?:      (paymentId: string, orderId: string) => void;
  onFailure?:      (error: string) => void;
}

export default function PaymentButton({
  amount, cartItems, shippingAddress, userEmail,   couponCode = null,
  giftMessage = null,
  disabled = false, onSuccess, onFailure,
}: Props) {
  const [loading, setLoading] = useState<'idle' | 'creating' | 'processing' | 'verifying'>('idle');
  const { openCheckout } = useRazorpay();
  const router = useRouter();

  async function handlePayment() {
    if (disabled || loading !== 'idle') return;
    setLoading('creating');

    // Read coupon code + gift message persisted by the cart (code only — server recomputes money)
    let couponCode: string | null = null;
    let giftMessage: string | null = null;
    try {
      const raw = localStorage.getItem('appliedCoupon');
      couponCode = raw ? (JSON.parse(raw)?.code ?? null) : null;
    } catch {}
    try { giftMessage = localStorage.getItem('girnar_gift_message') || null; } catch {}


    try {
      // Step 1 — Create Razorpay order
      // cart_items now includes color/color_hex/image so the backend
      // can persist them on OrderItem via services.create_order
      const orderRes = await fetch(`${BACKEND}/api/payments/create-order`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount:           Math.round(amount),
          cart_items:       cartItems,      // color fields now included
          shipping_address: shippingAddress,
          coupon_code:      couponCode,     // ← NEW
          gift_message:     giftMessage,    // ← NEW
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.detail || 'Failed to create order');
      }

      const { razorpay_order_id, amount: amountPaise, currency, key_id } = await orderRes.json();
      setLoading('processing');

      // Step 2 — Open Razorpay modal
      await openCheckout({
        key:         key_id,
        amount:      amountPaise,
        currency,
        order_id:    razorpay_order_id,
        name:        brand.name,
        description: `Order for ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`,
        prefill: {
          name:    shippingAddress.fullName,
          email:   userEmail,
          contact: shippingAddress.phone,
        },
        theme:  { color: '#7A1E33' },
        modal:  { backdropclose: false, escape: false },

        handler: async (response: RazorpaySuccessResponse) => {
          setLoading('verifying');
          try {
            // Step 3 — Verify signature
            const verifyRes = await fetch(`${BACKEND}/api/payments/verify`, {
              method:      'POST',
              headers:     { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });

            const result = await verifyRes.json();

            if (verifyRes.ok && result.success) {
              onSuccess?.(result.payment_id, result.order_id);
              router.push(
                `/order-confirmation?payment_id=${result.payment_id}&razorpay_order_id=${response.razorpay_order_id}`
              );
            } else {
              throw new Error(result.detail || 'Payment verification failed');
            }
          } catch (err: any) {
            onFailure?.(err.message);
          } finally {
            setLoading('idle');
          }
        },

        ondismiss: () => {
          setLoading('idle');
          onFailure?.('Payment cancelled');
        },
      });
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        onFailure?.(err.message || 'Something went wrong');
      }
      setLoading('idle');
    }
  }

  const isLoading = loading !== 'idle';
  const label = {
    idle:       `🔒 Pay ₹${amount.toLocaleString('en-IN')}`,
    creating:   'Creating order…',
    processing: 'Opening payment…',
    verifying:  'Verifying payment…',
  }[loading];

  return (
    <button
      className={`${styles.btn} ${isLoading ? styles.btnLoading : ''} ${disabled ? styles.btnDisabled : ''}`}
      onClick={handlePayment}
      disabled={disabled || isLoading}
      type="button"
    >
      {isLoading && <span className={styles.spinner} />}
      {label}
    </button>
  );
}