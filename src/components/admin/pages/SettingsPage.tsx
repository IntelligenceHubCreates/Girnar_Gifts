'use client'

import { useState, useEffect } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchStoreSettings, updateStoreSettings } from '@/lib/adminApi'

type SettingsTab = 'storeinfo' | 'shipping' | 'payments' | 'email' | 'appearance' | 'security' | 'integrations'

const TABS: { id: SettingsTab; icon: string; label: string }[] = [
  { id: 'storeinfo',    icon: '🏬', label: 'Store Info' },
  { id: 'shipping',     icon: '🚚', label: 'Shipping' },
  { id: 'payments',     icon: '💳', label: 'Payments' },
  { id: 'email',        icon: '📧', label: 'Email & SMS' },
  { id: 'appearance',   icon: '🎨', label: 'Appearance' },
  { id: 'security',     icon: '🔒', label: 'Security' },
  { id: 'integrations', icon: '🔗', label: 'Integrations' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ts-slider" />
    </label>
  )
}

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 16 }}>
      {saved && <span style={{ color: 'var(--mint)', fontWeight: 700, fontSize: '.82rem', alignSelf: 'center' }}>✅ Saved successfully</span>}
      <button className="btn btn-primary" disabled={saving} onClick={onSave}>
        {saving ? '⏳ Saving…' : '💾 Save Changes'}
      </button>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {hint && <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: 4 }}>{hint}</div>}
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('storeinfo')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data, loading } = useAdminFetch(fetchStoreSettings, [])

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  function set(key: string, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setSaveError(null); setSaved(false)
    try {
      await updateStoreSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const s = settings

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Settings</div>
          <div className="ph-sub">Store preferences & integrations</div>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-nav">
          {TABS.map((t) => (
            <button key={t.id} className={`sn-item${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="card" style={{ padding: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 36, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 12 }} />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'storeinfo' && (
                <div className="settings-section">
                  <div className="ss-head">
                    <div className="ss-title">Store Information</div>
                    <div className="ss-sub">Your store's public-facing identity and contact details</div>
                  </div>
                  <div className="ss-body">
                    <div className="form-grid form-grid-2">
                      <Field label="Store Name"><input className="form-input" value={s.store_name ?? 'Little Loot'} onChange={(e) => set('store_name', e.target.value)} /></Field>
                      <Field label="Store URL"><input className="form-input" value={s.store_url ?? 'littleloot.in'} onChange={(e) => set('store_url', e.target.value)} /></Field>
                      <Field label="Contact Email"><input className="form-input" type="email" value={s.contact_email ?? 'hello@littleloot.in'} onChange={(e) => set('contact_email', e.target.value)} /></Field>
                      <Field label="Support Phone"><input className="form-input" value={s.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} /></Field>
                      <Field label="Store Address" ><input className="form-input" value={s.store_address ?? ''} onChange={(e) => set('store_address', e.target.value)} /></Field>
                      <Field label="GST Number"><input className="form-input" value={s.gst_number ?? ''} onChange={(e) => set('gst_number', e.target.value)} /></Field>
                      <Field label="Currency">
                        <select className="form-select" value={s.currency ?? 'INR'} onChange={(e) => set('currency', e.target.value)}>
                          <option value="INR">Indian Rupee (₹ INR)</option>
                          <option value="USD">US Dollar ($ USD)</option>
                        </select>
                      </Field>
                      <Field label="Time Zone">
                        <select className="form-select" value={s.timezone ?? 'Asia/Kolkata'} onChange={(e) => set('timezone', e.target.value)}>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                          <option value="UTC">UTC +0:00</option>
                        </select>
                      </Field>
                    </div>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem', marginTop: 8 }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Shipping Settings</div><div className="ss-sub">Delivery zones, rates & carrier integrations</div></div>
                  <div className="ss-body">
                    <div className="form-grid form-grid-2">
                      <Field label="Free Shipping Threshold (₹)" hint="Orders above this get free shipping">
                        <input className="form-input" type="number" value={s.free_shipping_threshold ?? 999} onChange={(e) => set('free_shipping_threshold', Number(e.target.value))} />
                      </Field>
                      <Field label="Default Shipping Rate (₹)">
                        <input className="form-input" type="number" value={s.default_shipping_rate ?? 49} onChange={(e) => set('default_shipping_rate', Number(e.target.value))} />
                      </Field>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <Toggle checked={s.cod_enabled ?? true} onChange={(v) => set('cod_enabled', v)} />
                      <label className="form-label" style={{ margin: 0 }}>Enable Cash on Delivery (COD)</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Toggle checked={s.express_shipping ?? false} onChange={(v) => set('express_shipping', v)} />
                      <label className="form-label" style={{ margin: 0 }}>Enable Express Shipping option</label>
                    </div>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Payment Methods</div><div className="ss-sub">Enable or disable payment gateways</div></div>
                  <div className="ss-body">
                    {[
                      { key: 'upi_enabled',       label: 'UPI / PhonePe / GPay', hint: 'Accept UPI payments directly' },
                      { key: 'card_enabled',       label: 'Debit & Credit Cards',  hint: 'Via Razorpay gateway' },
                      { key: 'netbanking_enabled', label: 'Net Banking',           hint: 'All major banks' },
                      { key: 'cod_enabled',        label: 'Cash on Delivery',      hint: 'Pay when delivered' },
                      { key: 'wallet_enabled',     label: 'Wallets (Paytm, etc.)', hint: 'Digital wallet payments' },
                    ].map((p) => (
                      <div key={p.key} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Toggle checked={s[p.key] ?? true} onChange={(v) => set(p.key, v)} />
                        <div>
                          <div className="form-label" style={{ margin: 0 }}>{p.label}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{p.hint}</div>
                        </div>
                      </div>
                    ))}
                    <Field label="Razorpay Key ID" hint="Get from Razorpay dashboard">
                      <input className="form-input" type="password" value={s.razorpay_key_id ?? ''} onChange={(e) => set('razorpay_key_id', e.target.value)} placeholder="rzp_live_…" />
                    </Field>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Email & SMS Notifications</div><div className="ss-sub">Configure transactional messages</div></div>
                  <div className="ss-body">
                    <div className="form-grid form-grid-2">
                      <Field label="SMTP Host"><input className="form-input" value={s.smtp_host ?? ''} onChange={(e) => set('smtp_host', e.target.value)} placeholder="smtp.sendgrid.net" /></Field>
                      <Field label="SMTP Port"><input className="form-input" value={s.smtp_port ?? 587} onChange={(e) => set('smtp_port', e.target.value)} /></Field>
                      <Field label="From Email"><input className="form-input" type="email" value={s.from_email ?? 'noreply@littleloot.in'} onChange={(e) => set('from_email', e.target.value)} /></Field>
                      <Field label="From Name"><input className="form-input" value={s.from_name ?? 'Little Loot'} onChange={(e) => set('from_name', e.target.value)} /></Field>
                    </div>
                    {[
                      { key: 'notify_order_placed',    label: 'Order confirmation email to customer' },
                      { key: 'notify_order_shipped',   label: 'Shipping notification email' },
                      { key: 'notify_admin_new_order', label: 'Alert admin on new order' },
                      { key: 'notify_low_stock',       label: 'Low stock alerts to admin' },
                    ].map((n) => (
                      <div key={n.key} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Toggle checked={s[n.key] ?? true} onChange={(v) => set(n.key, v)} />
                        <label className="form-label" style={{ margin: 0 }}>{n.label}</label>
                      </div>
                    ))}
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Appearance</div><div className="ss-sub">Customise your storefront visual identity</div></div>
                  <div className="ss-body">
                    <div className="form-grid form-grid-2">
                      <Field label="Primary Colour"><input className="form-input" type="color" value={s.primary_color ?? '#FF6B6B'} onChange={(e) => set('primary_color', e.target.value)} /></Field>
                      <Field label="Accent Colour"><input className="form-input" type="color" value={s.accent_color ?? '#4ECDC4'} onChange={(e) => set('accent_color', e.target.value)} /></Field>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Toggle checked={s.show_sale_banner ?? true} onChange={(v) => set('show_sale_banner', v)} />
                      <label className="form-label" style={{ margin: 0 }}>Show promotional banner on homepage</label>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Toggle checked={s.dark_mode_support ?? false} onChange={(v) => set('dark_mode_support', v)} />
                      <label className="form-label" style={{ margin: 0 }}>Enable dark mode toggle for customers</label>
                    </div>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Security</div><div className="ss-sub">Admin account & access control</div></div>
                  <div className="ss-body">
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Toggle checked={s.two_factor_auth ?? false} onChange={(v) => set('two_factor_auth', v)} />
                      <div>
                        <div className="form-label" style={{ margin: 0 }}>Two-Factor Authentication (2FA)</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Require OTP for admin login</div>
                      </div>
                    </div>
                    <Field label="Session Timeout (minutes)" hint="Admin will be logged out after inactivity">
                      <input className="form-input" type="number" value={s.session_timeout ?? 60} onChange={(e) => set('session_timeout', Number(e.target.value))} />
                    </Field>
                    <Field label="Allowed Admin IPs" hint="Comma-separated. Leave blank to allow all.">
                      <input className="form-input" value={s.allowed_ips ?? ''} onChange={(e) => set('allowed_ips', e.target.value)} placeholder="192.168.1.1, 10.0.0.1" />
                    </Field>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="settings-section">
                  <div className="ss-head"><div className="ss-title">Integrations</div><div className="ss-sub">Third-party services & APIs</div></div>
                  <div className="ss-body">
                    <Field label="Cloudinary Cloud Name"><input className="form-input" value={s.cloudinary_cloud ?? ''} onChange={(e) => set('cloudinary_cloud', e.target.value)} placeholder="your-cloud-name" /></Field>
                    <Field label="Google Analytics ID"><input className="form-input" value={s.ga_id ?? ''} onChange={(e) => set('ga_id', e.target.value)} placeholder="G-XXXXXXXXXX" /></Field>
                    <Field label="Facebook Pixel ID"><input className="form-input" value={s.fb_pixel ?? ''} onChange={(e) => set('fb_pixel', e.target.value)} placeholder="123456789" /></Field>
                    <Field label="WhatsApp Business Number" hint="For order notifications">
                      <input className="form-input" value={s.whatsapp_number ?? ''} onChange={(e) => set('whatsapp_number', e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                    {saveError && <div style={{ color: 'var(--coral)', fontSize: '.82rem' }}>⚠️ {saveError}</div>}
                    <SaveBar saving={saving} saved={saved} onSave={handleSave} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
