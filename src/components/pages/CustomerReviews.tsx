'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from './CustomerReviews.module.css';

/* ── Types ───────────────────────────────────────────────── */
interface Review {
  id:            string;
  customer_name: string;
  avatar:        string | null;
  rating:        number;  // backend field: r.rating
  comment:       string;
  images:        string[];
  is_verified:   boolean;
  created_at:    string | null;
}

interface ReviewsData {
  total:        number;
  average:      number;
  distribution: Record<'1'|'2'|'3'|'4'|'5', number>;
  reviews:      Review[];
}

/* ── Helpers ─────────────────────────────────────────────── */
function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins  < 60)   return `${mins} min${mins!==1?'s':''} ago`;
  if (hours < 24)   return `${hours} hour${hours!==1?'s':''} ago`;
  if (days  < 30)   return `${days} day${days!==1?'s':''} ago`;
  if (months < 12)  return `${months} month${months!==1?'s':''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function StarRow({ count, size = 14 }: { count: number; size?: number }) {
  const n = Math.min(5, Math.max(0, Math.round(count)));
  return (
    <span className={styles.starRow} style={{ fontSize: size }}>
      {'★'.repeat(n)}<span className={styles.starEmpty}>{'★'.repeat(5-n)}</span>
    </span>
  );
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ src, name }: { src: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <div className={styles.avatarWrap}>
        <Image src={src} alt={name} fill sizes="42px" className={styles.avatarImg} onError={() => setErr(true)} />
      </div>
    );
  }
  const colors = ['var(--gg-primary)','#1a9e78','#3b82f6','#9b5de5','#f59e0b'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return <div className={styles.avatarInitials} style={{ background: bg }}>{initials(name)}</div>;
}

/* ── Review Image Lightbox ───────────────────────────────── */
function ReviewImages({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className={styles.reviewImages}>
        {images.slice(0, 4).map((src, i) => (
          <button key={i} className={styles.reviewImgBtn} type="button" onClick={() => setLightbox(src)}>
            <Image src={src} alt={`Review image ${i+1}`} fill sizes="72px" className={styles.reviewImgThumb} />
            {i === 3 && images.length > 4 && (
              <div className={styles.reviewImgMore}>+{images.length - 4}</div>
            )}
          </button>
        ))}
      </div>
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxImg} onClick={e => e.stopPropagation()}>
            <Image src={lightbox} alt="Review photo" fill sizes="80vw" style={{ objectFit: 'contain' }} />
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)} type="button">✕</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Submit Review Form ──────────────────────────────────── */
function SubmitReviewForm({ productId, onSubmitted }: { productId: string | number; onSubmitted: () => void }) {
  const { data: session } = useSession();
  const [stars,   setStars]   = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  const [files,   setFiles]   = useState<File[]>([]);
  const [previews,setPreviews]= useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 4);
    setFiles(arr);
    const prev = await Promise.all(arr.map(f => new Promise<string>((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
    })));
    setPreviews(prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { setError('Please log in to submit a review.'); return; }
    if (stars === 0) { setError('Please select a star rating.'); return; }
    if (comment.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }

    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('stars', String(stars));
      fd.append('comment', comment.trim());
      // Only append images if files were actually selected
      // Sending an empty images field causes FastAPI 422
      if (files.length > 0) {
        files.forEach(f => fd.append('images', f));
      }

      const res = await fetch(`/api/product/${productId}/reviews`, {
        method: 'POST', body: fd, credentials: 'include',
      });
      if (!res.ok) {
        let detail = 'Submission failed'
        try {
          const d = await res.json()
          if (typeof d?.detail === 'string') detail = d.detail
          else if (Array.isArray(d?.detail)) detail = d.detail.map((e: any) => e.msg).join(', ')
          else if (d?.message) detail = d.message
        } catch { /* ignore */ }
        throw new Error(detail)
      }
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSubmitted(); }, 2500);
      setStars(0); setComment(''); setFiles([]); setPreviews([]);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.submitForm} onSubmit={handleSubmit}>
      <div className={styles.submitFormTitle}>Write a Review</div>

      {/* Star selector */}
      <div className={styles.starSelector}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            className={`${styles.starSelectBtn} ${n <= (hover || stars) ? styles.starSelectBtnOn : ''}`}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            onClick={() => setStars(n)}>★</button>
        ))}
        <span className={styles.starSelectorLabel}>
          {stars === 0 ? 'Select rating' : ['','Poor','Fair','Good','Very Good','Excellent'][stars]}
        </span>
      </div>

      {/* Comment */}
      <textarea
        className={styles.submitTextarea}
        placeholder="Share your experience with this product…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={4}
        maxLength={500}
      />
      <div className={styles.charCount}>{comment.length}/500</div>

      {/* Image upload */}
      <div className={styles.imgUploadRow}>
        <button type="button" className={styles.imgUploadBtn} onClick={() => fileRef.current?.click()}>
          📷 Add Photos ({files.length}/4)
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
          onChange={e => handleFiles(e.target.files)} />
        {previews.map((src, i) => (
          <div key={i} className={styles.imgPreview}>
            <Image src={src} alt={`Preview ${i+1}`} fill sizes="56px" style={{ objectFit:'cover', borderRadius:8 }} />
            <button type="button" className={styles.imgPreviewRemove}
              onClick={() => { const f=[...files]; f.splice(i,1); setFiles(f); const p=[...previews]; p.splice(i,1); setPreviews(p); }}>✕</button>
          </div>
        ))}
      </div>

      {error   && <div className={styles.submitError}>{error}</div>}
      {success && <div className={styles.submitSuccess}>✅ Review submitted successfully!</div>}

      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
      {!session && <p className={styles.loginNote}>You must be logged in to submit a review.</p>}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
interface CustomerReviewsProps {
  productId:    string | number;
  productName?: string;
}

export default function CustomerReviews({ productId, productName }: CustomerReviewsProps) {
  const [data,        setData]        = useState<ReviewsData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [page,        setPage]        = useState(0);
  const [activeReview,setActiveReview]= useState(0); // for the right-side carousel
  const [showForm,    setShowForm]    = useState(false);
  const LIMIT = 5;

  const fetchReviews = useCallback(async (p = 0) => {
    setLoading(true); setError(false);
    try {
      const res  = await fetch(`/api/product/${productId}/reviews?skip=${p * LIMIT}&limit=${LIMIT}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      setPage(p);
      setActiveReview(0);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { fetchReviews(0); }, [fetchReviews]);

  // Rating distribution bars
  const dist     = data?.distribution ?? { '1':0,'2':0,'3':0,'4':0,'5':0 };
  const total    = data?.total ?? 0;
  const average  = data?.average ?? 0;
  const reviews  = data?.reviews ?? [];
  const totalPages = Math.ceil(total / LIMIT);

  const activeRev = reviews[activeReview] ?? null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Customer Reviews ({total})</h2>

      <div className={styles.layout}>

        {/* ── LEFT: summary ── */}
        <div className={styles.summaryCol}>
          <div className={styles.bigScore}>{average.toFixed(1)}</div>
          <StarRow count={average} size={20} />
          <div className={styles.basedOn}>Based on {total} reviews</div>

          <div className={styles.distBars}>
            {([5,4,3,2,1] as const).map(n => {
              const count = dist[String(n) as keyof typeof dist] ?? 0;
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={n} className={styles.distRow}>
                  <span className={styles.distLabel}>{n} ☆</span>
                  <div className={styles.distTrack}>
                    <div className={styles.distFill} style={{ width: `${pct}%`, background: n >= 4 ? 'var(--gg-primary)' : n === 3 ? '#f5a623' : '#ddd' }} />
                  </div>
                  <span className={styles.distPct}>{pct}% ({count})</span>
                </div>
              );
            })}
          </div>

          <button className={styles.writeReviewBtn} type="button" onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '✏️ Write a Review'}
          </button>
        </div>

        {/* ── RIGHT: review carousel ── */}
        <div className={styles.reviewCol}>
          {loading && (
            <div className={styles.skeletonWrap}>
              {[1,2].map(i => <div key={i} className={styles.skeletonCard} />)}
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              ⚠️ Could not load reviews.
              <button className={styles.retryBtn} type="button" onClick={() => fetchReviews(page)}>Retry</button>
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className={styles.emptyState}>
              <span style={{ fontSize: 40 }}>💬</span>
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}

          {!loading && !error && reviews.length > 0 && activeRev && (
            <div className={styles.reviewCardFeatured}>
              {/* Prev / Next arrows */}
              <button type="button" className={styles.navArrow} style={{ left: -16 }}
                onClick={() => setActiveReview(p => Math.max(0, p-1))} disabled={activeReview === 0}>‹</button>
              <button type="button" className={styles.navArrow} style={{ right: -16 }}
                onClick={() => setActiveReview(p => Math.min(reviews.length-1, p+1))} disabled={activeReview === reviews.length-1}>›</button>

              {/* Header */}
              <div className={styles.rcHeader}>
                <Avatar src={activeRev.avatar} name={activeRev.customer_name} />
                <div className={styles.rcMeta}>
                  <div className={styles.rcName}>
                    {activeRev.customer_name}
                    {activeRev.is_verified && (
                      <span className={styles.verifiedBadge}>✓ Verified Purchase</span>
                    )}
                  </div>
                  <StarRow count={activeRev.rating} size={13} />
                </div>
                <div className={styles.rcDate}>{timeAgo(activeRev.created_at)}</div>
              </div>

              {/* Comment */}
              <p className={styles.rcComment}>{activeRev.comment}</p>

              {/* Review images */}
              <ReviewImages images={activeRev.images ?? []} />

              {/* Dot indicators */}
              {reviews.length > 1 && (
                <div className={styles.reviewDots}>
                  {reviews.map((_, i) => (
                    <button key={i} type="button"
                      className={`${styles.reviewDot} ${i === activeReview ? styles.reviewDotActive : ''}`}
                      onClick={() => setActiveReview(i)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination + View All */}
          {!loading && !error && total > 0 && (
            <div className={styles.paginationRow}>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} type="button" disabled={page === 0} onClick={() => fetchReviews(page-1)}>← Prev</button>
                  <span className={styles.pageInfo}>{page+1} / {totalPages}</span>
                  <button className={styles.pageBtn} type="button" disabled={page >= totalPages-1} onClick={() => fetchReviews(page+1)}>Next →</button>
                </div>
              )}
              <button className={styles.viewAllBtn} type="button" onClick={() => fetchReviews(0)}>
                View all reviews →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit form */}
      {showForm && (
        <SubmitReviewForm productId={productId} onSubmitted={() => { setShowForm(false); setTimeout(() => fetchReviews(0), 500); }} />
      )}
    </section>
  );
}