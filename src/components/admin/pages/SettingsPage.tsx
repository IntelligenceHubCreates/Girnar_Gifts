'use client'

import { useState } from 'react'

type SettingsTab = 'storeinfo' | 'shipping' | 'payments' | 'email' | 'appearance' | 'security' | 'integrations'

const TABS: { id: SettingsTab; icon: string; label: string }[] = [
  { id:'storeinfo',     icon:'🏬', label:'Store Info' },
  { id:'shipping',      icon:'🚚', label:'Shipping' },
  { id:'payments',      icon:'💳', label:'Payments' },
  { id:'email',         icon:'📧', label:'Email & SMS' },
  { id:'appearance',    icon:'🎨', label:'Appearance' },
  { id:'security',      icon:'🔒', label:'Security' },
  { id:'integrations',  icon:'🔗', label:'Integrations' },
]

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={on} onChange={() => setOn(!on)} />
      <span className="ts-slider" />
    </label>
  )
}

function ShippingZone({ icon, name, detail, pill, pillCls, action }: { icon:string; name:string; detail:string; pill:string; pillCls:string; action: React.ReactNode }) {
  return (
    <div className="shipping-zone">
      <div style={{ fontSize:22 }}>{icon}</div>
      <div className="sz-info"><div className="sz-name">{name}</div><div className="sz-detail">{detail}</div></div>
      <span className={`pill ${pillCls}`}>{pill}</span>
      {action}
    </div>
  )
}

/* ── STORE INFO ── */
function StoreInfo() {
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Store Information</div><div className="ss-sub">Your store's public-facing identity and contact details</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Store Name</label><input className="form-input" defaultValue="Little Loot"/></div>
            <div className="form-group"><label className="form-label">Store URL</label><input className="form-input" defaultValue="littleloot.in"/></div>
            <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" type="email" defaultValue="hello@littleloot.in"/></div>
            <div className="form-group"><label className="form-label">Support Phone</label><input className="form-input" defaultValue="+91 98765 43210"/></div>
            <div className="form-group span-2"><label className="form-label">Store Address</label><input className="form-input" defaultValue="42 Loot Lane, Guntur, Andhra Pradesh – 522001"/></div>
            <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" defaultValue="37AADCL9458Q1ZJ"/></div>
            <div className="form-group"><label className="form-label">Currency</label>
              <select className="form-select"><option>Indian Rupee (₹ INR)</option><option>US Dollar ($ USD)</option></select>
            </div>
            <div className="form-group"><label className="form-label">Time Zone</label>
              <select className="form-select"><option>Asia/Kolkata (IST +5:30)</option><option>UTC +0:00</option></select>
            </div>
            <div className="form-group"><label className="form-label">Business Type</label>
              <select className="form-select"><option>Retail — Kids & Toys</option><option>Wholesale</option><option>D2C Brand</option></select>
            </div>
            <div className="form-group span-2"><label className="form-label">Store Description</label>
              <textarea className="form-textarea" defaultValue="Little Loot is India's favourite destination for kids' stationery, toys, and educational products. Trusted by 3,400+ parents." />
            </div>
            <div className="form-group span-2"><label className="form-label">Store Logo URL</label><input className="form-input" placeholder="https://littleloot.in/logo.png"/></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Changes</button><button className="btn btn-ghost">↺ Reset</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Social Media Links</div><div className="ss-sub">Connect your store's social profiles</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Instagram</label><input className="form-input" defaultValue="@littleloot.in"/></div>
            <div className="form-group"><label className="form-label">Facebook</label><input className="form-input" placeholder="facebook.com/littleloot"/></div>
            <div className="form-group"><label className="form-label">YouTube</label><input className="form-input" placeholder="youtube.com/@littleloot"/></div>
            <div className="form-group"><label className="form-label">WhatsApp Business</label><input className="form-input" defaultValue="+91 98765 43210"/></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Social Links</button></div>
      </div>
    </>
  )
}

/* ── SHIPPING ── */
function Shipping() {
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Shipping Zones & Rates</div><div className="ss-sub">Configure delivery areas, pricing and estimated times</div></div>
        <div className="ss-body">
          <ShippingZone icon="🇮🇳" name="Domestic — All India" detail="₹49 flat · Free above ₹499 · 3–5 business days · via Delhivery, Shiprocket" pill="Active" pillCls="pill-green" action={<button className="btn btn-outline btn-xs">✏️ Edit</button>} />
          <ShippingZone icon="⚡" name="Express — Metro Cities" detail="₹99 flat · Same/Next-day · Hyderabad, Bengaluru, Mumbai, Delhi, Chennai" pill="Active" pillCls="pill-green" action={<button className="btn btn-outline btn-xs">✏️ Edit</button>} />
          <ShippingZone icon="🌏" name="International" detail="Not configured · Enable to ship globally" pill="Inactive" pillCls="pill-grey" action={<button className="btn btn-primary btn-xs">⚙️ Configure</button>} />
          <button className="btn btn-outline" style={{ marginTop:12 }}>➕ Add Shipping Zone</button>
        </div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Packaging & Weight</div><div className="ss-sub">Default package sizes for rate calculation</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Default Package Weight (g)</label><input className="form-input" type="number" defaultValue={350}/></div>
            <div className="form-group"><label className="form-label">Max Order Weight (kg)</label><input className="form-input" type="number" defaultValue={10}/></div>
            <div className="form-group"><label className="form-label">Box L × W × H (cm)</label><input className="form-input" defaultValue="30 × 20 × 15"/></div>
            <div className="form-group"><label className="form-label">Courier Partner</label>
              <select className="form-select"><option>Shiprocket (Auto-select)</option><option>Delhivery</option><option>DTDC</option><option>Blue Dart</option></select>
            </div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Shipping</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Delivery Rules</div><div className="ss-sub">Control when free shipping and COD are available</div></div>
        <div className="ss-body">
          {[
            { label:'Free Shipping Above ₹499', sub:'Automatically waive shipping for qualifying orders', on:true },
            { label:'Cash on Delivery (COD)',   sub:'Allow COD for domestic orders with ₹30 COD fee', on:true },
            { label:'Saturday Deliveries',       sub:'Include Saturday in estimated delivery window', on:false },
            { label:'Notify When Shipped',       sub:'Send tracking email + SMS when order is dispatched', on:true },
          ].map(t => (
            <div key={t.label} className="toggle-row">
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Rules</button></div>
      </div>
    </>
  )
}

/* ── PAYMENTS ── */
function Payments() {
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Payment Gateways</div><div className="ss-sub">Connect and manage your payment providers</div></div>
        <div className="ss-body">
          <ShippingZone icon="💳" name="Razorpay" detail="UPI, Cards, Net Banking, Wallets · 2% + ₹3 per transaction" pill="Connected" pillCls="pill-green" action={<button className="btn btn-outline btn-xs">⚙️ Configure</button>} />
          <ShippingZone icon="📱" name="PhonePe Payment Gateway" detail="UPI & Wallet · 1.8% per transaction" pill="Connected" pillCls="pill-green" action={<button className="btn btn-outline btn-xs">⚙️ Configure</button>} />
          <ShippingZone icon="🏦" name="PayU" detail="EMI, Cards, Net Banking · Not yet connected" pill="Inactive" pillCls="pill-grey" action={<button className="btn btn-primary btn-xs">➕ Connect</button>} />
          <ShippingZone icon="💵" name="Cash on Delivery (COD)" detail="₹30 handling fee · Domestic orders only" pill="Active" pillCls="pill-green" action={<button className="btn btn-outline btn-xs">⚙️ Configure</button>} />
        </div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Razorpay Configuration</div><div className="ss-sub">API keys and webhook settings</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">API Key ID</label><input className="form-input" type="password" defaultValue="rzp_live_••••••••••••••••"/></div>
            <div className="form-group"><label className="form-label">API Key Secret</label><input className="form-input" type="password" defaultValue="••••••••••••••••••••••••"/></div>
            <div className="form-group span-2"><label className="form-label">Webhook URL (read-only)</label><input className="form-input" readOnly defaultValue="https://littleloot.in/api/webhooks/razorpay" style={{ background:'var(--soft-2)', color:'var(--muted)' }}/></div>
            <div className="form-group"><label className="form-label">Mode</label><select className="form-select"><option>Live</option><option>Test</option></select></div>
            <div className="form-group"><label className="form-label">Auto-capture</label><select className="form-select"><option>Immediate</option><option>Manual (24h)</option></select></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Gateway</button><button className="btn btn-ghost">🔁 Test Connection</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Payout & Tax Settings</div><div className="ss-sub">Bank account and GST configuration</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Bank Account (IFSC)</label><input className="form-input" defaultValue="HDFC0001234"/></div>
            <div className="form-group"><label className="form-label">Account Number</label><input className="form-input" type="password" defaultValue="••••••••4567"/></div>
            <div className="form-group"><label className="form-label">GST Rate on Products</label><select className="form-select"><option>0% (Exempt)</option><option>5%</option><option>12%</option><option>18%</option></select></div>
            <div className="form-group"><label className="form-label">Invoice Prefix</label><input className="form-input" defaultValue="LL-INV-"/></div>
          </div>
          <div className="toggle-row" style={{ marginTop:10 }}>
            <div className="tr-info"><div className="tr-name">Show GST Breakdown on Invoice</div><div className="tr-sub">Display CGST + SGST split on customer invoices</div></div>
            <Toggle defaultChecked />
          </div>
          <div className="toggle-row">
            <div className="tr-info"><div className="tr-name">Collect GST at Checkout</div><div className="tr-sub">Add applicable GST to order total at checkout</div></div>
            <Toggle defaultChecked />
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Payout Info</button></div>
      </div>
    </>
  )
}

/* ── EMAIL & SMS ── */
function EmailSMS() {
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Email Configuration</div><div className="ss-sub">SMTP settings and sender details</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Sender Name</label><input className="form-input" defaultValue="Little Loot"/></div>
            <div className="form-group"><label className="form-label">Sender Email</label><input className="form-input" type="email" defaultValue="hello@littleloot.in"/></div>
            <div className="form-group"><label className="form-label">Reply-To Email</label><input className="form-input" type="email" defaultValue="support@littleloot.in"/></div>
            <div className="form-group"><label className="form-label">Email Provider</label><select className="form-select"><option>SendGrid</option><option>Mailgun</option><option>SMTP (Custom)</option><option>AWS SES</option></select></div>
            <div className="form-group span-2"><label className="form-label">SendGrid API Key</label><input className="form-input" type="password" defaultValue="SG.••••••••••••••••••••••••••"/></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Email Config</button><button className="btn btn-ghost">✉️ Send Test Email</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Transactional Email Triggers</div><div className="ss-sub">Choose which automated emails to send customers</div></div>
        <div className="ss-body">
          {[
            { label:'Order Confirmation Email',           sub:'Sent immediately after a successful order is placed', on:true },
            { label:'Shipping Dispatch Email',            sub:'Sent when order is handed to courier with tracking link', on:true },
            { label:'Delivery Confirmation Email',        sub:'Sent when order is marked as delivered', on:true },
            { label:'Abandoned Cart Recovery (2hr delay)',sub:'Remind customers who left items in cart without purchasing', on:false },
            { label:'Review Request Email (3 days after delivery)', sub:'Encourage customers to leave a product review', on:true },
            { label:'Weekly Newsletter',                  sub:'Send weekly product highlights and offers to subscribers', on:false },
          ].map(t => (
            <div key={t.label} className="toggle-row">
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Email Triggers</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">SMS Configuration (via MSG91)</div><div className="ss-sub">WhatsApp & SMS notifications for order updates</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">SMS Provider</label><select className="form-select"><option>MSG91</option><option>Twilio</option><option>Exotel</option></select></div>
            <div className="form-group"><label className="form-label">Sender ID</label><input className="form-input" defaultValue="LTLLOT"/></div>
            <div className="form-group span-2"><label className="form-label">MSG91 Auth Key</label><input className="form-input" type="password" defaultValue="••••••••••••••••••••"/></div>
          </div>
          {[
            { label:'Order Confirmation SMS',   sub:'Send SMS on every new order', on:true },
            { label:'Dispatch Notification SMS',sub:'Send SMS with tracking link when shipped', on:true },
            { label:'WhatsApp Order Updates',   sub:'Send WhatsApp messages via MSG91 API', on:false },
          ].map(t => (
            <div key={t.label} className="toggle-row" style={{ marginTop: t === undefined ? 10 : 0 }}>
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save SMS Config</button><button className="btn btn-ghost">📱 Send Test SMS</button></div>
      </div>
    </>
  )
}

/* ── APPEARANCE ── */
const SWATCHES = ['#FF6B5B','#3ECFB2','#FFD336','#5BBEF5','#C7A4F5','#FF9500']

function Appearance() {
  const [activeSwatch, setActiveSwatch] = useState('#FF6B5B')
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Brand & Colours</div><div className="ss-sub">Customize your store's visual identity</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Primary Accent Colour</label>
              <div className="color-swatches">
                {SWATCHES.map(c => (
                  <div key={c} className={`swatch${activeSwatch === c ? ' active' : ''}`} style={{ background: c }} onClick={() => setActiveSwatch(c)} />
                ))}
              </div>
            </div>
            <div className="form-group"><label className="form-label">Store Theme</label>
              <select className="form-select"><option>☀️ Playful Light (Default)</option><option>🤍 Clean White</option><option>🌙 Dark Mode</option></select>
            </div>
            <div className="form-group"><label className="form-label">Font Family</label>
              <select className="form-select"><option>Nunito (Current)</option><option>Poppins</option><option>Inter</option><option>DM Sans</option></select>
            </div>
            <div className="form-group"><label className="form-label">Border Radius Style</label>
              <select className="form-select"><option>Rounded (Current)</option><option>Soft</option><option>Square</option></select>
            </div>
            <div className="form-group"><label className="form-label">Logo URL</label><input className="form-input" placeholder="https://littleloot.in/logo.svg"/></div>
            <div className="form-group"><label className="form-label">Favicon URL</label><input className="form-input" placeholder="https://littleloot.in/favicon.ico"/></div>
            <div className="form-group span-2"><label className="form-label">Custom CSS (advanced)</label>
              <textarea className="form-textarea" placeholder="/* Add custom storefront CSS here */" style={{ fontFamily:'monospace', fontSize:'.78rem', minHeight:80 }} />
            </div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Appearance</button><button className="btn btn-ghost">👁 Preview Store</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Layout & Display</div><div className="ss-sub">Control how products and pages appear to customers</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Products Per Page</label><select className="form-select"><option>12</option><option>24</option><option>48</option></select></div>
            <div className="form-group"><label className="form-label">Default Product Sort</label><select className="form-select"><option>Newest First</option><option>Price: Low to High</option><option>Best Selling</option></select></div>
            <div className="form-group"><label className="form-label">Default Product View</label><select className="form-select"><option>Grid (3 columns)</option><option>Grid (4 columns)</option><option>List View</option></select></div>
            <div className="form-group"><label className="form-label">Homepage Hero Style</label><select className="form-select"><option>Fullwidth Banner</option><option>Split Layout</option><option>Carousel</option></select></div>
          </div>
          {[
            { label:'Show Out-of-Stock Products',  sub:'Display products even when stock is zero', on:true },
            { label:'Show Price Before Discount',  sub:'Display original price crossed out alongside sale price', on:true },
            { label:'Enable Product Quick View',   sub:'Allow customers to view product details in a modal popup', on:true },
            { label:'Enable Wishlist',             sub:'Let customers save products to a wishlist', on:true },
          ].map(t => (
            <div key={t.label} className="toggle-row">
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Layout</button></div>
      </div>
    </>
  )
}

/* ── SECURITY ── */
function Security() {
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Admin Account Security</div><div className="ss-sub">Manage password, 2FA and active sessions</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" placeholder="Enter current password"/></div>
            <div className="form-group" style={{ alignSelf:'end' }}><button className="btn btn-outline" style={{ width:'100%' }}>🔑 Change Password</button></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="Min. 12 characters"/></div>
            <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" placeholder="Repeat new password"/></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">🔐 Update Password</button></div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Two-Factor Authentication (2FA)</div><div className="ss-sub">Add an extra layer of protection to your admin account</div></div>
        <div className="ss-body">
          <div style={{ display:'flex', alignItems:'center', gap:16, padding:14, background:'var(--mint-light)', borderRadius:'var(--r-sm)', border:'1.5px solid #B0EAE0', marginBottom:16 }}>
            <div style={{ fontSize:28 }}>🔒</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'.85rem', fontWeight:800, color:'#1A7060' }}>2FA is not enabled</div>
              <div style={{ fontSize:'.74rem', fontWeight:600, color:'#2A9080', marginTop:2 }}>We strongly recommend enabling 2FA to protect your store</div>
            </div>
            <button className="btn btn-primary btn-sm">Enable 2FA →</button>
          </div>
          {[
            { label:'Authenticator App (TOTP)', sub:'Google Authenticator, Authy or any TOTP app', on:false },
            { label:'Email OTP on Login',       sub:'Send a one-time code to hello@littleloot.in on every login', on:true },
          ].map(t => (
            <div key={t.label} className="toggle-row">
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Login & Access</div><div className="ss-sub">Control admin access policies</div></div>
        <div className="ss-body">
          {[
            { label:'Auto-logout After 30 Minutes', sub:'Terminate session if no activity for 30 minutes', on:true },
            { label:'Login Attempt Alerts',          sub:'Email alert after 5 failed login attempts', on:true },
            { label:'Restrict to India IP Only',     sub:'Block admin logins from non-Indian IP addresses', on:false },
          ].map(t => (
            <div key={t.label} className="toggle-row">
              <div className="tr-info"><div className="tr-name">{t.label}</div><div className="tr-sub">{t.sub}</div></div>
              <Toggle defaultChecked={t.on} />
            </div>
          ))}
        </div>
        <div className="ss-footer">
          <button className="btn btn-primary">💾 Save Security Settings</button>
          <button className="btn btn-danger">🚪 Sign Out All Devices</button>
        </div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Active Sessions</div><div className="ss-sub">Devices currently logged into your admin panel</div></div>
        <div className="ss-body">
          <ShippingZone icon="💻" name="Chrome · Windows · Hyderabad, IN" detail="Current session · Last active just now" pill="This device" pillCls="pill-green" action={null} />
          <ShippingZone icon="📱" name="Safari · iPhone · Hyderabad, IN" detail="Last active 2 hours ago" pill="" pillCls="" action={<button className="btn btn-danger btn-xs">Revoke</button>} />
        </div>
      </div>
    </>
  )
}

/* ── INTEGRATIONS ── */
function Integrations() {
  const APPS = [
    { icon:'📊', name:'Google Analytics 4',     detail:'Measurement ID: G-XXXXXXXX · Tracking active', pill:'Connected', pillCls:'pill-green', action:<button className="btn btn-outline btn-xs">⚙️</button> },
    { icon:'📸', name:'Meta Pixel (Facebook)',   detail:'Pixel ID: 123456789 · Events firing',           pill:'Connected', pillCls:'pill-green', action:<button className="btn btn-outline btn-xs">⚙️</button> },
    { icon:'🚚', name:'Shiprocket',              detail:'Auto order sync enabled · API v2',              pill:'Connected', pillCls:'pill-green', action:<button className="btn btn-outline btn-xs">⚙️</button> },
    { icon:'📦', name:'Tally ERP / Busy',        detail:'Accounting sync · Not connected',               pill:'Inactive',  pillCls:'pill-grey',  action:<button className="btn btn-primary btn-xs">➕ Connect</button> },
    { icon:'💬', name:'WhatsApp Business API',   detail:'Order updates & customer support',              pill:'Inactive',  pillCls:'pill-grey',  action:<button className="btn btn-primary btn-xs">➕ Connect</button> },
    { icon:'📧', name:'Mailchimp',               detail:'Email marketing campaigns',                     pill:'Inactive',  pillCls:'pill-grey',  action:<button className="btn btn-primary btn-xs">➕ Connect</button> },
  ]
  return (
    <>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">Connected Integrations</div><div className="ss-sub">Apps and services connected to your Little Loot store</div></div>
        <div className="ss-body">
          {APPS.map(a => <ShippingZone key={a.name} icon={a.icon} name={a.name} detail={a.detail} pill={a.pill} pillCls={a.pillCls} action={a.action} />)}
        </div>
      </div>
      <div className="settings-section">
        <div className="ss-head"><div className="ss-title">API & Webhooks</div><div className="ss-sub">Developer access and outgoing webhook configuration</div></div>
        <div className="ss-body">
          <div className="form-grid form-grid-2">
            <div className="form-group span-2">
              <label className="form-label">Store API Key (read-only)</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="form-input" readOnly defaultValue="ll_live_••••••••••••••••••••••••" style={{ background:'var(--soft-2)', color:'var(--muted)', flex:1 }}/>
                <button className="btn btn-outline">📋 Copy</button>
                <button className="btn btn-danger btn-sm">🔄 Regenerate</button>
              </div>
            </div>
            <div className="form-group span-2"><label className="form-label">Webhook Endpoint URL</label><input className="form-input" placeholder="https://yourapp.com/webhooks/littleloot"/></div>
            <div className="form-group">
              <label className="form-label">Webhook Events</label>
              <select className="form-select" multiple style={{ height:90 }}>
                <option>order.created</option>
                <option>order.shipped</option>
                <option>order.cancelled</option>
                <option>product.stock_low</option>
                <option>review.submitted</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Webhook Secret</label><input className="form-input" type="password" defaultValue="whsec_••••••••••••••••"/></div>
          </div>
        </div>
        <div className="ss-footer"><button className="btn btn-primary">💾 Save Webhook</button><button className="btn btn-ghost">📡 Send Test Event</button></div>
      </div>
    </>
  )
}

const PANEL_MAP: Record<SettingsTab, React.ReactNode> = {
  storeinfo:    <StoreInfo />,
  shipping:     <Shipping />,
  payments:     <Payments />,
  email:        <EmailSMS />,
  appearance:   <Appearance />,
  security:     <Security />,
  integrations: <Integrations />,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('storeinfo')
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Settings</div>
          <div className="ph-sub">Manage store configuration and preferences</div>
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-sidenav">
          {TABS.map(t => (
            <div key={t.id} className={`ssn-item${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <em>{t.icon}</em> {t.label}
            </div>
          ))}
        </div>
        <div className="settings-content">
          {PANEL_MAP[activeTab]}
        </div>
      </div>
    </div>
  )
}
