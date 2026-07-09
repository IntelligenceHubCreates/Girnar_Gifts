'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import FilterTabs from '../ui/FilterTabs'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, type ApiBlogPost } from '@/lib/adminApi'

// ── Blog Post Form ────────────────────────────────────────────────

function BlogPostForm({ post, onClose, onSaved }: { post?: ApiBlogPost | null; onClose: () => void; onSaved: () => void }) {
  const { data: adminSession } = useSession()
  const adminToken = (adminSession as any)?.accessToken as string | undefined
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const isEdit = !!post

  const titleToSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const [form, setForm] = useState({
    title:     post?.title     ?? '',
    slug:      post?.slug      ?? '',
    excerpt:   post?.excerpt   ?? '',
    content:   post?.content   ?? '',
    tag:       post?.tag       ?? '',
    image_url: post?.image_url ?? '',
    status:    (post?.status   ?? 'draft') as 'published' | 'draft',
  })

  function handleTitle(val: string) {
    setForm(f => ({ ...f, title: val, slug: isEdit ? f.slug : titleToSlug(val) }))
  }

  async function handleImageUpload(file: File) {
    setUploading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/blog/upload-image', {
        method: 'POST', body: fd, credentials: 'include',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Upload failed')
      const { url } = await res.json()
      setForm(f => ({ ...f, image_url: url }))
    } catch (e: any) {
      setError(e.message ?? 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.slug.trim())  { setError('Slug is required');  return }
    setSaving(true); setError(null)
    try {
      if (isEdit) await updateBlogPost(post!.id, form)
      else        await createBlogPost(form)
      onSaved(); onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Post' : '✏️ New Blog Post'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {error && <div style={{ background:'#FFF0F0', border:'1px solid var(--coral)', borderRadius:8, padding:'10px 14px', color:'var(--coral)', fontSize:'.82rem', marginBottom:16 }}>⚠️ {error}</div>}

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => handleTitle(e.target.value)} placeholder="10 Best Educational Toys for Kids…" />
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="10-best-educational-toys" />
            </div>
            <div className="form-group">
              <label className="form-label">Tag / Category</label>
              <input className="form-input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Parenting Tips" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hero Image</label>
            {form.image_url ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <img src={form.image_url} alt="" style={{ width:80, height:60, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />
                <button className="btn btn-outline btn-sm" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>Remove</button>
              </div>
            ) : null}
            <input type="file" accept="image/*" disabled={uploading}
              onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file) }} />
            {uploading && <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:4 }}>⏳ Uploading…</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Excerpt</label>
            <textarea className="form-input" rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Brief summary shown in listing…" />
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="form-input" rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full blog post content (supports Markdown)…" />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'published' | 'draft' }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? '⏳ Saving…' : isEdit ? '💾 Update Post' : '✅ Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [editPost, setEditPost] = useState<ApiBlogPost | null | undefined>(undefined)

  const { data: posts, loading, error, refetch } = useAdminFetch(fetchBlogPosts, [])

  const filtered = (posts ?? []).filter((p) => {
    if (activeTab === 'Published') return p.status === 'published'
    if (activeTab === 'Drafts')    return p.status === 'draft'
    return true
  })

  const published = (posts ?? []).filter((p) => p.status === 'published')
  const drafts    = (posts ?? []).filter((p) => p.status === 'draft')
  const totalViews = (posts ?? []).reduce((a, p) => a + (p.views ?? 0), 0)
  const totalComments = (posts ?? []).reduce((a, p) => a + (p.comments ?? 0), 0)

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Blog Manager</div>
          <div className="ph-sub">Manage posts, drafts and content strategy</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
          <button className="btn btn-primary" onClick={() => setEditPost(null)}>✏️ New Post</button>
        </div>
      </div>

      {/* Stats */}
      <div className="blog-stats">
        {[
          { icon: '📝', bg: 'var(--coral-light)', val: loading ? '…' : String(published.length), label: 'Published Posts' },
          { icon: '📄', bg: 'var(--sun-light)',   val: loading ? '…' : String(drafts.length),    label: 'Drafts' },
          { icon: '👁', bg: 'var(--mint-light)',  val: loading ? '…' : totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews), label: 'Total Views' },
          { icon: '💬', bg: 'var(--sky-light)',   val: loading ? '…' : String(totalComments), label: 'Comments' },
        ].map((s) => (
          <div key={s.label} className="blog-stat">
            <div className="bst-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div><div className="bst-val">{s.val}</div><div className="bst-lbl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {error && <div className="card" style={{ padding: 16, color: 'var(--coral)' }}>⚠️ {error}</div>}

      <div className="card">
        <div className="card-head">
          <FilterTabs tabs={['All', 'Published', 'Drafts']} active={activeTab} onChange={setActiveTab} />
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 120, background: 'var(--soft-2)', borderRadius: 10, marginBottom: 12 }} />
              ))
            : filtered.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', gap: 16, padding: '14px 0',
                  borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: 'linear-gradient(135deg,#FFF3D4,#FFDEA0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    📝
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: '.88rem' }}>{p.title}</span>
                      <span className={`pill ${p.status === 'published' ? 'pill-green' : 'pill-yellow'}`}>{p.status === 'published' ? 'Published' : 'Draft'}</span>
                      <span style={{ background: 'var(--mint-light)', color: '#1A9980', fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{p.tag}</span>
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 6 }}>{p.excerpt}</div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '.72rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                      {p.views    > 0 && <span>👁 {p.views.toLocaleString()} views</span>}
                      {p.comments > 0 && <span>💬 {p.comments} comments</span>}
                      {p.likes    > 0 && <span>❤️ {p.likes} likes</span>}
                      <span>📅 {new Date(p.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditPost(p)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      if (confirm(`Delete post "${p.title}"?`)) {
                        try { await deleteBlogPost(p.id); refetch() } catch (err: any) { alert(err.message) }
                      }
                    }}>🗑</button>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {editPost !== undefined && (
        <BlogPostForm post={editPost} onClose={() => setEditPost(undefined)} onSaved={refetch} />
      )}
    </div>
  )
}
