'use client'

import { useState } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchCouriers, createCourier, updateCourier, type CourierPartner } from '@/lib/adminShipmentsApi'

function CourierForm({ initial, onSave, onCancel, busy }:
  { initial?: Partial<CourierPartner>; onSave: (b: Partial<CourierPartner>) => void; onCancel: () => void; busy: boolean }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [service, setService] = useState(initial?.service_type ?? '')
  const [tpl, setTpl] = useState(initial?.tracking_url_template ?? '')
  const [cod, setCod] = useState(initial?.supports_cod ?? true)
  const [active, setActive] = useState(initial?.is_active ?? true)
  return (
    <div className="card" style={{ padding: 12, marginBottom: 12 }}>
      <div className="form-grid form-grid-2">
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Service type</label><input className="form-input" value={service} onChange={e => setService(e.target.value)} placeholder="Surface / Express" /></div>
      </div>
      <div className="form-group"><label className="form-label">Tracking URL template</label>
        <input className="form-input" value={tpl} onChange={e => setTpl(e.target.value)} placeholder="https://courier.com/track/{awb}" />
        <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Use <code>{'{awb}'}</code> where the tracking number goes.</span></div>
      <div style={{ display: 'flex', gap: 16, margin: '8px 0' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '.82rem' }}><input type="checkbox" checked={cod} onChange={e => setCod(e.target.checked)} /> Supports COD</label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '.82rem' }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !name.trim()} onClick={() => onSave({ name: name.trim(), service_type: service.trim() || undefined, tracking_url_template: tpl.trim() || undefined, supports_cod: cod, is_active: active })}>
          {busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

export function CouriersDrawer({ onClose }: { onClose: () => void }) {
  const { data, loading, error, refetch } = useAdminFetch(() => fetchCouriers(), [])
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const rows = data?.data ?? []

  async function run(fn: () => Promise<any>) {
    setBusy(true)
    try { await fn(); await refetch(); setAdding(false); setEditId(null) }
    finally { setBusy(false) }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ width: 560, maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head"><div className="drawer-title">Courier Partners</div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="drawer-body">
          {!adding && <button className="btn btn-outline btn-sm" style={{ marginBottom: 12 }} onClick={() => { setAdding(true); setEditId(null) }}>+ Add courier</button>}
          {adding && <CourierForm busy={busy} onCancel={() => setAdding(false)} onSave={(b) => run(() => createCourier(b))} />}

          {loading ? (
            <>{[1, 2, 3].map(i => <div key={i} className="ll-skeleton" style={{ height: 48, marginBottom: 8 }} />)}</>
          ) : error ? (
            <div className="ll-error">⚠️ {error} <button className="btn btn-outline btn-sm" onClick={refetch}>Retry</button></div>
          ) : rows.length === 0 ? (
            <div className="ll-empty"><div className="ll-empty-icon">🚚</div>No couriers yet</div>
          ) : rows.map(c => (
            editId === c.id ? (
              <CourierForm key={c.id} initial={c} busy={busy} onCancel={() => setEditId(null)} onSave={(b) => run(() => updateCourier(c.id, b))} />
            ) : (
              <div key={c.id} className="card" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '.86rem' }}>{c.name} <span className={`pill ${c.is_active ? 'pill-green' : 'pill-grey'}`} style={{ marginLeft: 6 }}>{c.is_active ? 'Active' : 'Inactive'}</span></div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{c.service_type || '—'}{c.supports_cod ? ' · COD' : ''}{c.tracking_url_template ? ` · ${c.tracking_url_template}` : ''}</div>
                </div>
                <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => { setEditId(c.id); setAdding(false) }}>Edit</button>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => updateCourier(c.id, { is_active: !c.is_active }))}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
              </div>
            )
          ))}
        </div>
        <div className="drawer-foot"><button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}