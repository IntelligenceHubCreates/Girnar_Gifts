'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './CheckoutPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';
import PaymentButton from '@/components/payment/PaymentButton';
import { useCart } from '@/context/CartContext';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Step = 'address' | 'payment' | 'confirmation';

interface Address {
  fullName: string; phone: string; pincode: string; city: string;
  state: string; addressLine1: string; addressLine2: string;
  landmark: string; type: 'home' | 'work' | 'other';
}

interface SavedAddress {
  id: number; backendId?: string; label: string; emoji: string;
  fullName: string; line: string; line2?: string; landmark?: string;
  city: string; state: string; pincode: string; phone: string;
  isDefault?: boolean;
}

// FIX: added color, color_hex to OrderItem so they flow into the order payload
interface OrderItem {
  id:            string | number;
  backendItemId?: string;
  name:          string;
  category:      string;
  price:         number;
  originalPrice: number;
  qty:           number;
  emoji:         string;
  bg:            string;
  image?:        string;
  color?:        string;      // ← selected color variant name e.g. "Blue"
  color_hex?:    string;      // ← selected color hex e.g. "#5ca3ff"
}

/* ─── Static Fallback Data ───────────────────────────────────────────────── */
const DEFAULT_ORDER_ITEMS: OrderItem[] = [
  { id: 1, emoji: '🚲', name: 'Balance Bicycle',  category: 'Vehicles',    price: 1399, originalPrice: 1999, qty: 1, bg: 'linear-gradient(135deg,#FFF3D4,#FFE099)' },
  { id: 3, emoji: '🦕', name: 'Dino Pull-Along',  category: 'Soft Toys',   price: 899,  originalPrice: 1200, qty: 2, bg: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)' },
  { id: 4, emoji: '🎨', name: 'Color Wonder Kit',  category: 'Arts & Crafts',price: 449, originalPrice: 599,  qty: 1, bg: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)' },
];

const GRADIENTS = [
  'linear-gradient(135deg,#FFF3D4,#FFE099)',
  'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
  'linear-gradient(135deg,#E0F3FF,#AACFF5)',
  'linear-gradient(135deg,#E8FFEE,#AAEECC)',
];
const EMOJIS: Record<string, string> = {
  Toys:'🧸', Vehicles:'🚲', 'Soft Toys':'🐻', Games:'🎮', Stationery:'✏️',
  'Arts & Crafts':'🎨', Books:'📚', 'Baby & Toddler':'🍼', Outdoor:'🛹', default:'🎁',
};
const STATES = ['Andhra Pradesh', 'Delhi', 'Goa', 'Gujarat', 'Karnataka', 'Kerala',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'West Bengal'];

function extractFirstImage(productImage: any): string {
  if (!productImage) return '';
  if (typeof productImage === 'string') return productImage;
  if (Array.isArray(productImage) && productImage.length > 0) {
    const first = productImage[0];
    return typeof first === 'string' ? first : (first?.url ?? '');
  }
  return '';
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? '';
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const router = useRouter();
  const [appliedCoupon, setAppliedCoupon] = useState<{ code?: string; discountAmount?: number } | null>(null);
  const [step,          setStep]          = useState<Step>('address');
  const [selectedSaved, setSelectedSaved] = useState<number | null>(null);
  const [showNewForm,   setShowNewForm]   = useState(false);
  const [address,       setAddress]       = useState<Address>({
    fullName: '', phone: '', pincode: '', city: '', state: '',
    addressLine1: '', addressLine2: '', landmark: '', type: 'home',
  });
  const [addrErrors,      setAddrErrors]      = useState<Partial<Address>>({});
  const [paymentError,    setPaymentError]    = useState<string | null>(null);
  const [addressSaving,   setAddressSaving]   = useState(false);
  const [addressError,    setAddressError]    = useState<string | null>(null);
  const orderItems: OrderItem[] = useMemo(
    () => cartState.items.map((ci, idx) => ({
      id:            ci.id,
      backendItemId: ci.cartItemId,
      name:          ci.name,
      category:      ci.category ?? 'General',
      price:         ci.price,
      originalPrice: ci.originalPrice ?? ci.price,
      qty:           ci.quantity,
      emoji:         ci.emoji ?? EMOJIS.default,
      bg:            ci.bgGradient ?? GRADIENTS[idx % GRADIENTS.length],
      image:         ci.image ?? '',
      color:         ci.color || undefined,
      color_hex:     ci.color_hex || undefined,
    })),
    [cartState.items],
  );
  const [savedAddresses,  setSavedAddresses]  = useState<SavedAddress[]>([]);
  const [backendAddressId,setBackendAddressId]= useState<string | null>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const SUBTOTAL        = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ORIGINAL_TOTAL  = orderItems.reduce((s, i) => s + i.originalPrice * i.qty, 0);
  const SAVINGS         = ORIGINAL_TOTAL - SUBTOTAL;
  const DELIVERY = SUBTOTAL >= 499 ? 0 : 49;

  // Real applied coupon (persisted by the cart). Server recomputes the charged
  // amount at create-order — this is display only.
  
  const COUPON_CODE     = appliedCoupon?.code || null;
  const COUPON_DISCOUNT = Math.max(0, Math.min(SUBTOTAL, Number(appliedCoupon?.discountAmount) || 0));

  const TOTAL = Math.max(0, SUBTOTAL + DELIVERY - COUPON_DISCOUNT);

  useEffect(() => {
    if (step === 'confirmation' && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  // Read the applied coupon after mount (hydration-safe)
  useEffect(() => {
    try { setAppliedCoupon(JSON.parse(localStorage.getItem('appliedCoupon') || 'null')); } catch {}
  }, []);

  // Empty cart on entry → back to /cart. Never render an empty/mock checkout.
  useEffect(() => {
    if (cartState.hydrated && cartState.items.length === 0 && step === 'address') {
      router.replace('/cart');
    }
  }, [cartState.hydrated, cartState.items.length, step, router]);

  useEffect(() => {
    // FIX: read color and color_hex from cart API response
   

    _get('/api/address/addresses').then((res: any) => {
      const addrs: any[] = Array.isArray(res) ? res : (res?.addresses || res?.data || []);
      const mapped: SavedAddress[] = addrs.map((a: any, idx: number) => ({
        id:        idx + 1,
        backendId: String(a.id),
        label:     a.address_type
                     ? a.address_type.charAt(0).toUpperCase() + a.address_type.slice(1)
                     : a.is_default ? 'Home' : `Address ${idx + 1}`,
        emoji:     a.address_type === 'work' ? '🏢' : a.address_type === 'other' ? '📌' : '🏠',
        fullName:  a.full_name    || '',
        line:      a.address_line1 || '',
        line2:     a.address_line2 || '',
        landmark:  a.landmark      || '',
        city:      a.city          || '',
        state:     a.state         || '',
        pincode:   a.postal_code || a.pincode || '',
        phone:     a.phone         || '',
        isDefault: Boolean(a.is_default),
      }));
      setSavedAddresses(mapped);
      if (mapped.length > 0) {
        const def = mapped.find(a => a.isDefault) || mapped[0];
        setSelectedSaved(def.id);
        setBackendAddressId(def.backendId || null);
      }
      if (mapped.length === 0) setShowNewForm(true);
    }).catch(() => { setShowNewForm(true); });
  }, []);

  function validateAddress(): boolean {
    if (selectedSaved !== null) return true;
    const errs: Partial<Address> = {};
    if (!address.fullName.trim())                            errs.fullName    = 'Required';
    if (!/^\d{10}$/.test(address.phone.replace(/\s/g,'')))  errs.phone       = 'Enter valid 10-digit number';
    if (!/^\d{6}$/.test(address.pincode))                   errs.pincode     = 'Enter valid 6-digit pincode';
    if (!address.addressLine1.trim())                        errs.addressLine1= 'Required';
    if (!address.city.trim())                                errs.city        = 'Required';
    if (!address.state)                                      errs.state       = 'Required' as never;
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAddressNext() {
    if (!validateAddress()) return;
    if (showNewForm && selectedSaved === null) {
      setAddressSaving(true); setAddressError(null);
      try {
        await _post('/api/address/addresses', {
          full_name: address.fullName, phone: address.phone,
          address_line1: address.addressLine1, address_line2: address.addressLine2,
          landmark: address.landmark, city: address.city, state: address.state,
          postal_code: address.pincode, country: 'India',
          address_type: address.type, is_default: savedAddresses.length === 0,
        });
        const res: any = await _get('/api/address/addresses');
        const addrs: any[] = Array.isArray(res) ? res : (res?.addresses || res?.data || []);
        const mapped: SavedAddress[] = addrs.map((a: any, idx: number) => ({
          id: idx+1, backendId: String(a.id),
          label: a.address_type ? a.address_type.charAt(0).toUpperCase()+a.address_type.slice(1) : `Address ${idx+1}`,
          emoji: a.address_type==='work' ? '🏢' : a.address_type==='other' ? '📌' : '🏠',
          fullName: a.full_name||'', line: a.address_line1||'', line2: a.address_line2||'',
          landmark: a.landmark||'', city: a.city||'', state: a.state||'',
          pincode: a.postal_code||a.pincode||'', phone: a.phone||'',
          isDefault: Boolean(a.is_default),
        }));
        setSavedAddresses(mapped);
        const newAddr = mapped[mapped.length - 1];
        if (newAddr) { setSelectedSaved(newAddr.id); setBackendAddressId(newAddr.backendId||null); }
        setShowNewForm(false);
        setAddress({ fullName:'', phone:'', pincode:'', city:'', state:'', addressLine1:'', addressLine2:'', landmark:'', type:'home' });
      } catch {
        setAddressError('Could not save address. Please try again.');
        setAddressSaving(false); return;
      } finally { setAddressSaving(false); }
    }
    setPaymentError(null); setStep('payment');
  }

  async function clearCartAfterPayment() {
    // Clear local cart state immediately
    cartDispatch({ type: 'CLEAR_CART' });
    // Backend has no /cart/clear endpoint — delete each item individually
    try {
      const res = await fetch('/api/cart', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const items: any[] = data?.cart_items ?? [];
        await Promise.all(
          items.map((item: any) => {
            const id = item.id ?? item.cartItemId;
            if (!id) return Promise.resolve();
            return fetch(`/api/cart/items/${id}`, {
              method: 'DELETE',
              credentials: 'include',
            }).catch(() => {});
          })
        );
      }
    } catch { /* silent — local cart is already cleared */ }
  }

  const SAVED_ADDRESSES  = savedAddresses;
  const confirmedAddress = selectedSaved !== null ? SAVED_ADDRESSES.find(a => a.id === selectedSaved) : null;
  const shippingAddressForPayment = confirmedAddress
    ? { fullName: confirmedAddress.fullName, phone: confirmedAddress.phone,
        addressLine1: confirmedAddress.line, addressLine2: confirmedAddress.line2||'',
        city: confirmedAddress.city, state: confirmedAddress.state,
        pincode: confirmedAddress.pincode, addressId: confirmedAddress.backendId||'' }
    : { fullName: address.fullName, phone: address.phone,
        addressLine1: address.addressLine1, addressLine2: address.addressLine2,
        city: address.city, state: address.state, pincode: address.pincode };

  const STEPS = [
    { key: 'address' as Step, label: 'Address', num: 1 },
    { key: 'payment' as Step, label: 'Payment', num: 2 },
    { key: 'confirmation' as Step, label: 'Confirm', num: 3 },
  ];
  const stepOrder: Step[]  = ['address', 'payment', 'confirmation'];
  const currentIndex        = stepOrder.indexOf(step);

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <Link href="/cart" className={styles.breadLink}>Cart</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>Checkout</span>
      </div>

      <div className={styles.stepBar}>
        {STEPS.map((s, i) => (
          <div key={s.key} className={styles.stepGroup}>
            <div className={`${styles.stepNode} ${currentIndex >= i ? styles.stepDone : ''} ${step === s.key ? styles.stepActive : ''}`}>
              {currentIndex > i
                ? <span className={styles.stepCheck}>✓</span>
                : <span className={styles.stepNum}>{s.num}</span>}
            </div>
            <span className={`${styles.stepLabel} ${step === s.key ? styles.stepLabelActive : ''}`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepConnector} ${currentIndex > i ? styles.stepConnectorDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.left}>

          {/* ─── STEP 1: ADDRESS ─── */}
          {step === 'address' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>📍</span>
                <div>
                  <h2 className={styles.cardTitle}>Delivery Address</h2>
                  <p className={styles.cardSub}>Where should we deliver your order?</p>
                </div>
              </div>

              {SAVED_ADDRESSES.length > 0 && (
                <div className={styles.savedAddrs}>
                  <div className={styles.savedTitle}>Your saved addresses</div>
                  <div className={styles.savedList}>
                    {SAVED_ADDRESSES.map((sa) => (
                      <label key={sa.id}
                        className={`${styles.savedAddr} ${selectedSaved === sa.id ? styles.savedAddrSelected : ''}`}
                        onClick={() => { setSelectedSaved(sa.id); setShowNewForm(false); }}>
                        <div className={styles.savedAddrRadio}>
                          <div className={`${styles.radio} ${selectedSaved === sa.id ? styles.radioSelected : ''}`} />
                        </div>
                        <div className={styles.savedAddrBody}>
                          <div className={styles.savedAddrTop}>
                            <span className={styles.savedAddrEmoji}>{sa.emoji}</span>
                            <span className={styles.savedAddrLabel}>{sa.label}</span>
                            <span className={styles.savedAddrName}>{sa.fullName}</span>
                          </div>
                          <div className={styles.savedAddrLine}>{sa.line}</div>
                          {sa.line2     && <div className={styles.savedAddrLine}>{sa.line2}</div>}
                          {sa.landmark  && <div className={styles.savedAddrLine}>Near: {sa.landmark}</div>}
                          <div className={styles.savedAddrLine}>{sa.city}, {sa.state} – {sa.pincode}</div>
                          <div className={styles.savedAddrPhone}>📞 {sa.phone}</div>
                        </div>
                        {selectedSaved === sa.id && <span className={styles.selectedTick}>✓</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                className={`${styles.newAddrToggle} ${showNewForm ? styles.newAddrToggleActive : ''}`}
                onClick={() => { setShowNewForm(!showNewForm); setSelectedSaved(null); }}>
                <span className={styles.newAddrPlus}>{showNewForm ? '−' : '+'}</span>
                {showNewForm ? 'Cancel new address' : 'Add a new address'}
              </button>

              {showNewForm && (
                <div className={styles.addrForm}>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Full Name *</label>
                      <input className={`${styles.input} ${addrErrors.fullName ? styles.inputError : ''}`}
                        placeholder="e.g. Priya Sharma" value={address.fullName}
                        onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))} />
                      {addrErrors.fullName && <span className={styles.errMsg}>{addrErrors.fullName}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Mobile Number *</label>
                      <input className={`${styles.input} ${addrErrors.phone ? styles.inputError : ''}`}
                        placeholder="10-digit number" maxLength={10} value={address.phone}
                        onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g,'') }))} />
                      {addrErrors.phone && <span className={styles.errMsg}>{addrErrors.phone}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Line 1 *</label>
                    <input className={`${styles.input} ${addrErrors.addressLine1 ? styles.inputError : ''}`}
                      placeholder="House / Flat No., Street, Colony" value={address.addressLine1}
                      onChange={e => setAddress(a => ({ ...a, addressLine1: e.target.value }))} />
                    {addrErrors.addressLine1 && <span className={styles.errMsg}>{addrErrors.addressLine1}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Line 2 <span className={styles.optional}>(optional)</span></label>
                    <input className={styles.input} placeholder="Apartment, Area, Locality"
                      value={address.addressLine2} onChange={e => setAddress(a => ({ ...a, addressLine2: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Landmark <span className={styles.optional}>(optional)</span></label>
                    <input className={styles.input} placeholder="Near bus stop, opposite park..."
                      value={address.landmark} onChange={e => setAddress(a => ({ ...a, landmark: e.target.value }))} />
                  </div>
                  <div className={styles.formGrid3}>
                    <div className={styles.field}>
                      <label className={styles.label}>Pincode *</label>
                      <input className={`${styles.input} ${addrErrors.pincode ? styles.inputError : ''}`}
                        placeholder="6-digit code" maxLength={6} value={address.pincode}
                        onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g,'') }))} />
                      {addrErrors.pincode && <span className={styles.errMsg}>{addrErrors.pincode}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>City *</label>
                      <input className={`${styles.input} ${addrErrors.city ? styles.inputError : ''}`}
                        placeholder="City" value={address.city}
                        onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
                      {addrErrors.city && <span className={styles.errMsg}>{addrErrors.city}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>State *</label>
                      <select className={`${styles.select} ${addrErrors.state ? styles.inputError : ''}`}
                        value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}>
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {addrErrors.state && <span className={styles.errMsg}>{addrErrors.state}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Type</label>
                    <div className={styles.typeRow}>
                      {(['home','work','other'] as const).map(t => (
                        <button key={t}
                          className={`${styles.typeBtn} ${address.type===t ? styles.typeBtnActive : ''}`}
                          onClick={() => setAddress(a => ({ ...a, type: t }))}>
                          {t==='home' ? '🏠' : t==='work' ? '🏢' : '📌'} {t.charAt(0).toUpperCase()+t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {addressError && (
                <div style={{ background:'#fff3f2', border:'1.5px solid #ffccc8', borderRadius:12,
                  padding:'10px 16px', fontSize:13, color:'#c0392b', fontWeight:600 }}>
                  ⚠️ {addressError}
                </div>
              )}

              <button className={styles.primaryBtn} onClick={handleAddressNext}
                disabled={(selectedSaved === null && !showNewForm) || addressSaving}>
                {addressSaving
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <span className={styles.spinner} />Saving address…
                    </span>
                  : 'Continue to Payment →'}
              </button>
            </div>
          )}

          {/* ─── STEP 2: PAYMENT ─── */}
          {step === 'payment' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>💳</span>
                <div>
                  <h2 className={styles.cardTitle}>Payment</h2>
                  <p className={styles.cardSub}>All transactions are 100% secure &amp; encrypted</p>
                </div>
                <div className={styles.sslBadge}>🔒 SSL</div>
              </div>

              {confirmedAddress && (
                <div className={styles.addrPill}>
                  <span>{confirmedAddress.emoji}</span>
                  <span className={styles.addrPillText}>
                    Delivering to <strong>{confirmedAddress.label}</strong>: {confirmedAddress.line}, {confirmedAddress.city}
                  </span>
                  <button className={styles.addrPillChange} onClick={() => setStep('address')}>Change</button>
                </div>
              )}

              <div className={styles.razorpayInfo}>
                <div className={styles.razorpayInfoRow}><span className={styles.razorpayInfoEmoji}>📱</span><span>UPI (GPay, PhonePe, Paytm, BHIM)</span></div>
                <div className={styles.razorpayInfoRow}><span className={styles.razorpayInfoEmoji}>💳</span><span>Credit &amp; Debit Cards (Visa, Mastercard, Rupay)</span></div>
                <div className={styles.razorpayInfoRow}><span className={styles.razorpayInfoEmoji}>🏦</span><span>Net Banking (50+ banks)</span></div>
                <div className={styles.razorpayInfoRow}><span className={styles.razorpayInfoEmoji}>👛</span><span>Wallets (Mobikwik, Freecharge &amp; more)</span></div>
              </div>

              {paymentError && <div className={styles.paymentError}>⚠️ {paymentError}</div>}

              <div className={styles.payActions}>
                <button className={styles.backBtn} onClick={() => setStep('address')}>← Back</button>
                <PaymentButton
                  amount={TOTAL}
                  cartItems={orderItems.map(i => ({
                    product_id: String(i.id),
                    name:       i.name,
                    price:      i.price,
                    quantity:   i.qty,
                    // FIX: pass color fields so they reach the order creation API
                    color:      i.color     ?? null,
                    color_hex:  i.color_hex ?? null,
                    image:      i.image     ?? null,
                  }))}
                  shippingAddress={shippingAddressForPayment}
                  userEmail={userEmail}
                  disabled={false}
                  onSuccess={async (paymentId, orderId) => {
                    await clearCartAfterPayment();
                        try {
                          localStorage.removeItem('appliedCoupon');
                          localStorage.removeItem('girnar_gift_message');
                        } catch {}
                    console.log('Payment success — cart cleared:', paymentId, orderId);
                  }}
                  onFailure={(msg) => {
                    setPaymentError(msg === 'Payment cancelled' ? null : msg);
                  }}
                />
              </div>
            </div>
          )}

          {/* ─── STEP 3: CONFIRMATION ─── */}
          {step === 'confirmation' && (
            <div className={styles.confirmCard} ref={confirmRef}>
              <div className={styles.confirmBurst}>
                <div className={styles.confirmCircle}>
                  <span className={styles.confirmCheck}>✓</span>
                </div>
                <div className={styles.confetti}>
                  {['🎉','⭐','🎊','✨','🌟','💫'].map((c, i) => (
                    <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>{c}</span>
                  ))}
                </div>
              </div>
              <h2 className={styles.confirmTitle}>Order Placed Successfully!</h2>
              <p className={styles.confirmSub}>
                Woohoo! Your little ones are going to love this 🎁<br />
                A confirmation has been sent to your registered email.
              </p>
              <div className={styles.confirmActions}>
                <Link href="/" className={styles.confirmHomeBtn}>Continue Shopping</Link>
                <Link href="/track-order" className={styles.confirmTrackBtn}>Track Order →</Link>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div className={styles.right}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              <Link href="/cart" className={styles.summaryEdit}>Edit cart</Link>
            </div>

            <div className={styles.summaryItems}>
              {orderItems.map(item => (
                <div key={`${item.id}-${item.color ?? 'nc'}`} className={styles.summaryItem}>
                  <div className={styles.summaryItemImg} style={{ background: item.image ? 'transparent' : item.bg }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name}
                        style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'inherit', display:'block' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const p = e.currentTarget.parentElement;
                          if (p) { p.style.background = item.bg; const s = document.createElement('span'); s.textContent = item.emoji; p.appendChild(s); }
                        }} />
                    ) : <span>{item.emoji}</span>}
                    <span className={styles.summaryItemQty}>{item.qty}</span>
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.name}</div>
                    <div className={styles.summaryItemCat}>{item.category}</div>
                    {/* Show selected color in summary */}
                    {item.color && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:3,
                        background:'var(--gg-muted-fill)', border:'1px solid var(--gg-border)', borderRadius:20,
                        padding:'2px 7px 2px 4px' }}>
                        {item.color_hex && (
                          <span style={{ width:8, height:8, borderRadius:'50%', background:item.color_hex,
                            border:'1px solid rgba(0,0,0,0.12)', display:'inline-block', flexShrink:0 }} />
                        )}
                        <span style={{ fontSize:10, fontWeight:700, color:'#555' }}>{item.color}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.summaryItemPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

              {COUPON_CODE && (
              <>
                <div className={styles.summaryDivider} />
                <div className={styles.couponApplied}>
                  <span className={styles.couponAppliedIcon}>🎟️</span>
                  <span className={styles.couponAppliedText}><strong>{COUPON_CODE}</strong> applied</span>
                  <span className={styles.couponAppliedSaving}>−₹{COUPON_DISCOUNT.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
            <div className={styles.summaryDivider} />

            <div className={styles.priceLines}>
              <div className={styles.priceLine}><span>Subtotal</span><span>₹{SUBTOTAL.toLocaleString('en-IN')}</span></div>
              <div className={`${styles.priceLine} ${styles.priceLineSaving}`}><span>Product discount</span><span>−₹{SAVINGS.toLocaleString('en-IN')}</span></div>
              {COUPON_CODE && (
                <div className={`${styles.priceLine} ${styles.priceLineSaving}`}><span>Coupon ({COUPON_CODE})</span><span>−₹{COUPON_DISCOUNT.toLocaleString('en-IN')}</span></div>
              )}
              <div className={styles.priceLine}><span>Delivery</span><span className={styles.freeTag}>{DELIVERY === 0 ? 'FREE' : `₹${DELIVERY}`}</span></div>
            </div>

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span className={styles.summaryTotalAmt}>₹{TOTAL.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.savingsBadge}>
              🎉 You're saving <strong>₹{(SAVINGS + COUPON_DISCOUNT + (DELIVERY === 0 ? 49 : 0)).toLocaleString('en-IN')}</strong> on this order
            </div>
            <div className={styles.secureStrip}>
              <span>🔒</span><span>Secured by 256-bit SSL encryption</span>
            </div>
          </div>

          <div className={styles.deliveryCard}>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🚚</span>
              <div><div className={styles.deliveryTitle}>Free Delivery</div><div className={styles.deliverySub}>Estimated 3–5 business days</div></div>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🔄</span>
              <div><div className={styles.deliveryTitle}>30-Day Easy Returns</div><div className={styles.deliverySub}>Hassle-free return policy</div></div>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🛡️</span>
              <div><div className={styles.deliveryTitle}>BIS Certified Products</div><div className={styles.deliverySub}>All toys are safety certified</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}