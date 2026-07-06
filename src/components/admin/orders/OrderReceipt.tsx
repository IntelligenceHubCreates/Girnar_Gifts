'use client'

import { useEffect } from 'react'
import type { ApiOrder } from '@/lib/adminApi'
import { fmtMoneyFull, fmtDate } from '@/lib/format'
import { brand } from '@/config/brand'

export default function OrderReceipt({ order, onClose }: { order: ApiOrder; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const items      = order.items ?? []
  const itemsTotal = items.reduce((a, i) => a + i.qty * i.price, 0)
  const paid       = !!order.payment_status

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '30px 16px' }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ll-receipt, #ll-receipt * { visibility: visible !important; }
          #ll-receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; }
          .receipt-noprint { display: none !important; }
        }
      `}</style>

      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
        {/* Controls — hidden when printing */}
        <div className="receipt-noprint" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer' }}>🖨 Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', color: '#374151' }}>Close</button>
        </div>

        {/* Printable */}
        <div id="ll-receipt" style={{ padding: '28px 32px', color: '#111', fontSize: '.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{brand.shortName}<span style={{ color: 'var(--gg-primary)' }}>{brand.name.replace(brand.shortName, '').trim()}</span></div>
              <div style={{ color: '#6b7280', fontSize: '.72rem', marginTop: 2 }}>Order Receipt</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontFamily: 'monospace' }}>#{order.order_number}</div>
              <div style={{ color: '#6b7280', fontSize: '.72rem' }}>{fmtDate(order.created_at)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Customer</div>
              <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
              {order.customer_email !== '—' && <div style={{ color: '#6b7280', fontSize: '.76rem' }}>{order.customer_email}</div>}
              {order.customer_phone !== '—' && <div style={{ color: '#6b7280', fontSize: '.76rem' }}>{order.customer_phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Ship to</div>
              <div style={{ color: '#374151', fontSize: '.78rem', lineHeight: 1.5 }}>
                {order.address && order.address !== '—' ? <>{order.address}<br /></> : null}
                {[order.city, order.state].filter((x) => x && x !== '—').join(', ')}
                {order.pincode && order.pincode !== '—' ? ` - ${order.pincode}` : ''}
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '.68rem' }}>ITEM</th>
                <th style={{ textAlign: 'center', padding: '6px 4px', fontSize: '.68rem' }}>QTY</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '.68rem' }}>PRICE</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '.68rem' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '14px 4px', textAlign: 'center', color: '#9ca3af' }}>No item details</td></tr>
              ) : items.map((i, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>{i.name}{i.color ? ` · ${i.color}` : ''}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{i.qty}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>{fmtMoneyFull(i.price)}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{fmtMoneyFull(i.qty * i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
            <div style={{ width: 220 }}>
              {itemsTotal !== order.total_amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6b7280', fontSize: '.78rem' }}>
                  <span>Items subtotal</span><span>{fmtMoneyFull(itemsTotal)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #111', fontWeight: 900, fontSize: '1rem' }}>
                <span>Total</span><span>{fmtMoneyFull(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: 12, fontSize: '.76rem', color: '#6b7280' }}>
            <strong>Payment:</strong>{' '}
            {paid
              ? `${order.payment_status.toUpperCase()} · ${order.payment_method || 'Razorpay'}${order.razorpay_payment_id ? ` · ${order.razorpay_payment_id}` : ''}`
              : 'Not recorded (COD or unlinked order)'}
            <div style={{ marginTop: 4, fontStyle: 'italic' }}>Status: {order.status}</div>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: '.68rem', color: '#9ca3af' }}>
            This is a system-generated receipt, not a tax invoice. Thank you for shopping with {brand.name}.
          </div>
        </div>
      </div>
    </div>
  )
}