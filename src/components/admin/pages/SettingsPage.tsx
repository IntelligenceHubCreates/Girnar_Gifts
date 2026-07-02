'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchStoreSettings, updateStoreSettings,
  fetchProfile, updateProfile, uploadAvatar, changePassword,
  fetchIntegrationsStatus, uploadStoreLogo,
  type AdminProfile, type IntegrationsStatus,
} from '@/lib/adminApi'

type SettingsTab = 'profile' | 'store' | 'orders' | 'shipping' | 'payments' | 'notifications' | 'security'

const TABS: { id: SettingsTab; icon: string; label: string }[] = [
  { id: 'profile',       icon: '👤', label: 'Profile' },
  { id: 'store',         icon: '🏬', label: 'Store Info' },
  { id: 'orders',        icon: '📦', label: 'Order Settings' },
  { id: 'shipping',      icon: '🚚', label: 'Shipping' },
  { id: 'payments',      icon: '💳', label: 'Payments' },
  { id: 'notifications', icon: '📧', label: 'Notifications' },
  { id: 'security',      icon: '🔒', label: 'Security' },
]

// ── Reusable bits ──────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ts-slider" />
    </label>
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

function SaveBar({ saving, dirty, saved, error, onSave }: {
  saving: boolean; dirty: boolean; saved: boolean; error: string | null; onSave: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 16 }}>
      {error && <span style={{ color: 'var(--coral)', fontWeight: 700, fontSize: '.82rem', marginRight: 'auto' }}>⚠️ {error}</span>}
      {!error && saved && <span style={{ color: 'var(--mint)', fontWeight: 700, fontSize: '.82rem' }}>✅ Saved</span>}
      {!error && !saved && dirty && <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>Unsaved changes</span>}
      <button className="btn btn-primary" disabled={saving || !dirty} onClick={onSave}>
        {saving ? '⏳ Saving…' : '💾 Save Changes'}
      </button>
    </div>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Toggle checked={checked} onChange={onChange} />
      <div>
        <div className="form-label" style={{ margin: 0 }}>{label}</div>
        {hint && <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{hint}</div>}
      </div>
    </div>
  )
}

function SecurityWarning({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFF8E6', border: '1px solid #F0C36D', borderRadius: 8, padding: '10px 14px', fontSize: '.78rem', color: '#8A6D1B', display: 'flex', gap: 8, marginBottom: 14 }}>
      <span>🔐</span><div>{children}</div>
    </div>
  )
}

function IntegrationStatusRow({ name, ok, envHint }: { name: string; ok: boolean; envHint: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '.84rem' }}>{name}</div>
        <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{envHint}</div>
      </div>
      <span style={{ fontWeight: 800, fontSize: '.78rem', color: ok ? '#15803d' : '#dc2626' }}>
        {ok ? '✅ Configured' : '❌ Not configured'}
      </span>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Store settings
  const { data: loadedSettings, loading: settingsLoading, error: settingsError, refetch: refetchSettings } = useAdminFetch(fetchStoreSettings, [])
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [baseline, setBaseline] = useState<Record<string, any>>({})
  const [savingStore, setSavingStore] = useState(false)
  const [storeSaved, setStoreSaved] = useState(false)
  const [storeError, setStoreError] = useState<string | null>(null)

  useEffect(() => {
    if (loadedSettings) {
      setSettings(loadedSettings as Record<string, any>)
      setBaseline(loadedSettings as Record<string, any>)
    }
  }, [loadedSettings])

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(baseline),
    [settings, baseline],
  )

  function set(key: string, value: any) {
    setSettings((p) => ({ ...p, [key]: value }))
    setStoreSaved(false)
  }

  async function saveStore() {
    setSavingStore(true); setStoreError(null); setStoreSaved(false)
    try {
      const fresh = await updateStoreSettings(settings)
      setSettings(fresh as Record<string, any>)
      setBaseline(fresh as Record<string, any>)
      setStoreSaved(true)
      setTimeout(() => setStoreSaved(false), 3000)
    } catch (err: any) {
      setStoreError(err.message ?? 'Save failed')
    } finally {
      setSavingStore(false)
    }
  }

  // Profile
  const { data: profileData, loading: profileLoading, error: profileError, refetch: refetchProfile } = useAdminFetch(fetchProfile, [])
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
      setProfileName(profileData.name ?? '')
      setProfilePhone(profileData.phone ?? '')
    }
  }, [profileData])

  const profileDirty = profile && (profileName !== (profile.name ?? '') || profilePhone !== (profile.phone ?? ''))

  async function saveProfile() {
    setSavingProfile(true); setProfileSaveError(null); setProfileSaved(false)
    try {
      const fresh = await updateProfile({ name: profileName, phone: profilePhone })
      setProfile(fresh)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err: any) {
      setProfileSaveError(err.message ?? 'Save failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatar(file: File) {
    setUploadingAvatar(true); setProfileSaveError(null)
    try {
      const { url, profile_picture } = await uploadAvatar(file)
      setProfile((p) => p ? { ...p, profile_picture: profile_picture ?? url } : p)
    } catch (err: any) {
      setProfileSaveError(err.message ?? 'Avatar upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleLogo(file: File) {
    setStoreError(null)
    try {
      const { url } = await uploadStoreLogo(file)
      set('store_logo', url)
      // logo is persisted server-side immediately; sync baseline for this key
      setBaseline((b) => ({ ...b, store_logo: url }))
      setSettings((s) => ({ ...s, store_logo: url }))
    } catch (err: any) {
      setStoreError(err.message ?? 'Logo upload failed')
    }
  }

  // Change password
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleChangePassword() {
    setPwMsg(null)
    if (pwNew.length < 8) { setPwMsg({ type: 'err', text: 'New password must be at least 8 characters' }); return }
    if (pwNew !== pwConfirm) { setPwMsg({ type: 'err', text: 'New passwords do not match' }); return }
    setPwSaving(true)
    try {
      await changePassword(pwOld, pwNew)
      setPwMsg({ type: 'ok', text: '✅ Password changed successfully' })
      setPwOld(''); setPwNew(''); setPwConfirm('')
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.message ?? 'Could not change password' })
    } finally {
      setPwSaving(false)
    }
  }

  // Integrations status (read-only)
  const { data: integrations } = useAdminFetch<IntegrationsStatus>(fetchIntegrationsStatus, [])

  const s = settings
  const roleLabel = profile?.role === 1 ? 'Administrator' : profile?.role != null ? `Role ${profile.role}` : '—'

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Settings</div>
          <div className="ph-sub">Profile, store preferences & integrations</div>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-nav">
          {TABS.map((t) => (
            <button key={t.id} className={`sn-item${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Admin Profile</div><div className="ss-sub">Your account identity and password</div></div>
              <div className="ss-body">
                {profileLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 36, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 12 }} />)
                ) : profileError ? (
                  <div style={{ color: 'var(--coral)' }}>⚠️ {profileError} <button className="btn btn-outline btn-sm" onClick={refetchProfile}>Retry</button></div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--soft-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                        {profile?.profile_picture
                          ? <img src={profile.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (profile?.name || profile?.email || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <input type="file" accept="image/*" disabled={uploadingAvatar}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f) }} />
                        {uploadingAvatar && <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 4 }}>⏳ Uploading…</div>}
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <Field label="Name"><input className="form-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} /></Field>
                      <Field label="Email (display only)" hint="Login email — change requires re-verification">
                        <input className="form-input" value={profile?.email ?? ''} disabled style={{ opacity: 0.7 }} />
                      </Field>
                      <Field label="Phone"><input className="form-input" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} /></Field>
                      <Field label="Role"><input className="form-input" value={roleLabel} disabled style={{ opacity: 0.7 }} /></Field>
                    </div>
                    <SaveBar saving={savingProfile} dirty={!!profileDirty} saved={profileSaved} error={profileSaveError} onSave={saveProfile} />

                    {/* Change password */}
                    <div className="ss-head" style={{ marginTop: 24 }}><div className="ss-title" style={{ fontSize: '.95rem' }}>Change Password</div><div className="ss-sub">Only for email/password accounts (not Google sign-in)</div></div>
                    <div className="form-grid form-grid-2" style={{ marginTop: 10 }}>
                      <Field label="Current Password"><input className="form-input" type="password" value={pwOld} onChange={(e) => setPwOld(e.target.value)} /></Field>
                      <div />
                      <Field label="New Password" hint="Min 8 characters"><input className="form-input" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} /></Field>
                      <Field label="Confirm New Password"><input className="form-input" type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} /></Field>
                    </div>
                    {pwMsg && <div style={{ fontSize: '.82rem', fontWeight: 700, color: pwMsg.type === 'ok' ? 'var(--mint)' : 'var(--coral)', marginTop: 6 }}>{pwMsg.text}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button className="btn btn-outline" disabled={pwSaving || !pwOld || !pwNew} onClick={handleChangePassword}>
                        {pwSaving ? '⏳ Updating…' : '🔑 Update Password'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STORE ── */}
          {activeTab === 'store' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Store Information</div><div className="ss-sub">Public identity, contact, branding & tracking</div></div>
              <div className="ss-body">
                {settingsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 36, background: 'var(--soft-2)', borderRadius: 8, marginBottom: 12 }} />)
                ) : settingsError ? (
                  <div style={{ color: 'var(--coral)' }}>⚠️ {settingsError} <button className="btn btn-outline btn-sm" onClick={refetchSettings}>Retry</button></div>
                ) : (
                  <>
                    <Field label="Store Logo">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {s.store_logo ? <img src={s.store_logo} alt="" style={{ height: 44, borderRadius: 8, border: '1px solid var(--border)' }} /> : <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>No logo</span>}
                        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f) }} />
                      </div>
                    </Field>
                    <div className="form-grid form-grid-2">
                      <Field label="Store Name"><input className="form-input" value={s.store_name ?? ''} onChange={(e) => set('store_name', e.target.value)} /></Field>
                      <Field label="Store URL"><input className="form-input" value={s.store_url ?? ''} onChange={(e) => set('store_url', e.target.value)} /></Field>
                      <Field label="Contact Email"><input className="form-input" type="email" value={s.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} /></Field>
                      <Field label="Support Phone"><input className="form-input" value={s.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} /></Field>
                      <Field label="Store Address"><input className="form-input" value={s.store_address ?? ''} onChange={(e) => set('store_address', e.target.value)} /></Field>
                      <Field label="GST Number"><input className="form-input" value={s.gst_number ?? ''} onChange={(e) => set('gst_number', e.target.value)} /></Field>
                      <Field label="Currency">
                        <select className="form-select" value={s.currency ?? 'INR'} onChange={(e) => set('currency', e.target.value)}>
                          <option value="INR">Indian Rupee (₹ INR)</option>
                        </select>
                      </Field>
                      <Field label="Time Zone">
                        <select className="form-select" value={s.timezone ?? 'Asia/Kolkata'} onChange={(e) => set('timezone', e.target.value)}>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                          <option value="UTC">UTC +0:00</option>
                        </select>
                      </Field>
                    </div>

                    <div className="ss-head" style={{ marginTop: 18 }}><div className="ss-title" style={{ fontSize: '.95rem' }}>Social Links</div></div>
                    <div className="form-grid form-grid-2" style={{ marginTop: 10 }}>
                      <Field label="Instagram"><input className="form-input" value={s.social_instagram ?? ''} onChange={(e) => set('social_instagram', e.target.value)} placeholder="https://instagram.com/…" /></Field>
                      <Field label="Facebook"><input className="form-input" value={s.social_facebook ?? ''} onChange={(e) => set('social_facebook', e.target.value)} placeholder="https://facebook.com/…" /></Field>
                      <Field label="YouTube"><input className="form-input" value={s.social_youtube ?? ''} onChange={(e) => set('social_youtube', e.target.value)} placeholder="https://youtube.com/…" /></Field>
                    </div>

                    <div className="ss-head" style={{ marginTop: 18 }}><div className="ss-title" style={{ fontSize: '.95rem' }}>Analytics & Tracking</div><div className="ss-sub">Public site-wide IDs (safe to store)</div></div>
                    <div className="form-grid form-grid-2" style={{ marginTop: 10 }}>
                      <Field label="Google Analytics ID"><input className="form-input" value={s.ga_id ?? ''} onChange={(e) => set('ga_id', e.target.value)} placeholder="G-XXXXXXXXXX" /></Field>
                      <Field label="Facebook Pixel ID"><input className="form-input" value={s.fb_pixel ?? ''} onChange={(e) => set('fb_pixel', e.target.value)} placeholder="123456789" /></Field>
                    </div>

                    <SaveBar saving={savingStore} dirty={dirty} saved={storeSaved} error={storeError} onSave={saveStore} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── ORDER SETTINGS ── */}
          {activeTab === 'orders' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Order Settings</div><div className="ss-sub">Order numbering & inventory thresholds</div></div>
              <div className="ss-body">
                {settingsLoading ? <div style={{ height: 120, background: 'var(--soft-2)', borderRadius: 8 }} /> : (
                  <>
                    <div className="form-grid form-grid-2">
                      <Field label="Order Number Prefix" hint="Shown on order IDs"><input className="form-input" value={s.order_prefix ?? 'LL'} onChange={(e) => set('order_prefix', e.target.value)} /></Field>
                      <Field label="Invoice Prefix"><input className="form-input" value={s.invoice_prefix ?? 'INV'} onChange={(e) => set('invoice_prefix', e.target.value)} /></Field>
                      <Field label="Low Stock Threshold" hint="Alert when stock ≤ this value">
                        <input className="form-input" type="number" min={0} value={s.low_stock_threshold ?? 10} onChange={(e) => set('low_stock_threshold', Number(e.target.value))} />
                      </Field>
                    </div>
                    <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 6 }}>
                      ℹ️ These preferences are saved. Auto-confirm and cancellation-rule workflows require additional backend logic (see contract).
                    </div>
                    <SaveBar saving={savingStore} dirty={dirty} saved={storeSaved} error={storeError} onSave={saveStore} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── SHIPPING ── */}
          {activeTab === 'shipping' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Shipping Settings</div><div className="ss-sub">Delivery rates & thresholds</div></div>
              <div className="ss-body">
                {settingsLoading ? <div style={{ height: 120, background: 'var(--soft-2)', borderRadius: 8 }} /> : (
                  <>
                    <div className="form-grid form-grid-2">
                      <Field label="Free Shipping Threshold (₹)" hint="Orders above this ship free">
                        <input className="form-input" type="number" min={0} value={s.free_shipping_threshold ?? 999} onChange={(e) => set('free_shipping_threshold', Number(e.target.value))} />
                      </Field>
                      <Field label="Default Shipping Rate (₹)">
                        <input className="form-input" type="number" min={0} value={s.default_shipping_rate ?? 49} onChange={(e) => set('default_shipping_rate', Number(e.target.value))} />
                      </Field>
                      <Field label="Estimated Delivery (days)">
                        <input className="form-input" type="number" min={0} value={s.estimated_delivery_days ?? 5} onChange={(e) => set('estimated_delivery_days', Number(e.target.value))} />
                      </Field>
                    </div>
                    <ToggleRow label="Enable Cash on Delivery (COD)" checked={s.cod_enabled ?? true} onChange={(v) => set('cod_enabled', v)} />
                    <SaveBar saving={savingStore} dirty={dirty} saved={storeSaved} error={storeError} onSave={saveStore} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {activeTab === 'payments' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Payment Methods</div><div className="ss-sub">Enable gateways & view integration status</div></div>
              <div className="ss-body">
                <SecurityWarning>
                  Payment <strong>secret keys</strong> are never editable here and are never sent to the browser. They are configured as environment variables on the server. This page only shows whether they are configured.
                </SecurityWarning>

                {settingsLoading ? <div style={{ height: 120, background: 'var(--soft-2)', borderRadius: 8 }} /> : (
                  <>
                    <ToggleRow label="UPI / PhonePe / GPay" hint="Accept UPI payments" checked={s.upi_enabled ?? true} onChange={(v) => set('upi_enabled', v)} />
                    <ToggleRow label="Debit & Credit Cards" hint="Via Razorpay" checked={s.card_enabled ?? true} onChange={(v) => set('card_enabled', v)} />
                    <ToggleRow label="Net Banking" checked={s.netbanking_enabled ?? true} onChange={(v) => set('netbanking_enabled', v)} />
                    <ToggleRow label="Wallets" checked={s.wallet_enabled ?? true} onChange={(v) => set('wallet_enabled', v)} />
                    <ToggleRow label="Cash on Delivery" checked={s.cod_enabled ?? true} onChange={(v) => set('cod_enabled', v)} />
                    <SaveBar saving={savingStore} dirty={dirty} saved={storeSaved} error={storeError} onSave={saveStore} />
                  </>
                )}

                <div className="ss-head" style={{ marginTop: 20 }}><div className="ss-title" style={{ fontSize: '.95rem' }}>Gateway Status</div></div>
                <div style={{ marginTop: 10 }}>
                  <IntegrationStatusRow name="Razorpay" ok={!!integrations?.razorpay} envHint="RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET" />
                  <IntegrationStatusRow name="Cloudinary (media)" ok={!!integrations?.cloudinary} envHint="CLOUDINARY_* environment variables" />
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Notifications</div><div className="ss-sub">Transactional message preferences</div></div>
              <div className="ss-body">
                {settingsLoading ? <div style={{ height: 120, background: 'var(--soft-2)', borderRadius: 8 }} /> : (
                  <>
                    <ToggleRow label="Order confirmation to customer" checked={s.notify_order_placed ?? true} onChange={(v) => set('notify_order_placed', v)} />
                    <ToggleRow label="Shipping notification to customer" checked={s.notify_order_shipped ?? true} onChange={(v) => set('notify_order_shipped', v)} />
                    <ToggleRow label="Alert admin on new order" checked={s.notify_admin_new_order ?? true} onChange={(v) => set('notify_admin_new_order', v)} />
                    <ToggleRow label="Low stock alerts to admin" checked={s.notify_low_stock ?? true} onChange={(v) => set('notify_low_stock', v)} />
                    <ToggleRow label="New customer signup alerts" checked={s.notify_customer_signup ?? true} onChange={(v) => set('notify_customer_signup', v)} />
                    <Field label="WhatsApp Business Number" hint="For order notifications (when WhatsApp integration is enabled)">
                      <input className="form-input" value={s.whatsapp_number ?? ''} onChange={(e) => set('whatsapp_number', e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                    <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 6 }}>
                      ℹ️ Preferences are saved. Email/WhatsApp delivery requires a configured messaging service on the server.
                    </div>
                    <SaveBar saving={savingStore} dirty={dirty} saved={storeSaved} error={storeError} onSave={saveStore} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="ss-head"><div className="ss-title">Security</div><div className="ss-sub">Account access</div></div>
              <div className="ss-body">
                <Field label="Account Role"><input className="form-input" value={roleLabel} disabled style={{ opacity: 0.7 }} /></Field>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, marginTop: 8, opacity: 0.7 }}>
                  <span style={{ fontSize: 18 }}>🛡️</span>
                  <div style={{ flex: 1 }}>
                    <div className="form-label" style={{ margin: 0 }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Coming soon — not yet available</div>
                  </div>
                  <span className="pill" style={{ background: 'var(--soft-2)', color: 'var(--muted)', fontSize: '.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>SOON</span>
                </div>

                <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 12 }}>
                  To change your password, use the <strong>Profile</strong> tab. Session management (last-login history, log-out-all-devices) is not available in this build.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}