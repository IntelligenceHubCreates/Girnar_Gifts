'use client'

import { useState, useEffect } from 'react'
import {
  packShipment, assignCourier, uploadLabel, schedulePickup, pickupFailed,
  markPickedUp, setShipmentStatus, recordDeliveryAttempt, initiateRto, receiveRto,
  updateCod, cancelShipment, setShipmentNotes, fetchCouriers,
  SHIP_STATUS_LABEL, FAILURE_REASON_LABEL,
  type ShipmentDetail, type ShipmentSummaryRow, type CourierPartner,
} from '@/lib/adminShipmentsApi'

function inr(n: number | null | undefined): string { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

/* ── Reusable modal shell (System-A) ── */
function ModalShell({ title, width = 460, children, onClose }: { title: string; width?: number; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="drawer-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="drawer ship-modal" style={{ width, maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <div className="drawer-head"><div className="drawer-title">{title}</div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  )
}

/* ── Generic note-capable confirm (cancel / RTO / delivered / lost / damaged) ── */
function NoteConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose, busy }:
  { title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: (note: string) => void; onClose: () => void; busy: boolean }) {
  const [note, setNote] = useState('')
  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.84rem', marginBottom: 12 }}>{message}</div>
        <div className="form-group"><label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={e => setNote(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={() => onConfirm(note.trim())}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}

/* ── 1. Pack ── */
function PackModal({ onConfirm, onClose, busy }: { onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [w, setW] = useState(''); const [l, setL] = useState(''); const [wd, setWd] = useState(''); const [h, setH] = useState('')
  return (
    <ModalShell title="Pack Shipment" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12 }}>Enter package weight & dimensions, then mark packed.</div>
        <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" min={0} step="0.01" value={w} onChange={e => setW(e.target.value)} /></div>
        <div className="form-grid form-grid-2">
          <div className="form-group"><label className="form-label">Length (cm)</label><input className="form-input" type="number" min={0} value={l} onChange={e => setL(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Width (cm)</label><input className="form-input" type="number" min={0} value={wd} onChange={e => setWd(e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Height (cm)</label><input className="form-input" type="number" min={0} value={h} onChange={e => setH(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm({
          package_weight: w ? Number(w) : undefined, package_length: l ? Number(l) : undefined,
          package_width: wd ? Number(wd) : undefined, package_height: h ? Number(h) : undefined,
        })}>{busy ? 'Packing…' : 'Mark Packed'}</button>
      </div>
    </ModalShell>
  )
}

/* ── 2. Assign Courier ── */
function AssignCourierModal({ shipment, onConfirm, onClose, busy }: { shipment: ShipmentDetail; onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [couriers, setCouriers] = useState<CourierPartner[]>([])
  const [partnerId, setPartnerId] = useState(shipment.courier_partner_id ?? '')
  const [name, setName] = useState(shipment.courier_name ?? '')
  const [service, setService] = useState(shipment.courier_service ?? '')
  const [awb, setAwb] = useState(shipment.awb_number ?? '')
  const [cost, setCost] = useState(shipment.shipping_cost != null ? String(shipment.shipping_cost) : '')
  const [eta, setEta] = useState(shipment.expected_delivery_date ?? '')
  const override = shipment.status === 'delivered'

  useEffect(() => { fetchCouriers().then(r => setCouriers(r.data.filter(c => c.is_active))).catch(() => {}) }, [])

  function onPickPartner(id: string) {
    setPartnerId(id)
    const c = couriers.find(x => x.id === id)
    if (c) { setName(c.name); if (c.service_type) setService(c.service_type) }
  }
  return (
    <ModalShell title="Assign Courier" onClose={onClose}>
      <div className="drawer-body">
        {couriers.length > 0 && (
          <div className="form-group"><label className="form-label">Courier partner</label>
            <select className="form-select" value={partnerId} onChange={e => onPickPartner(e.target.value)}>
              <option value="">— manual entry —</option>
              {couriers.map(c => <option key={c.id} value={c.id}>{c.name}{c.service_type ? ` · ${c.service_type}` : ''}</option>)}
            </select>
            <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Picking a partner builds the tracking link from its template.</span>
          </div>
        )}
        <div className="form-grid form-grid-2">
          <div className="form-group"><label className="form-label">Courier name *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Service</label><input className="form-input" value={service} onChange={e => setService(e.target.value)} placeholder="Surface / Express" /></div>
        </div>
        <div className="form-group"><label className="form-label">AWB / tracking number *</label><input className="form-input" value={awb} onChange={e => setAwb(e.target.value)} /></div>
        <div className="form-grid form-grid-2">
          <div className="form-group"><label className="form-label">Shipping cost (₹)</label><input className="form-input" type="number" min={0} value={cost} onChange={e => setCost(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Expected delivery</label><input className="form-input" type="date" value={eta} onChange={e => setEta(e.target.value)} /></div>
        </div>
        {override && <div className="ll-error" style={{ fontSize: '.78rem' }}>This shipment is delivered — saving will override locked courier details.</div>}
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !name.trim() || !awb.trim()} onClick={() => onConfirm({
          courier_partner_id: partnerId || undefined, courier_name: name.trim(), courier_service: service.trim() || undefined,
          awb_number: awb.trim(), shipping_cost: cost ? Number(cost) : undefined,
          expected_delivery_date: eta || undefined, override,
        })}>{busy ? 'Saving…' : 'Save Courier'}</button>
      </div>
    </ModalShell>
  )
}

/* ── 3. Label upload ── */
function LabelModal({ onConfirm, onClose, busy }: { onConfirm: (file: File, note?: string) => void; onClose: () => void; busy: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  return (
    <ModalShell title="Upload Shipping Label" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12 }}>Upload the courier label (PDF or image). Stored to Cloudinary.</div>
        <label className="dropzone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: '1.6px dashed var(--border)', borderRadius: 'var(--r-sm)', padding: 18, cursor: 'pointer' }}>
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{file ? file.name : '📄 Choose label file'}</span>
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>PDF / PNG / JPG / WebP, under 15 MB</span>
        </label>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !file} onClick={() => file && onConfirm(file)}>{busy ? 'Uploading…' : 'Upload Label'}</button>
      </div>
    </ModalShell>
  )
}

/* ── 4. Schedule / reschedule pickup ── */
function PickupModal({ reschedule, onConfirm, onClose, busy }: { reschedule?: boolean; onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [when, setWhen] = useState('')
  return (
    <ModalShell title={reschedule ? 'Reschedule Pickup' : 'Schedule Pickup'} onClose={onClose}>
      <div className="drawer-body">
        <div className="form-group"><label className="form-label">Pickup date & time</label>
          <input className="form-input" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Leave blank to use now.</span></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm({ pickup_scheduled_at: when ? new Date(when).toISOString() : undefined })}>
          {busy ? 'Saving…' : (reschedule ? 'Reschedule' : 'Schedule')}</button>
      </div>
    </ModalShell>
  )
}

/* ── 5. Pickup failed ── */
function PickupFailedModal({ onConfirm, onClose, busy }: { onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [reason, setReason] = useState('')
  return (
    <ModalShell title="Pickup Failed" onClose={onClose}>
      <div className="drawer-body">
        <div className="form-group"><label className="form-label">Reason</label><input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. courier no-show" /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" disabled={busy} onClick={() => onConfirm({ reason: reason.trim() || undefined })}>{busy ? 'Saving…' : 'Mark Failed'}</button>
      </div>
    </ModalShell>
  )
}

/* ── 6. Delivery attempt ── */
function DeliveryAttemptModal({ onConfirm, onClose, busy }: { onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [status, setStatus] = useState<'delivered' | 'failed'>('failed')
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [next, setNext] = useState('')
  const [contacted, setContacted] = useState(false)
  return (
    <ModalShell title="Record Delivery Attempt" onClose={onClose}>
      <div className="drawer-body">
        <div className="form-group"><label className="form-label">Outcome</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['delivered', 'failed'] as const).map(o => (
              <button key={o} type="button" className={`ftab${status === o ? ' active' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => setStatus(o)}>{o}</button>
            ))}
          </div>
        </div>
        {status === 'failed' && (
          <>
            <div className="form-group"><label className="form-label">Failure reason</label>
              <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">Select…</option>
                {Object.entries(FAILURE_REASON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Next attempt</label><input className="form-input" type="datetime-local" value={next} onChange={e => setNext(e.target.value)} /></div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.82rem' }}>
              <input type="checkbox" checked={contacted} onChange={e => setContacted(e.target.checked)} /> Customer contacted
            </label>
          </>
        )}
        <div className="form-group"><label className="form-label">Courier remarks</label><textarea className="form-textarea" rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`btn ${status === 'delivered' ? 'btn-primary' : 'btn-danger'}`} disabled={busy} onClick={() => onConfirm({
          status, failure_reason: status === 'failed' ? (reason || undefined) : undefined,
          courier_remarks: remarks.trim() || undefined, next_attempt_at: next ? new Date(next).toISOString() : undefined,
          customer_contacted: contacted,
        })}>{busy ? 'Saving…' : (status === 'delivered' ? 'Mark Delivered' : 'Record Failure')}</button>
      </div>
    </ModalShell>
  )
}

/* ── 7. RTO receive (restock) ── */
function RtoReceiveModal({ shipment, onConfirm, onClose, busy }: { shipment: ShipmentDetail; onConfirm: (items: any[], note: string) => void; onClose: () => void; busy: boolean }) {
  const [conds, setConds] = useState<Record<string, { condition: 'resellable' | 'damaged'; restock: number }>>(() => {
    const m: Record<string, { condition: 'resellable' | 'damaged'; restock: number }> = {}
    shipment.items.forEach(it => { m[it.id] = { condition: 'resellable', restock: it.quantity } })
    return m
  })
  const [note, setNote] = useState('')
  return (
    <ModalShell title="Receive RTO" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 12 }}>Set each item’s condition. <strong>Resellable</strong> units restock; <strong>damaged</strong> do not.</div>
        {shipment.items.map(it => {
          const c = conds[it.id]
          return (
            <div key={it.id} className="card" style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '.84rem', marginBottom: 8 }}>{it.product_name || 'Product'} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>· qty {it.quantity}</span></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {(['resellable', 'damaged'] as const).map(opt => (
                  <button key={opt} type="button" className={`ftab${c.condition === opt ? ' active' : ''}`} style={{ textTransform: 'capitalize' }}
                    onClick={() => setConds(p => ({ ...p, [it.id]: { ...p[it.id], condition: opt, restock: opt === 'damaged' ? 0 : it.quantity } }))}>{opt}</button>
                ))}
              </div>
              {c.condition === 'resellable' && (
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Units to restock (max {it.quantity})</label>
                  <input className="form-input" type="number" min={0} max={it.quantity} value={c.restock}
                    onChange={e => setConds(p => ({ ...p, [it.id]: { ...p[it.id], restock: Math.max(0, Math.min(it.quantity, Number(e.target.value))) } }))} /></div>
              )}
            </div>
          )
        })}
        <div className="form-group"><label className="form-label">Note</label><input className="form-input" value={note} onChange={e => setNote(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm(
          shipment.items.map(it => ({ shipment_item_id: it.id, condition_status: conds[it.id].condition, restock_quantity: conds[it.id].restock })), note.trim())}>
          {busy ? 'Saving…' : 'Confirm Received'}</button>
      </div>
    </ModalShell>
  )
}

/* ── 8. COD collect / remit ── */
function CodModal({ shipment, onConfirm, onClose, busy }: { shipment: ShipmentDetail; onConfirm: (b: any) => void; onClose: () => void; busy: boolean }) {
  const [action, setAction] = useState<'collect' | 'remit'>(shipment.cod_collected ? 'remit' : 'collect')
  const [ref, setRef] = useState('')
  return (
    <ModalShell title="COD Settlement" onClose={onClose}>
      <div className="drawer-body">
        <div style={{ fontSize: '.82rem', marginBottom: 12 }}>COD amount: <strong>{inr(shipment.cod_amount)}</strong></div>
        <div className="form-group"><label className="form-label">Action</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`ftab${action === 'collect' ? ' active' : ''}`} onClick={() => setAction('collect')}>Mark collected</button>
            <button type="button" className={`ftab${action === 'remit' ? ' active' : ''}`} disabled={!shipment.cod_collected} onClick={() => setAction('remit')}>Mark remitted</button>
          </div>
          {!shipment.cod_collected && <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Collect before remittance.</span>}
        </div>
        {action === 'remit' && (
          <div className="form-group"><label className="form-label">Remittance reference</label><input className="form-input" value={ref} onChange={e => setRef(e.target.value)} placeholder="UTR / settlement id" /></div>
        )}
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm({ action, reference: ref.trim() || undefined })}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </ModalShell>
  )
}

/* ── Edit notes ── */
function NotesModal({ initial, onConfirm, onClose, busy }: { initial: string; onConfirm: (n: string) => void; onClose: () => void; busy: boolean }) {
  const [v, setV] = useState(initial)
  return (
    <ModalShell title="Internal Notes" onClose={onClose}>
      <div className="drawer-body">
        <div className="form-group"><label className="form-label">Notes (not shown to customer)</label><textarea className="form-textarea" rows={4} value={v} onChange={e => setV(e.target.value)} /></div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm(v)}>{busy ? 'Saving…' : 'Save Notes'}</button>
      </div>
    </ModalShell>
  )
}

/* ════════════════ ACTIONS (footer buttons + modals) ════════════════ */
type ModalKind = null | 'pack' | 'courier' | 'label' | 'pickup' | 'reschedule' | 'pickupFailed' | 'attempt' | 'rtoReceive' | 'cod' | 'notes'
  | 'confirmCancel' | 'confirmRtoInit' | 'confirmDelivered' | 'confirmLost' | 'confirmDamaged'

export function ShipmentActions({ shipment, onDone }: { shipment: ShipmentDetail; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const s = shipment.status
  const id = shipment.id

  async function run(fn: () => Promise<any>) {
    setBusy(true); setErr(null)
    try { await fn(); setModal(null); onDone() }
    catch (e: any) { setErr(e?.message || 'Action failed') }
    finally { setBusy(false) }
  }

  const Btn = ({ label, kind, variant = 'outline' }: { label: string; kind: ModalKind; variant?: 'primary' | 'outline' | 'danger' }) =>
    <button className={`btn btn-${variant}`} disabled={busy} onClick={() => { setErr(null); setModal(kind) }}>{label}</button>
  const Quick = ({ label, status, variant = 'outline' }: { label: string; status: string; variant?: 'primary' | 'outline' | 'danger' }) =>
    <button className={`btn btn-${variant}`} disabled={busy} onClick={() => run(() => setShipmentStatus(id, status))}>{label}</button>

  const codButton = !shipment.is_prepaid && !shipment.cod_remitted
  const cancellable = ['pending', 'ready_to_pack', 'packed', 'label_generated', 'pickup_scheduled'].includes(s)

  return (
    <>
      {err && <div className="ll-error" style={{ width: '100%', marginBottom: 8 }}>⚠️ {err}</div>}

      {s === 'ready_to_pack' && <Btn label="📦 Pack" kind="pack" variant="primary" />}

      {(s === 'packed' || s === 'label_generated') && <>
        <Btn label="🚚 Assign Courier" kind="courier" variant={s === 'packed' ? 'primary' : 'outline'} />
        <Btn label="🏷️ Upload Label" kind="label" />
        <Btn label="📅 Schedule Pickup" kind="pickup" />
        {s === 'label_generated' && <Quick label="✓ Mark Picked Up" status="" variant="primary" />}
      </>}
      {/* label_generated → picked_up uses the dedicated endpoint, not set_status */}
      {s === 'label_generated' && <button className="btn btn-primary" disabled={busy} onClick={() => run(() => markPickedUp(id))} style={{ display: 'none' }} />}

      {s === 'pickup_scheduled' && <>
        <button className="btn btn-primary" disabled={busy} onClick={() => run(() => markPickedUp(id))}>✓ Mark Picked Up</button>
        <Btn label="✕ Pickup Failed" kind="pickupFailed" variant="danger" />
        <Btn label="📅 Reschedule" kind="reschedule" />
      </>}

      {s === 'picked_up' && <>
        <Quick label="→ In Transit" status="in_transit" />
        <Quick label="→ Out for Delivery" status="out_for_delivery" />
        <Btn label="📋 Record Attempt" kind="attempt" />
      </>}

      {s === 'in_transit' && <>
        <Quick label="→ Out for Delivery" status="out_for_delivery" variant="primary" />
        <Btn label="📋 Record Attempt" kind="attempt" />
        <Btn label="↩ Initiate RTO" kind="confirmRtoInit" variant="danger" />
      </>}

      {s === 'out_for_delivery' && <>
        <Btn label="✓ Mark Delivered" kind="confirmDelivered" variant="primary" />
        <Btn label="📋 Record Attempt" kind="attempt" />
      </>}

      {s === 'delivery_failed' && <>
        <Quick label="↻ Retry (Out for Delivery)" status="out_for_delivery" />
        <Btn label="↩ Initiate RTO" kind="confirmRtoInit" variant="danger" />
      </>}

      {(s === 'rto_initiated' || s === 'damaged_in_transit') && <Btn label="📦 Receive RTO" kind="rtoReceive" variant="primary" />}

      {codButton && <Btn label="💵 COD" kind="cod" />}
      {cancellable && <Btn label="Cancel Shipment" kind="confirmCancel" variant="danger" />}
      <Btn label="📝 Notes" kind="notes" />

      {/* ── Modals ── */}
      {modal === 'pack' && <PackModal busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => packShipment(id, b))} />}
      {modal === 'courier' && <AssignCourierModal shipment={shipment} busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => assignCourier(id, b))} />}
      {modal === 'label' && <LabelModal busy={busy} onClose={() => setModal(null)} onConfirm={(file, note) => run(() => uploadLabel(id, file, note))} />}
      {modal === 'pickup' && <PickupModal busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => schedulePickup(id, b))} />}
      {modal === 'reschedule' && <PickupModal reschedule busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => schedulePickup(id, b))} />}
      {modal === 'pickupFailed' && <PickupFailedModal busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => pickupFailed(id, b))} />}
      {modal === 'attempt' && <DeliveryAttemptModal busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => recordDeliveryAttempt(id, b))} />}
      {modal === 'rtoReceive' && <RtoReceiveModal shipment={shipment} busy={busy} onClose={() => setModal(null)} onConfirm={(items, note) => run(() => receiveRto(id, items, note))} />}
      {modal === 'cod' && <CodModal shipment={shipment} busy={busy} onClose={() => setModal(null)} onConfirm={(b) => run(() => updateCod(id, b))} />}
      {modal === 'notes' && <NotesModal initial={shipment.admin_notes ?? ''} busy={busy} onClose={() => setModal(null)} onConfirm={(n) => run(() => setShipmentNotes(id, n))} />}

      {modal === 'confirmCancel' && <NoteConfirmModal title="Cancel Shipment" danger confirmLabel="Cancel Shipment" busy={busy}
        message="This cancels the shipment (stock is NOT changed). Only allowed before dispatch." onClose={() => setModal(null)} onConfirm={(n) => run(() => cancelShipment(id, n))} />}
      {modal === 'confirmRtoInit' && <NoteConfirmModal title="Initiate RTO" danger confirmLabel="Initiate RTO" busy={busy}
        message="Mark this shipment as returning to origin." onClose={() => setModal(null)} onConfirm={(n) => run(() => initiateRto(id, n))} />}
      {modal === 'confirmDelivered' && <NoteConfirmModal title="Mark Delivered" confirmLabel="Mark Delivered" busy={busy}
        message="Marks delivered, syncs the order to delivered, and starts the return window." onClose={() => setModal(null)} onConfirm={(n) => run(() => setShipmentStatus(id, 'delivered', n))} />}
    </>
  )
}

/* ════════════════ BULK ACTIONS BAR ════════════════ */
export function BulkActionsBar({ rows, selected, onClear, onDone }:
  { rows: ShipmentSummaryRow[]; selected: Set<string>; onClear: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [pickupModal, setPickupModal] = useState(false)

  const chosen = rows.filter(r => selected.has(r.id))
  const packable = chosen.filter(r => r.status === 'ready_to_pack')
  const pickupable = chosen.filter(r => r.status === 'packed' || r.status === 'label_generated')

  async function bulkPack() {
    setBusy(true); setResult(null)
    const res = await Promise.allSettled(packable.map(r => packShipment(r.id, {})))
    const ok = res.filter(x => x.status === 'fulfilled').length
    setResult(`Packed ${ok}/${packable.length}`); setBusy(false); onDone()
  }
  async function bulkPickup(whenISO?: string) {
    setBusy(true); setResult(null)
    const res = await Promise.allSettled(pickupable.map(r => schedulePickup(r.id, { pickup_scheduled_at: whenISO })))
    const ok = res.filter(x => x.status === 'fulfilled').length
    setResult(`Pickup scheduled ${ok}/${pickupable.length}`); setBusy(false); setPickupModal(false); onDone()
  }

  return (
    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: '.8rem' }}>
      <span style={{ color: 'var(--muted)' }}>{selected.size} selected</span>
      <button className="btn btn-outline btn-sm" disabled={busy || packable.length === 0} onClick={bulkPack}>📦 Mark Packed ({packable.length})</button>
      <button className="btn btn-outline btn-sm" disabled={busy || pickupable.length === 0} onClick={() => setPickupModal(true)}>📅 Schedule Pickup ({pickupable.length})</button>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onClear}>Clear</button>
      {result && <span style={{ color: 'var(--muted)' }}>· {result}</span>}

      {pickupModal && (() => {
        function PickupBulk() {
          const [when, setWhen] = useState('')
          return (
            <ModalShell title={`Schedule Pickup · ${pickupable.length} shipments`} onClose={() => setPickupModal(false)}>
              <div className="drawer-body">
                <div className="form-group"><label className="form-label">Pickup date & time (applies to all)</label>
                  <input className="form-input" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
                  <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Blank = now.</span></div>
              </div>
              <div className="drawer-foot">
                <button className="btn btn-ghost" onClick={() => setPickupModal(false)} disabled={busy}>Cancel</button>
                <button className="btn btn-primary" disabled={busy} onClick={() => bulkPickup(when ? new Date(when).toISOString() : undefined)}>{busy ? 'Scheduling…' : 'Schedule All'}</button>
              </div>
            </ModalShell>
          )
        }
        return <PickupBulk />
      })()}
    </div>
  )
}