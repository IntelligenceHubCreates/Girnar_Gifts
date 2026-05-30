'use client'

import { useState } from 'react'
import FilterTabs from '../ui/FilterTabs'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, type ApiBlogPost } from '@/lib/adminApi'

// ── Blog Post Form ────────────────────────────────────────────────

function BlogPostForm({ post, onClose, onSaved }: { post?: ApiBlogPost | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!post

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError(null)
    const fd = e.currentTarget
    const data = {
      title:   (fd.elements.namedItem('title') as HTMLInputElement).value,
      slug:    (fd.elements.namedItem('slug') as HTMLInputElement).value,
      excerpt: (fd.elements.namedItem('excerpt') as HTMLTextAreaElement).value,
      content: (fd.elements.namedItem('content') as HTMLTextAreaElement).value,
      tag:     (fd.elements.namedItem('tag') as HTMLInputElement).value,
      status:  (fd.elements.namedItem('status') as HTMLSelectElement).value as 'published' | 'draft',
    }
    try {
      if (isEdit) await updateBlogPost(post!.id, data)
      else        await createBlogPost(data)
      onSaved(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  // Auto-generate slug from title
  function titleToSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Post' : '✏️ New Blog Post'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && <div style={{ background: '#FFF0F0', border: '1px solid var(--coral)', borderRadius: 8, padding: '10px 14px', color: 'var(--coral)', fontSize: '.82rem', marginBottom: 16 }}>⚠️ {error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input name="title" className="form-input" required defaultValue={post?.title} placeholder="10 Best Educational Toys for Kids…"
                onChange={(e) => {
                  const slugEl = (e.target.form?.elements.namedItem('slug') as HTMLInputElement)
                  if (slugEl && !isEdit) slugEl.value = titleToSlug(e.target.value)
                }} />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input name="slug" className="form-input" required defaultValue={post?.slug} placeholder="10-best-educational-toys" />
              </div>
              <div className="form-group">
                <label className="form-label">Tag / Category *</label>
                <input name="tag" className="form-input" required defaultValue={post?.tag} placeholder="Parenting Tips" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Excerpt *</label>
              <textarea name="excerpt" className="form-input" rows={2} required defaultValue={post?.excerpt} placeholder="Brief summary shown in listing…" />
            </div>

            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea name="content" className="form-input" rows={10} required defaultValue={post?.content} placeholder="Full blog post content (supports Markdown)…" />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" defaultValue={post?.status ?? 'draft'}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : isEdit ? '💾 Update Post' : '✅ Publish'}</button>
          </div>
        </form>
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
