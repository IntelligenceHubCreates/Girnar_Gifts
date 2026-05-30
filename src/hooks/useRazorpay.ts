// hooks/useRazorpay.ts
// Dynamically loads Razorpay script and exposes openCheckout()

import { useCallback } from 'react';

interface RazorpayOptions {
  key:          string;
  amount:       number;
  currency:     string;
  order_id:     string;
  name:         string;
  description:  string;
  prefill: {
    name:  string;
    email: string;
    contact: string;
  };
  theme:         { color: string };
  modal:         { backdropclose: boolean; escape: boolean };
  handler:       (response: RazorpaySuccessResponse) => void;
  ondismiss?:    () => void;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script    = document.createElement('script');
    script.id       = 'razorpay-script';
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const openCheckout = useCallback(async (options: RazorpayOptions): Promise<void> => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

    return new Promise((resolve, reject) => {
      const rzp = new (window as any).Razorpay({
        ...options,
        handler: (response: RazorpaySuccessResponse) => {
          options.handler(response);
          resolve();
        },
        modal: {
          ...options.modal,
          ondismiss: () => {
            options.ondismiss?.();
            reject(new Error('Payment cancelled'));
          },
        },
      });
      rzp.open();
    });
  }, []);

  return { openCheckout };
}