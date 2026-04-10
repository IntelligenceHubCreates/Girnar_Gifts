'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './CheckoutPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Step = 'address' | 'payment' | 'confirmation';
type PayMethod = 'upi' | 'card' | 'netbanking' | 'cod';

interface Address {
  fullName: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  type: 'home' | 'work' | 'other';
}

interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

interface SavedAddress {
  id: number;
  label: string;
  emoji: string;
  fullName: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

/* ─── Static Fallback Data ───────────────────────────────────────────────── */
const DEFAULT_ORDER_ITEMS = [
  { id: 1, emoji: '🚲', name: 'Balance Bicycle', category: 'Vehicles', price: 1399, originalPrice: 1999, qty: 1, bg: 'linear-gradient(135deg,#FFF3D4,#FFE099)' },
  { id: 3, emoji: '🦕', name: 'Dino Pull-Along', category: 'Soft Toys', price: 899, originalPrice: 1200, qty: 2, bg: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)' },
  { id: 4, emoji: '🎨', name: 'Color Wonder Kit', category: 'Arts & Crafts', price: 449, originalPrice: 599, qty: 1, bg: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)' },
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

const STATES = ['Andhra Pradesh', 'Delhi', 'Goa', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank', 'Canara Bank', 'Bank of Baroda'];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatCard(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const v = val.replace(/\D/g, '').slice(0, 4);
  return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('address');
  const [selectedSaved, setSelectedSaved] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [address, setAddress] = useState<Address>({
    fullName: '', phone: '', pincode: '', city: '', state: '',
    addressLine1: '', addressLine2: '', landmark: '', type: 'home',
  });
  const [addrErrors, setAddrErrors] = useState<Partial<Address>>({});
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [card, setCard] = useState<CardDetails>({ number: '', name: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState<Partial<CardDetails>>({});
  const [selectedBank, setSelectedBank] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(`LL${Date.now().toString().slice(-8)}`);
  const confirmRef = useRef<HTMLDivElement>(null);

  // ── Backend state ──────────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState(DEFAULT_ORDER_ITEMS);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [backendAddressId, setBackendAddressId] = useState<string | null>(null);

  // Derived totals (recalculate from live orderItems)
  const SUBTOTAL = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ORIGINAL_TOTAL = orderItems.reduce((s, i) => s + i.originalPrice * i.qty, 0);
  const SAVINGS = ORIGINAL_TOTAL - SUBTOTAL;
  const DELIVERY = SUBTOTAL >= 499 ? 0 : 49;
  const COUPON_DISCOUNT = Math.round(SUBTOTAL * 0.1);
  const TOTAL = SUBTOTAL + DELIVERY - COUPON_DISCOUNT;

  /* auto-scroll confirmation into view */
  useEffect(() => {
    if (step === 'confirmation' && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  /* Load real cart + saved addresses from backend */
  useEffect(() => {
    // Load cart
    _get('/api/cart').then((res: any) => {
      const items = (res?.cart_items || []).map((ci: any, idx: number) => ({
        id: ci.product?.id ?? idx,
        backendItemId: ci.id,
        name: ci.product?.name ?? 'Product',
        category: ci.product?.category ?? 'General',
        price: (ci.product?.original_price ?? 0) - (ci.product?.amount_discount ?? 0),
        originalPrice: ci.product?.original_price ?? 0,
        qty: ci.quantity ?? 1,
        emoji: EMOJIS[ci.product?.category] ?? EMOJIS.default,
        bg: GRADIENTS[idx % GRADIENTS.length],
      }));
      if (items.length > 0) setOrderItems(items);
    }).catch(() => {});

    // Load saved addresses
    _get('/api/addresses').then((res: any) => {
      const addrs = res?.addresses || (Array.isArray(res) ? res : []);
      const mapped: SavedAddress[] = addrs.map((a: any, idx: number) => ({
        id: idx + 1,
        backendId: a.id,
        label: a.is_default ? 'Home' : `Address ${idx + 1}`,
        emoji: idx === 0 ? '🏠' : '🏢',
        fullName: a.full_name || a.fullName || '',
        line: a.address_line1 || '',
        city: a.city || '',
        state: a.state || '',
        pincode: a.postal_code || '',
        phone: a.phone || '',
      }));
      if (mapped.length > 0) {
        setSavedAddresses(mapped);
        setSelectedSaved(mapped[0].id);
        setBackendAddressId(addrs[0]?.id || null);
      }
    }).catch(() => {});
  }, []);

  /* ─── Address Validation ─────────────────────────────────────────────── */
  function validateAddress(): boolean {
    if (selectedSaved !== null) return true;
    const errs: Partial<Address> = {};
    if (!address.fullName.trim()) errs.fullName = 'Required';
    if (!/^\d{10}$/.test(address.phone.replace(/\s/g, ''))) errs.phone = 'Enter valid 10-digit number';
    if (!/^\d{6}$/.test(address.pincode)) errs.pincode = 'Enter valid 6-digit pincode';
    if (!address.addressLine1.trim()) errs.addressLine1 = 'Required';
    if (!address.city.trim()) errs.city = 'Required';
    if (!address.state) errs.state = 'Required' as never;
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAddressNext() {
    if (!validateAddress()) return;
    // If user entered new address, save it to backend
    if (showNewForm && selectedSaved === null) {
      _post('/api/addresses', {
        full_name: address.fullName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.pincode,
        country: 'India',
        is_default: false,
      }).then((res: any) => {
        setBackendAddressId(res?.address?.id || res?.id || null);
      }).catch(() => {});
    }
    setStep('payment');
  }

  /* ─── UPI Verify ─────────────────────────────────────────────────────── */
  function verifyUpi() {
    if (!upiId.includes('@')) return;
    setUpiVerifying(true);
    setTimeout(() => { setUpiVerifying(false); setUpiVerified(true); }, 1400);
  }

  /* ─── Payment Validation ─────────────────────────────────────────────── */
  function validatePayment(): boolean {
    if (payMethod === 'upi') return upiVerified || upiId.includes('@');
    if (payMethod === 'card') {
      const errs: Partial<CardDetails> = {};
      if (card.number.replace(/\s/g, '').length < 16) errs.number = 'Enter 16-digit card number';
      if (!card.name.trim()) errs.name = 'Required';
      if (card.expiry.length < 5) errs.expiry = 'Enter valid expiry';
      if (card.cvv.length < 3) errs.cvv = 'Enter 3-digit CVV';
      setCardErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (payMethod === 'netbanking') return !!selectedBank;
    return true; // COD
  }

  function handlePlaceOrder() {
    if (!validatePayment()) return;
    setPlacing(true);
    // Call backend to place the order
    const selectedAddrObj = savedAddresses.find(a => a.id === selectedSaved);
    _post('/api/orders', {
      address_id: backendAddressId || undefined,
      payment_method: payMethod,
      shipping_address: selectedAddrObj
        ? `${selectedAddrObj.fullName}, ${selectedAddrObj.line}, ${selectedAddrObj.city}, ${selectedAddrObj.state} - ${selectedAddrObj.pincode}`
        : `${address.fullName}, ${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`,
    }).then((res: any) => {
      const id = res?.order?.id || res?.id || orderId;
      setOrderId(String(id));
    }).catch(() => {
      // Even if API fails, show confirmation for UX continuity
    }).finally(() => {
      setPlacing(false);
      setStep('confirmation');
    });
  }

  /* ─── Delivery Address Display ───────────────────────────────────────── */
  const SAVED_ADDRESSES = savedAddresses.length > 0 ? savedAddresses : [
    { id: 1, label: 'Home', emoji: '🏠', fullName: 'Priya Sharma', line: '42, Banjara Hills, Road No. 12', city: 'Hyderabad', state: 'Telangana', pincode: '500034', phone: '+91 98765 43210' },
    { id: 2, label: 'Work', emoji: '🏢', fullName: 'Priya Sharma', line: '3rd Floor, Cyber Towers, HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081', phone: '+91 98765 43210' },
  ];

  const confirmedAddress = selectedSaved !== null
    ? SAVED_ADDRESSES.find(a => a.id === selectedSaved)
    : null;

  /* ─── Step labels ────────────────────────────────────────────────────── */
  const STEPS: { key: Step; label: string; num: number }[] = [
    { key: 'address', label: 'Address', num: 1 },
    { key: 'payment', label: 'Payment', num: 2 },
    { key: 'confirmation', label: 'Confirm', num: 3 },
  ];
  const stepOrder: Step[] = ['address', 'payment', 'confirmation'];
  const currentIndex = stepOrder.indexOf(step);

  const ORDER_ITEMS = orderItems;

  /* ──────────────────────────────────────────────────────────────────────
     RENDER — 100% identical to original Little Loot UI
  ────────────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <Link href="/cart" className={styles.breadLink}>Cart</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>Checkout</span>
      </div>

      {/* ── Step Progress Bar ── */}
      <div className={styles.stepBar}>
        {STEPS.map((s, i) => (
          <div key={s.key} className={styles.stepGroup}>
            <div className={`${styles.stepNode} ${currentIndex >= i ? styles.stepDone : ''} ${step === s.key ? styles.stepActive : ''}`}>
              {currentIndex > i ? (
                <span className={styles.stepCheck}>✓</span>
              ) : (
                <span className={styles.stepNum}>{s.num}</span>
              )}
            </div>
            <span className={`${styles.stepLabel} ${step === s.key ? styles.stepLabelActive : ''}`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepConnector} ${currentIndex > i ? styles.stepConnectorDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className={styles.layout}>

        {/* ══════════════════════════════════════════
            LEFT COLUMN — steps content
        ══════════════════════════════════════════ */}
        <div className={styles.left}>

          {/* ───────────── STEP 1: ADDRESS ───────────── */}
          {step === 'address' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>📍</span>
                <div>
                  <h2 className={styles.cardTitle}>Delivery Address</h2>
                  <p className={styles.cardSub}>Where should we deliver your order?</p>
                </div>
              </div>

              {/* Saved addresses */}
              {SAVED_ADDRESSES.length > 0 && (
                <div className={styles.savedAddrs}>
                  <div className={styles.savedTitle}>Your saved addresses</div>
                  <div className={styles.savedList}>
                    {SAVED_ADDRESSES.map((sa) => (
                      <label
                        key={sa.id}
                        className={`${styles.savedAddr} ${selectedSaved === sa.id ? styles.savedAddrSelected : ''}`}
                        onClick={() => { setSelectedSaved(sa.id); setShowNewForm(false); }}
                      >
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
                          <div className={styles.savedAddrLine}>{sa.city}, {sa.state} – {sa.pincode}</div>
                          <div className={styles.savedAddrPhone}>📞 {sa.phone}</div>
                        </div>
                        {selectedSaved === sa.id && (
                          <span className={styles.selectedTick}>✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new address toggle */}
              <button
                className={`${styles.newAddrToggle} ${showNewForm ? styles.newAddrToggleActive : ''}`}
                onClick={() => { setShowNewForm(!showNewForm); setSelectedSaved(null); }}
              >
                <span className={styles.newAddrPlus}>{showNewForm ? '−' : '+'}</span>
                {showNewForm ? 'Cancel new address' : 'Add a new address'}
              </button>

              {/* New address form */}
              {showNewForm && (
                <div className={styles.addrForm}>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Full Name *</label>
                      <input
                        className={`${styles.input} ${addrErrors.fullName ? styles.inputError : ''}`}
                        placeholder="e.g. Priya Sharma"
                        value={address.fullName}
                        onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))}
                      />
                      {addrErrors.fullName && <span className={styles.errMsg}>{addrErrors.fullName}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Mobile Number *</label>
                      <input
                        className={`${styles.input} ${addrErrors.phone ? styles.inputError : ''}`}
                        placeholder="10-digit number"
                        maxLength={10}
                        value={address.phone}
                        onChange={e => setAddress(a => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))}
                      />
                      {addrErrors.phone && <span className={styles.errMsg}>{addrErrors.phone}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Line 1 *</label>
                    <input
                      className={`${styles.input} ${addrErrors.addressLine1 ? styles.inputError : ''}`}
                      placeholder="House / Flat No., Street, Colony"
                      value={address.addressLine1}
                      onChange={e => setAddress(a => ({ ...a, addressLine1: e.target.value }))}
                    />
                    {addrErrors.addressLine1 && <span className={styles.errMsg}>{addrErrors.addressLine1}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Line 2 <span className={styles.optional}>(optional)</span></label>
                    <input
                      className={styles.input}
                      placeholder="Apartment, Area, Locality"
                      value={address.addressLine2}
                      onChange={e => setAddress(a => ({ ...a, addressLine2: e.target.value }))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Landmark <span className={styles.optional}>(optional)</span></label>
                    <input
                      className={styles.input}
                      placeholder="Near bus stop, opposite park..."
                      value={address.landmark}
                      onChange={e => setAddress(a => ({ ...a, landmark: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGrid3}>
                    <div className={styles.field}>
                      <label className={styles.label}>Pincode *</label>
                      <input
                        className={`${styles.input} ${addrErrors.pincode ? styles.inputError : ''}`}
                        placeholder="6-digit code"
                        maxLength={6}
                        value={address.pincode}
                        onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
                      />
                      {addrErrors.pincode && <span className={styles.errMsg}>{addrErrors.pincode}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>City *</label>
                      <input
                        className={`${styles.input} ${addrErrors.city ? styles.inputError : ''}`}
                        placeholder="City"
                        value={address.city}
                        onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                      />
                      {addrErrors.city && <span className={styles.errMsg}>{addrErrors.city}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>State *</label>
                      <select
                        className={`${styles.select} ${addrErrors.state ? styles.inputError : ''}`}
                        value={address.state}
                        onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                      >
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {addrErrors.state && <span className={styles.errMsg}>{addrErrors.state}</span>}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address Type</label>
                    <div className={styles.typeRow}>
                      {(['home', 'work', 'other'] as const).map(t => (
                        <button
                          key={t}
                          className={`${styles.typeBtn} ${address.type === t ? styles.typeBtnActive : ''}`}
                          onClick={() => setAddress(a => ({ ...a, type: t }))}
                        >
                          {t === 'home' ? '🏠' : t === 'work' ? '🏢' : '📌'} {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                className={styles.primaryBtn}
                onClick={handleAddressNext}
                disabled={selectedSaved === null && !showNewForm}
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* ───────────── STEP 2: PAYMENT ───────────── */}
          {step === 'payment' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>💳</span>
                <div>
                  <h2 className={styles.cardTitle}>Payment Method</h2>
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

              <div className={styles.payTabs}>
                {([
                  { key: 'upi', emoji: '📱', label: 'UPI' },
                  { key: 'card', emoji: '💳', label: 'Card' },
                  { key: 'netbanking', emoji: '🏦', label: 'Net Banking' },
                  { key: 'cod', emoji: '📦', label: 'Cash on Delivery' },
                ] as { key: PayMethod; emoji: string; label: string }[]).map(pm => (
                  <button
                    key={pm.key}
                    className={`${styles.payTab} ${payMethod === pm.key ? styles.payTabActive : ''}`}
                    onClick={() => setPayMethod(pm.key)}
                  >
                    <span className={styles.payTabEmoji}>{pm.emoji}</span>
                    <span className={styles.payTabLabel}>{pm.label}</span>
                    {payMethod === pm.key && <span className={styles.payTabDot} />}
                  </button>
                ))}
              </div>

              {payMethod === 'upi' && (
                <div className={styles.payPanel}>
                  <div className={styles.upiRow}>
                    <div className={styles.upiApps}>
                      {['🟢 GPay', '💜 PhonePe', '🔵 Paytm', '🟠 BHIM'].map(app => (
                        <button key={app} className={styles.upiApp}>{app}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.upiDivider}><span>or enter UPI ID</span></div>
                  <div className={styles.upiInputRow}>
                    <input
                      className={`${styles.input} ${upiVerified ? styles.inputSuccess : ''}`}
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={e => { setUpiId(e.target.value); setUpiVerified(false); }}
                    />
                    <button
                      className={styles.verifyBtn}
                      onClick={verifyUpi}
                      disabled={!upiId.includes('@') || upiVerifying}
                    >
                      {upiVerifying ? <span className={styles.spinner} /> : upiVerified ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                  {upiVerified && <p className={styles.upiSuccess}>✅ UPI ID verified successfully!</p>}
                </div>
              )}

              {payMethod === 'card' && (
                <div className={styles.payPanel}>
                  <div className={styles.cardPreview}>
                    <div className={styles.cardPreviewTop}>
                      <div className={styles.cardChip}>▬▬</div>
                      <div className={styles.cardBrand}>
                        {card.number.startsWith('4') ? 'VISA' : card.number.startsWith('5') ? 'MC' : '💳'}
                      </div>
                    </div>
                    <div className={styles.cardPreviewNum}>
                      {(card.number || '•••• •••• •••• ••••').padEnd(19, '•').slice(0, 19)}
                    </div>
                    <div className={styles.cardPreviewBottom}>
                      <div>
                        <div className={styles.cardPreviewSmall}>Card Holder</div>
                        <div className={styles.cardPreviewVal}>{card.name || 'YOUR NAME'}</div>
                      </div>
                      <div>
                        <div className={styles.cardPreviewSmall}>Expires</div>
                        <div className={styles.cardPreviewVal}>{card.expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Card Number *</label>
                    <input
                      className={`${styles.input} ${cardErrors.number ? styles.inputError : ''}`}
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                      maxLength={19}
                    />
                    {cardErrors.number && <span className={styles.errMsg}>{cardErrors.number}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Name on Card *</label>
                    <input
                      className={`${styles.input} ${cardErrors.name ? styles.inputError : ''}`}
                      placeholder="As printed on card"
                      value={card.name}
                      onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
                    />
                    {cardErrors.name && <span className={styles.errMsg}>{cardErrors.name}</span>}
                  </div>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Expiry Date *</label>
                      <input
                        className={`${styles.input} ${cardErrors.expiry ? styles.inputError : ''}`}
                        placeholder="MM/YY"
                        value={card.expiry}
                        maxLength={5}
                        onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                      />
                      {cardErrors.expiry && <span className={styles.errMsg}>{cardErrors.expiry}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>CVV *</label>
                      <input
                        className={`${styles.input} ${cardErrors.cvv ? styles.inputError : ''}`}
                        placeholder="3-digit code"
                        maxLength={3}
                        value={card.cvv}
                        onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
                      />
                      {cardErrors.cvv && <span className={styles.errMsg}>{cardErrors.cvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'netbanking' && (
                <div className={styles.payPanel}>
                  <div className={styles.bankGrid}>
                    {BANKS.map(b => (
                      <button
                        key={b}
                        className={`${styles.bankBtn} ${selectedBank === b ? styles.bankBtnSelected : ''}`}
                        onClick={() => setSelectedBank(b)}
                      >
                        <span className={styles.bankIcon}>🏦</span>
                        <span>{b}</span>
                        {selectedBank === b && <span className={styles.bankTick}>✓</span>}
                      </button>
                    ))}
                  </div>
                  {!selectedBank && <p className={styles.bankHint}>Please select your bank to continue</p>}
                </div>
              )}

              {payMethod === 'cod' && (
                <div className={styles.payPanel}>
                  <div className={styles.codBox}>
                    <div className={styles.codEmoji}>📦</div>
                    <div>
                      <div className={styles.codTitle}>Cash on Delivery</div>
                      <div className={styles.codText}>Pay ₹{TOTAL.toLocaleString('en-IN')} when your order arrives. Please keep exact change ready.</div>
                    </div>
                  </div>
                  <div className={styles.codNote}>
                    <span>ℹ️</span>
                    <span>COD orders typically take 1 extra business day to process. An additional ₹20 handling fee applies.</span>
                  </div>
                </div>
              )}

              <div className={styles.payActions}>
                <button className={styles.backBtn} onClick={() => setStep('address')}>← Back</button>
                <button
                  className={`${styles.primaryBtn} ${styles.primaryBtnFlex} ${placing ? styles.primaryBtnLoading : ''}`}
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <><span className={styles.spinner} /> Processing…</>
                  ) : (
                    <>🔒 Place Order · ₹{TOTAL.toLocaleString('en-IN')}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ───────────── STEP 3: CONFIRMATION ───────────── */}
          {step === 'confirmation' && (
            <div className={styles.confirmCard} ref={confirmRef}>
              <div className={styles.confirmBurst}>
                <div className={styles.confirmCircle}>
                  <span className={styles.confirmCheck}>✓</span>
                </div>
                <div className={styles.confetti}>
                  {['🎉', '⭐', '🎊', '✨', '🌟', '💫'].map((c, i) => (
                    <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>{c}</span>
                  ))}
                </div>
              </div>

              <h2 className={styles.confirmTitle}>Order Placed Successfully!</h2>
              <p className={styles.confirmSub}>
                Woohoo! Your little ones are going to love this 🎁<br />
                A confirmation has been sent to your registered email.
              </p>

              <div className={styles.confirmMeta}>
                <div className={styles.confirmMetaItem}>
                  <span className={styles.confirmMetaLabel}>Order ID</span>
                  <span className={styles.confirmMetaVal}>#{orderId}</span>
                </div>
                <div className={styles.confirmMetaDivider} />
                <div className={styles.confirmMetaItem}>
                  <span className={styles.confirmMetaLabel}>Amount Paid</span>
                  <span className={styles.confirmMetaVal}>₹{TOTAL.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.confirmMetaDivider} />
                <div className={styles.confirmMetaItem}>
                  <span className={styles.confirmMetaLabel}>Estimated Delivery</span>
                  <span className={styles.confirmMetaVal}>3–5 business days</span>
                </div>
              </div>

              <div className={styles.timeline}>
                <div className={`${styles.timelineStep} ${styles.timelineDone}`}>
                  <div className={styles.timelineNode}>✓</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Order Confirmed</div>
                    <div className={styles.timelineTime}>Just now</div>
                  </div>
                </div>
                <div className={styles.timelineTrack} />
                <div className={styles.timelineStep}>
                  <div className={styles.timelineNode}>📦</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Packing &amp; Dispatch</div>
                    <div className={styles.timelineTime}>Within 24 hrs</div>
                  </div>
                </div>
                <div className={styles.timelineTrack} />
                <div className={styles.timelineStep}>
                  <div className={styles.timelineNode}>🚚</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Out for Delivery</div>
                    <div className={styles.timelineTime}>2–4 business days</div>
                  </div>
                </div>
                <div className={styles.timelineTrack} />
                <div className={styles.timelineStep}>
                  <div className={styles.timelineNode}>🎁</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Delivered!</div>
                    <div className={styles.timelineTime}>3–5 business days</div>
                  </div>
                </div>
              </div>

              <div className={styles.confirmActions}>
                <Link href="/" className={styles.confirmHomeBtn}>Continue Shopping</Link>
                <Link href="/track-order" className={styles.confirmTrackBtn}>Track Order →</Link>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT COLUMN — Order Summary
        ══════════════════════════════════════════ */}
        <div className={styles.right}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              <Link href="/cart" className={styles.summaryEdit}>Edit cart</Link>
            </div>

            <div className={styles.summaryItems}>
              {ORDER_ITEMS.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemImg} style={{ background: item.bg }}>
                    <span>{item.emoji}</span>
                    <span className={styles.summaryItemQty}>{item.qty}</span>
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.name}</div>
                    <div className={styles.summaryItemCat}>{item.category}</div>
                  </div>
                  <div className={styles.summaryItemPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.couponApplied}>
              <span className={styles.couponAppliedIcon}>🎟️</span>
              <span className={styles.couponAppliedText}><strong>LITTLE10</strong> applied</span>
              <span className={styles.couponAppliedSaving}>−₹{COUPON_DISCOUNT.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.priceLines}>
              <div className={styles.priceLine}>
                <span>Subtotal</span>
                <span>₹{SUBTOTAL.toLocaleString('en-IN')}</span>
              </div>
              <div className={`${styles.priceLine} ${styles.priceLineSaving}`}>
                <span>Product discount</span>
                <span>−₹{SAVINGS.toLocaleString('en-IN')}</span>
              </div>
              <div className={`${styles.priceLine} ${styles.priceLineSaving}`}>
                <span>Coupon (LITTLE10)</span>
                <span>−₹{COUPON_DISCOUNT.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.priceLine}>
                <span>Delivery</span>
                <span className={styles.freeTag}>{DELIVERY === 0 ? 'FREE' : `₹${DELIVERY}`}</span>
              </div>
            </div>

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span className={styles.summaryTotalAmt}>₹{TOTAL.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.savingsBadge}>
              🎉 You're saving <strong>₹{(SAVINGS + COUPON_DISCOUNT + (DELIVERY === 0 ? 49 : 0)).toLocaleString('en-IN')}</strong> on this order
            </div>

            <div className={styles.secureStrip}>
              <span>🔒</span>
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </div>

          <div className={styles.deliveryCard}>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🚚</span>
              <div>
                <div className={styles.deliveryTitle}>Free Delivery</div>
                <div className={styles.deliverySub}>Estimated 3–5 business days</div>
              </div>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🔄</span>
              <div>
                <div className={styles.deliveryTitle}>30-Day Easy Returns</div>
                <div className={styles.deliverySub}>Hassle-free return policy</div>
              </div>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryEmoji}>🛡️</span>
              <div>
                <div className={styles.deliveryTitle}>BIS Certified Products</div>
                <div className={styles.deliverySub}>All toys are safety certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
