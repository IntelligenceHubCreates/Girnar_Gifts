// app/order-confirmation/OrderConfirmationClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './OrderConfirmation.module.css';
import { brand } from '@/config/brand';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

interface OrderItem {
  product_id: string;
  name:       string;
  price:      number;
  quantity:   number;
  image?:     string | null;
}

interface OrderData {
  id:                  string;
  status:              string;
  amount_paid:         number;
  payment_method:      string;
  razorpay_payment_id: string;
  shipping_name:       string;
  shipping_city:       string;
  items:               OrderItem[];
  created_at:          string;
  estimated_delivery:  string | null;
}

function getFirstImage(product_image: any): string | null {
  if (!product_image?.length) return null;
  const f = product_image[0];
  return typeof f === 'string' ? f : f?.url ?? null;
}

export default function OrderConfirmationClient() {
  const params     = useSearchParams();
  const paymentId  = params.get('payment_id')       ?? '';
  const rzpOrderId = params.get('razorpay_order_id') ?? '';

  const [order,   setOrder]   = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId && !rzpOrderId) { setLoading(false); return; }
    let cancelled = false;

   async function init() {
      try {
        let fetchedOrder: OrderData | null = null;

        // The order is already created server-side in /verify. Just read it.
        if (paymentId) {
          const res = await fetch(
            `${BACKEND}/api/payments/order-by-payment/${paymentId}`,
            { credentials: 'include' }
          );
          if (!cancelled && res.ok) fetchedOrder = await res.json();
        }

        if (fetchedOrder && fetchedOrder.items?.length > 0) {
          // Fetch product images in parallel using product IDs
          const withImages = await Promise.all(
            fetchedOrder.items.map(async (item) => {
              try {
                const res = await fetch(`${BACKEND}/api/product/${item.product_id}`);
                if (res.ok) {
                  const data = await res.json();
                  const product = data?.product_details ?? data;
                  return { ...item, image: getFirstImage(product?.product_image) };
                }
              } catch {}
              return { ...item, image: null };
            })
          );
          fetchedOrder = { ...fetchedOrder, items: withImages };
        }

        if (!cancelled) setOrder(fetchedOrder);
      } catch { /* show generic confirmation */ }
      finally  { if (!cancelled) setLoading(false); }
    }

    init();
    return () => { cancelled = true; };
  }, [paymentId, rzpOrderId]);

  const shortId = order?.id?.slice(0, 8).toUpperCase()
    ?? paymentId.slice(-8).toUpperCase()
    ?? '—';

  const estDate = order?.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric' })
    : '3–5 business days';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Confirming your order…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Success circle + confetti */}
        <div className={styles.burst}>
          <div className={styles.circle}><span className={styles.check}>✓</span></div>
          <div className={styles.confetti}>
            {['🎉','⭐','🎊','✨','🌟','💫'].map((c, i) => (
              <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>{c}</span>
            ))}
          </div>
        </div>

        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.sub}>
          Thank you for shopping at {brand.name} 🎁<br />
          Your order is confirmed and will be packed soon.
        </p>

        {/* Meta row */}
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Order ID</span>
            <span className={styles.metaVal}>#{shortId}</span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Amount Paid</span>
            <span className={styles.metaVal}>
              ₹{(order?.amount_paid ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Est. Delivery</span>
            <span className={styles.metaVal}>{estDate}</span>
          </div>
        </div>

        {/* Items */}
        {order?.items && order.items.length > 0 && (
          <div className={styles.itemsWrap}>
            <div className={styles.itemsTitle}>Items Ordered</div>
            {order.items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.itemImgBox}>
                  {item.image
                    ? <img
                        src={item.image}
                        alt={item.name}
                        className={styles.itemImg}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display:flex');
                        }}
                      />
                    : null
                  }
                  <span
                    className={styles.itemImgFallback}
                    style={{ display: item.image ? 'none' : 'flex' }}
                  >🎁</span>
                </div>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQtyPrice}>
                  ×{item.quantity} · ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className={styles.timeline}>
          {[
            { icon: '✓',  label: 'Payment Confirmed',  time: 'Just now',          done: true  },
            { icon: '📦', label: 'Packing & Dispatch',  time: 'Within 24 hrs',    done: false },
            { icon: '🚚', label: 'Out for Delivery',    time: '2–4 business days', done: false },
            { icon: '🎁', label: 'Delivered!',           time: estDate,            done: false },
          ].map((step, i, arr) => (
            <div key={step.label} className={styles.timelineWrap}>
              <div className={styles.timelineStep}>
                <div className={`${styles.node} ${step.done ? styles.nodeDone : ''}`}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>{step.label}</div>
                  <div className={styles.stepTime}>{step.time}</div>
                </div>
              </div>
              {i < arr.length - 1 && <div className={styles.track} />}
            </div>
          ))}
        </div>

        {/* Payment ID reference */}
        {paymentId && (
          <div className={styles.paymentInfo}>
            <span className={styles.paymentInfoIcon}>💳</span>
            <span className={styles.paymentInfoText}>
              Payment ID: <strong>{paymentId}</strong>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/" className={styles.homeBtn}>Continue Shopping</Link>
          {order?.id && (
            <Link href={`/track-order?order_id=${order.id}`} className={styles.trackBtn}>
              Track Order →
            </Link>
          )}
          {!order?.id && (
            <Link href="/account/orders" className={styles.trackBtn}>
              View My Orders →
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}