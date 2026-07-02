'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ReturnModal.module.css';
import {
  createReturn, uploadReturnProof, fetchMyReturn, cancelReturn,
  RETURN_STATUS_LABEL, RETURN_STATUS_COLOR, RETURN_REASON_LABEL, REQUEST_TYPE_LABEL,
  type ReturnDetail,
} from '@/lib/returnsApi';

const PLACEHOLDER = '/images/placeholder-product.png';

/* Customer-facing reason + type options. store_credit is intentionally omitted:
   there is no store-credit ledger yet, so offering it would be misleading. */
const REASONS = [
  { value: 'damaged',       label: 'Damaged product received' },
  { value: 'defective',     label: 'Defective / not working' },
  { value: 'wrong_item',    label: 'Wrong item received' },
  { value: 'missing_item',  label: 'Missing item' },
  { value: 'variant_issue', label: 'Size / variant issue' },
  { value: 'other',         label: 'Other' },
];
const TYPES = [
  { value: 'refund',      label: 'Refund',      hint: 'Money back to your original payment method' },
  { value: 'replacement', label: 'Replacement', hint: 'Same item shipped to you again' },
];
const PROOF_REQUIRED = new Set(['damaged', 'defective']);

function productImg(p: any): string {
  const raw = p?.product_image;
  if (!raw) return PLACEHOLDER;
  if (Array.isArray(raw)) { const f = raw[0]; return (typeof f === 'string' ? f : f?.url) || PLACEHOLDER; }
  if (typeof raw === 'string') return raw || PLACEHOLDER;
  if (typeof raw === 'object') return raw?.url ?? PLACEHOLDER;
  return PLACEHOLDER;
}
function fmtDateTime(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function inr(n: number): string { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

interface SelLine { include: boolean; qty: number }

interface ReturnModalProps {
  mode: 'create' | 'view';
  token?: string | null;
  order?: { id: string; rawItems: any[]; date?: string };
  returnId?: string;
  onClose: () => void;
  onCreated?: () => void;   // parent refetches + toasts
  onCancelled?: () => void; // parent refetches + closes
}

export default function ReturnModal({ mode, token, order, returnId, onClose, onCreated, onCancelled }: ReturnModalProps) {
  /* ───────────────── CREATE state ───────────────── */
  const [lines, setLines] = useState<Record<string, SelLine>>(() => {
    const m: Record<string, SelLine> = {};
    (order?.rawItems ?? []).forEach((it: any) => { if (it?.id != null) m[String(it.id)] = { include: false, qty: 1 }; });
    return m;
  });
  const [reason, setReason]       = useState('');
  const [rtype, setRtype]         = useState('');
  const [description, setDesc]    = useState('');
  const [files, setFiles]         = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<{ failed: number } | null>(null);

  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;
  useEffect(() => () => { previewsRef.current.forEach(u => { try { URL.revokeObjectURL(u); } catch {} }); }, []);

  const anySelected = Object.values(lines).some(l => l.include);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = '';
    const imgs = picked.filter(f => f.type.startsWith('image/') && f.size <= 15 * 1024 * 1024);
    if (imgs.length !== picked.length) setError('Some files were skipped (images only, under 15 MB).');
    setFiles(prev => [...prev, ...imgs]);
    setPreviews(prev => [...prev, ...imgs.map(f => URL.createObjectURL(f))]);
  }
  function removeFile(i: number) {
    setPreviews(prev => { try { URL.revokeObjectURL(prev[i]); } catch {} return prev.filter((_, j) => j !== i); });
    setFiles(prev => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit() {
    setError(null);
    const chosen = (order?.rawItems ?? [])
      .filter((it: any) => it?.id != null && lines[String(it.id)]?.include && lines[String(it.id)].qty > 0)
      .map((it: any) => ({ order_item_id: String(it.id), quantity: lines[String(it.id)].qty }));

    if (chosen.length === 0) { setError('Select at least one item to return.'); return; }
    if (!reason) { setError('Please choose a reason for the return.'); return; }
    if (!rtype)  { setError('Please choose Refund or Replacement.'); return; }
    if (PROOF_REQUIRED.has(reason) && files.length === 0) {
      setError('Please add at least one photo — proof is required for damaged or defective items.'); return;
    }

    setSubmitting(true);
    try {
      const created = await createReturn(
        { order_id: order!.id, request_type: rtype as any, reason: reason as any, description: description.trim() || undefined, items: chosen },
        token,
      );
      let failed = 0;
      for (const f of files) {
        try { await uploadReturnProof(created.id, f, token); } catch { failed += 1; }
      }
      onCreated?.();              // parent refetches list + shows toast
      setSuccess({ failed });     // show in-modal confirmation (don't auto-close)
    } catch (e: any) {
      setError(e?.message || 'Could not submit your return request.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────────────── VIEW state ───────────────── */
  const [detail, setDetail]   = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(mode === 'view');
  const [vError, setVError]   = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function loadDetail() {
    if (!returnId) return;
    setLoading(true); setVError(null);
    fetchMyReturn(returnId, token)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(e => { setVError(e?.message || 'Could not load this return.'); setLoading(false); });
  }
  useEffect(() => {
    if (mode !== 'view') return;
    let alive = true;
    setLoading(true); setVError(null);
    fetchMyReturn(returnId!, token)
      .then(d => { if (alive) { setDetail(d); setLoading(false); } })
      .catch(e => { if (alive) { setVError(e?.message || 'Could not load this return.'); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, returnId, token]);

  async function handleCancel() {
    if (!returnId) return;
    setCancelling(true);
    try { await cancelReturn(returnId, token); onCancelled?.(); }
    catch (e: any) { setVError(e?.message || 'Could not cancel this return.'); setCancelling(false); }
  }

  const busy = submitting || cancelling;
  const StatusBadge = ({ status }: { status: string }) => {
    const sc = RETURN_STATUS_COLOR[status] ?? { bg: '#f3f4f6', color: '#374151' };
    return <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>{RETURN_STATUS_LABEL[status] ?? status}</span>;
  };

  return (
    <div className={styles.overlay} onClick={() => !busy && onClose()}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.head}>
          <h2 className={styles.title}>
            {mode === 'create' ? 'Request a Return' : 'Return Details'}
          </h2>
          <button type="button" className={styles.close} onClick={() => !busy && onClose()} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ════════ CREATE — SUCCESS ════════ */}
        {mode === 'create' && success && (
          <div className={styles.body}>
            <div className={styles.successWrap}>
              <div className={styles.successIcon}>✓</div>
              <div className={styles.successTitle}>Return request submitted</div>
              <div className={styles.successText}>
                Our team will review it shortly. You can track its status on this order anytime.
              </div>
              {success.failed > 0 && (
                <div className={styles.warn}>
                  ⚠️ {success.failed} photo{success.failed > 1 ? 's' : ''} couldn’t be uploaded. You can reach support to add them — proof helps us approve damaged/defective returns faster.
                </div>
              )}
            </div>
          </div>
        )}
        {mode === 'create' && success && (
          <div className={styles.footer}>
            <button type="button" className={styles.btnPrimary} onClick={onClose}>Done</button>
          </div>
        )}

        {/* ════════ CREATE — FORM ════════ */}
        {mode === 'create' && !success && (
          <>
            <div className={styles.body}>
              <div className={styles.policyNote}>
                Returns are accepted within <strong>7 days of delivery</strong> for damaged, defective, wrong, or
                missing items. Approval and refund/replacement are subject to review.
              </div>

              <div className={styles.sectionLabel}>Select item(s) to return</div>
              <div className={styles.itemsList}>
                {(order?.rawItems ?? []).map((it: any, idx: number) => {
                  const oid = it?.id != null ? String(it.id) : '';
                  if (!oid) {
                    const p0 = it.product || {};
                    return (
                      <div key={idx} className={styles.itemRow} style={{ opacity: .55 }}>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemName}>{p0.name || 'Item'}</div>
                          <div className={styles.itemMeta}>This item can’t be returned online — contact support.</div>
                        </div>
                      </div>
                    );
                  }
                  const sel = lines[oid];
                  const maxQty = Number(it.quantity ?? it.count ?? 1) || 1;
                  const p = it.product || {};
                  return (
                    <div key={oid} className={`${styles.itemRow} ${sel?.include ? styles.itemRowOn : ''}`}>
                      <label className={styles.itemCheck}>
                        <input type="checkbox" checked={!!sel?.include}
                          onChange={e => setLines(l => ({ ...l, [oid]: { ...l[oid], include: e.target.checked } }))} />
                      </label>
                      <div className={styles.itemImg}>
                        <img src={productImg(p)} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{p.name || 'Product'}</div>
                        <div className={styles.itemMeta}>
                          Ordered: {maxQty}{it.color ? ` · ${it.color}` : ''} · {inr(Number(it.price ?? 0))}
                        </div>
                      </div>
                      {sel?.include && (
                        <div className={styles.qtyStepper}>
                          <button type="button" className={styles.qtyBtn} disabled={sel.qty <= 1}
                            onClick={() => setLines(l => ({ ...l, [oid]: { ...l[oid], qty: Math.max(1, l[oid].qty - 1) } }))}>−</button>
                          <span className={styles.qtyVal}>{sel.qty}</span>
                          <button type="button" className={styles.qtyBtn} disabled={sel.qty >= maxQty}
                            onClick={() => setLines(l => ({ ...l, [oid]: { ...l[oid], qty: Math.min(maxQty, l[oid].qty + 1) } }))}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.sectionLabel}>Reason</div>
              <select className={styles.select} value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">Select a reason…</option>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>

              <div className={styles.sectionLabel}>What would you like?</div>
              <div className={styles.typeGrid}>
                {TYPES.map(t => (
                  <button key={t.value} type="button"
                    className={`${styles.typeOption} ${rtype === t.value ? styles.typeOptionOn : ''}`}
                    onClick={() => setRtype(t.value)}>
                    <span className={styles.typeLabel}>{t.label}</span>
                    <span className={styles.typeHint}>{t.hint}</span>
                  </button>
                ))}
              </div>

              <div className={styles.sectionLabel}>Description <span className={styles.opt}>(optional)</span></div>
              <textarea className={styles.textarea} rows={3} maxLength={500}
                placeholder="Tell us what went wrong…"
                value={description} onChange={e => setDesc(e.target.value)} />
              <div className={styles.charCount}>{description.length}/500</div>

              <div className={styles.sectionLabel}>
                Photos {PROOF_REQUIRED.has(reason)
                  ? <span className={styles.req}>* required for this reason</span>
                  : <span className={styles.opt}>(optional)</span>}
              </div>
              <label className={styles.dropzone}>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPickFiles} />
                <span className={styles.dropzoneMain}>📷 Tap to add photos</span>
                <span className={styles.dropzoneHint}>Clear photos of the issue help us approve faster</span>
              </label>
              {previews.length > 0 && (
                <div className={styles.thumbs}>
                  {previews.map((src, i) => (
                    <div key={i} className={styles.thumb}>
                      <img src={src} alt="" />
                      <button type="button" className={styles.thumbRemove} onClick={() => removeFile(i)} aria-label="Remove photo">×</button>
                    </div>
                  ))}
                </div>
              )}

              {error && <div className={styles.error}>⚠️ {error}</div>}
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting || !anySelected}>
                {submitting ? <span className={styles.spinner} /> : 'Submit Return Request'}
              </button>
            </div>
          </>
        )}

        {/* ════════ VIEW ════════ */}
        {mode === 'view' && (
          <>
            <div className={styles.body}>
              {loading ? (
                <>
                  {[1, 2, 3].map(i => <div key={i} className={styles.skel} />)}
                </>
              ) : vError ? (
                <div className={styles.viewError}>
                  <div>⚠️ {vError}</div>
                  <button type="button" className={styles.retryBtn} onClick={loadDetail}>Retry</button>
                </div>
              ) : detail ? (
                <>
                  <div className={styles.viewTop}>
                    <StatusBadge status={detail.status} />
                    <span className={styles.viewType}>{REQUEST_TYPE_LABEL[detail.request_type] ?? detail.request_type}</span>
                  </div>

                  <div className={styles.metaRow}><span className={styles.metaKey}>Reason</span><span className={styles.metaVal}>{RETURN_REASON_LABEL[detail.reason] ?? detail.reason}</span></div>
                  <div className={styles.metaRow}><span className={styles.metaKey}>Requested</span><span className={styles.metaVal}>{fmtDateTime(detail.created_at)}</span></div>
                  {detail.order && (
                    <div className={styles.metaRow}><span className={styles.metaKey}>Order</span><span className={styles.metaVal}>#{detail.order.order_number}</span></div>
                  )}
                  {detail.description && <div className={styles.descBox}>{detail.description}</div>}

                  {detail.rejection_reason && (
                    <div className={styles.rejectBox}>
                      <strong>Rejected:</strong> {detail.rejection_reason}
                    </div>
                  )}

                  {/* Items */}
                  <div className={styles.sectionLabel}>Items</div>
                  <div className={styles.itemsList}>
                    {detail.items.map(it => (
                      <div key={it.id} className={styles.itemRow}>
                        <div className={styles.itemImg}>
                          <img src={it.product_image || PLACEHOLDER} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                        </div>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemName}>{it.product_name || 'Product'}</div>
                          <div className={styles.itemMeta}>Qty {it.quantity} · {inr(it.item_price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Proofs */}
                  {detail.proofs.length > 0 && (
                    <>
                      <div className={styles.sectionLabel}>Your photos</div>
                      <div className={styles.proofGrid}>
                        {detail.proofs.map(p => (
                          <a key={p.id} href={p.file_url} target="_blank" rel="noopener" className={styles.proofThumb}>
                            <img src={p.file_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </a>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Refund */}
                  {detail.refund && (
                    <div className={styles.infoCard}>
                      <div className={styles.infoTitle}>Refund</div>
                      <div className={styles.infoLine}><span>Amount</span><span>{inr(detail.refund.amount)}</span></div>
                      <div className={styles.infoLine}><span>Status</span><span style={{ textTransform: 'capitalize' }}>{detail.refund.status}</span></div>
                      <div className={styles.infoLine}><span>Method</span><span style={{ textTransform: 'capitalize' }}>{detail.refund.method}</span></div>
                      {detail.refund.transaction_reference && <div className={styles.infoLine}><span>Reference</span><span>{detail.refund.transaction_reference}</span></div>}
                      {detail.refund.processed_at && <div className={styles.infoLine}><span>Processed</span><span>{fmtDateTime(detail.refund.processed_at)}</span></div>}
                    </div>
                  )}

                  {/* Replacement */}
                  {detail.replacement && (
                    <div className={styles.infoCard}>
                      <div className={styles.infoTitle}>Replacement</div>
                      <div className={styles.infoLine}><span>Quantity</span><span>{detail.replacement.quantity}</span></div>
                      <div className={styles.infoLine}><span>Status</span><span style={{ textTransform: 'capitalize' }}>{detail.replacement.status}</span></div>
                      {detail.replacement.tracking_number && <div className={styles.infoLine}><span>Tracking</span><span>{detail.replacement.tracking_number}</span></div>}
                      {detail.replacement.dispatched_at && <div className={styles.infoLine}><span>Dispatched</span><span>{fmtDateTime(detail.replacement.dispatched_at)}</span></div>}
                      {detail.replacement.delivered_at && <div className={styles.infoLine}><span>Delivered</span><span>{fmtDateTime(detail.replacement.delivered_at)}</span></div>}
                    </div>
                  )}

                  {/* Timeline */}
                  <div className={styles.sectionLabel}>Status timeline</div>
                  <div className={styles.timeline}>
                    {detail.status_history.length === 0 && <div className={styles.itemMeta}>No history yet.</div>}
                    {detail.status_history.map((h, i) => (
                      <div key={h.id} className={styles.tlItem}>
                        <div className={styles.tlDotWrap}>
                          <span className={styles.tlDot} style={{ background: (RETURN_STATUS_COLOR[h.new_status]?.color) || '#9ca3af' }} />
                          {i < detail.status_history.length - 1 && <span className={styles.tlLine} />}
                        </div>
                        <div className={styles.tlBody}>
                          <div className={styles.tlStatus}>{RETURN_STATUS_LABEL[h.new_status] ?? h.new_status}</div>
                          {h.note && <div className={styles.tlNote}>{h.note}</div>}
                          <div className={styles.tlDate}>{fmtDateTime(h.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className={styles.footer}>
              {detail && (detail.status === 'requested' || detail.status === 'under_review') ? (
                <button type="button" className={styles.cancelReturnBtn} onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? <span className={styles.spinner} /> : 'Cancel Return Request'}
                </button>
              ) : <span />}
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={cancelling}>Close</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}