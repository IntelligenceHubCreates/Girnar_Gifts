'use client'

import { useState, useRef, useCallback } from 'react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminProducts, fetchCategories, createProduct, updateProduct, deleteProduct,
  type ApiProduct, type ApiCategory,
} from '@/lib/adminApi'

// ── Types ─────────────────────────────────────────────────────────

interface ColorVariantEntry {
  name:   string          // "Pink"
  hex:    string          // "#F4A7B9"
  images: string[]        // already-uploaded Cloudinary URLs for this color
  files?: File[]          // new files chosen by admin (not yet uploaded)
}

// ── Helpers ───────────────────────────────────────────────────────

function stockLabel(count: number) {
  if (count <= 0)  return { label: 'Out of Stock', cls: 'out-s' }
  if (count <= 10) return { label: `Low Stock (${count})`, cls: 'low-s' }
  return { label: `In Stock (${count})`, cls: 'in-s' }
}

function flattenCategories(
  cats: ApiCategory[], depth = 0
): { id: string; name: string; slug: string }[] {
  const result: { id: string; name: string; slug: string }[] = []
  for (const c of cats) {
    result.push({ id: c.id, name: `${'— '.repeat(depth)}${c.name}`, slug: c.slug })
    if (c.children?.length) result.push(...flattenCategories(c.children, depth + 1))
  }
  return result
}

// Converts a File to a base64 data-URL for preview
function fileToPreview(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload  = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

// ── Color Variant Editor ──────────────────────────────────────────

interface ColorVariantEditorProps {
  variants: ColorVariantEntry[]
  onChange: (variants: ColorVariantEntry[]) => void
}

function ColorVariantEditor({ variants, onChange }: ColorVariantEditorProps) {
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  function addVariant() {
    onChange([...variants, { name: '', hex: '#FF6B5B', images: [], files: [] }])
  }

  function removeVariant(idx: number) {
    onChange(variants.filter((_, i) => i !== idx))
  }

  function updateField<K extends keyof ColorVariantEntry>(
    idx: number, field: K, value: ColorVariantEntry[K]
  ) {
    const next = variants.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    onChange(next)
  }

  async function handleFiles(idx: number, files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArr = Array.from(files)
    // Generate previews so admin can see what they selected
    const previews = await Promise.all(fileArr.map(fileToPreview))
    const next = variants.map((v, i) => {
      if (i !== idx) return v
      return {
        ...v,
        files: [...(v.files ?? []), ...fileArr],
        // Merge preview URLs into images array so UI shows them immediately
        images: [...v.images, ...previews],
      }
    })
    onChange(next)
  }

  function removeImage(variantIdx: number, imgIdx: number) {
    const next = variants.map((v, i) => {
      if (i !== variantIdx) return v
      const newImages = v.images.filter((_, ii) => ii !== imgIdx)
      // Also remove the corresponding file if it was a newly added one
      const existingCount = v.images.length - (v.files?.length ?? 0)
      const newFiles = imgIdx >= existingCount
        ? (v.files ?? []).filter((_, fi) => fi !== (imgIdx - existingCount))
        : v.files ?? []
      return { ...v, images: newImages, files: newFiles }
    })
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {variants.length === 0 && (
        <div style={{
          background: '#faf8f5', border: '1.5px dashed #e0d8cf',
          borderRadius: 12, padding: '16px', textAlign: 'center',
          fontSize: '.82rem', color: 'var(--muted)',
        }}>
          No color variants added yet. Click "+ Add Color" to add one.
        </div>
      )}

      {variants.map((cv, idx) => (
        <div key={idx} style={{
          background: '#faf8f5', border: '1.5px solid #e8e0d5',
          borderRadius: 14, padding: '14px 16px', position: 'relative',
        }}>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeVariant(idx)}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 26, height: 26, borderRadius: '50%',
              border: 'none', background: '#ffe4e1', color: 'var(--coral)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Remove this color"
          >✕</button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
            {/* Color name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Color Name *</label>
              <input
                className="form-input"
                value={cv.name}
                placeholder="e.g. Pink, Orange, Blue"
                onChange={(e) => updateField(idx, 'name', e.target.value)}
                style={{ height: 38 }}
              />
            </div>

            {/* Hex picker */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="color"
                  value={cv.hex}
                  onChange={(e) => updateField(idx, 'hex', e.target.value)}
                  style={{
                    width: 38, height: 38, padding: 2, cursor: 'pointer',
                    border: '1.5px solid #e0d8cf', borderRadius: 8,
                  }}
                  title="Pick color"
                />
                <input
                  className="form-input"
                  value={cv.hex}
                  placeholder="#F4A7B9"
                  maxLength={7}
                  onChange={(e) => updateField(idx, 'hex', e.target.value)}
                  style={{ width: 90, height: 38, fontFamily: 'monospace', fontSize: '.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* Color preview swatch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: cv.hex, border: '2px solid #e0d8cf', flexShrink: 0,
            }} />
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              {cv.name || 'Unnamed'} — {cv.hex}
            </span>
          </div>

          {/* Images for this color */}
          <div>
            <label className="form-label" style={{ fontSize: '.75rem', marginBottom: 6 }}>
              Images for this color
            </label>

            {/* Existing / preview images */}
            {cv.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {cv.images.map((url, imgIdx) => (
                  <div key={imgIdx} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`${cv.name} ${imgIdx + 1}`}
                      style={{
                        width: 64, height: 64, objectFit: 'cover',
                        borderRadius: 10, border: '1.5px solid #e0d8cf',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, imgIdx)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 20, height: 20, borderRadius: '50%',
                        border: 'none', background: '#e74c3c', color: '#fff',
                        fontWeight: 700, fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone */}
            <div
              style={{
                border: '2px dashed #e0d8cf', borderRadius: 10,
                padding: '10px 14px', textAlign: 'center',
                cursor: 'pointer', fontSize: '.78rem', color: 'var(--muted)',
                background: '#fff',
              }}
              onClick={() => fileRefs.current[idx]?.click()}
            >
              📷 Click to upload images for {cv.name || 'this color'}
            </div>
            <input
              ref={(el) => { fileRefs.current[idx] = el }}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(idx, e.target.files)}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={addVariant}
        style={{ alignSelf: 'flex-start', border: '1.5px dashed var(--coral)', color: 'var(--coral)' }}
      >
        + Add Color
      </button>
    </div>
  )
}

// ── Product Form ──────────────────────────────────────────────────

interface ProductFormProps {
  product?: ApiProduct | null
  categories: { id: string; name: string; slug: string }[]
  onClose: () => void
  onSaved: () => void
}

function ProductForm({ product, categories, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [details, setDetails] = useState<string[]>(product?.details ?? [''])
  const fileRef = useRef<HTMLInputElement>(null)

  // Parse existing color_variants from the product (if editing)
  const parseExistingVariants = (): ColorVariantEntry[] => {
    const raw = (product as any)?.color_variants
    if (!Array.isArray(raw)) return []
    return raw.map((cv: any) => ({
      name:   cv.name   ?? '',
      hex:    cv.hex    ?? '#ffffff',
      images: Array.isArray(cv.images) ? cv.images : [],
      files:  [],
    }))
  }

  const [colorVariants, setColorVariants] = useState<ColorVariantEntry[]>(parseExistingVariants)

  const existingImages = product?.product_image ?? []

  // Tracks which existing images the admin wants to keep.
  // Starts as all existing images; admin can remove any.
  const [keptImages, setKeptImages] = useState<any[]>(existingImages)

  function removeKeptImage(idx: number) {
    setKeptImages((prev) => prev.filter((_, i) => i !== idx))
  }

  // Video state
  const existingVideoUrl = (product as any)?.product_video ?? ''
  const [videoFile,    setVideoFile]    = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>(existingVideoUrl)
  const [removeVideo,  setRemoveVideo]  = useState(false)
  const videoRef = useRef<HTMLInputElement>(null)

  function handleVideoFile(file: File | null) {
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
    setRemoveVideo(false)
  }

  function handleRemoveVideo() {
    setVideoFile(null)
    setVideoPreview('')
    setRemoveVideo(true)
    if (videoRef.current) videoRef.current.value = ''
  }


  // ── FIXED handleSubmit ────────────────────────────────────────
  // Key changes vs original:
  //   1. Read ALL file ArrayBuffers upfront before any fetch() call
  //      — prevents "stream already consumed" error on 3rd+ variant
  //   2. Upload all variants in parallel with Promise.all
  //      — faster and avoids sequential await-fetch interleaving
  //   3. Reconstruct File from stored ArrayBuffer when building
  //      upload FormData — safe because ArrayBuffer is plain memory
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const fd   = e.currentTarget
      const form = new FormData()

      form.append('productName',           (fd.elements.namedItem('name')            as HTMLInputElement).value)
      form.append('productCategory',       (fd.elements.namedItem('category')        as HTMLInputElement).value)
      form.append('productCategorySlug',   (fd.elements.namedItem('categorySlug')    as HTMLInputElement).value)
      form.append('productDescription',    (fd.elements.namedItem('description')     as HTMLTextAreaElement).value)
      form.append('productPrice',          (fd.elements.namedItem('price')           as HTMLInputElement).value)
      form.append('productCount',          (fd.elements.namedItem('count')           as HTMLInputElement).value)
      form.append('productDiscount',       (fd.elements.namedItem('discount')        as HTMLInputElement).value)
      form.append('productDiscountAmount', (fd.elements.namedItem('discountAmount')  as HTMLInputElement).value)
      details.filter(Boolean).forEach((d) => form.append('productDetails', d))

      if (isEdit) {
        form.append('oldProductImages', JSON.stringify(keptImages))
      }
      imageFiles.forEach((f) => form.append('productImages', f))

      // ── Step 1: Read ALL file buffers upfront before any fetch ──
      // File.arrayBuffer() consumes the internal stream. Reading all
      // buffers first (before any fetch calls) prevents the stream
      // from being garbage-collected on the 3rd+ variant.
      const variantBuffers: {
        variantIdx: number
        name: string
        buf: ArrayBuffer
        type: string
      }[][] = []

      for (let i = 0; i < colorVariants.length; i++) {
        const files = colorVariants[i].files ?? []
        const group = await Promise.all(
          files.map(async (f) => ({
            variantIdx: i,
            name:       f.name,
            buf:        await f.arrayBuffer(),  // read once, store as plain memory
            type:       f.type || 'image/jpeg',
          }))
        )
        variantBuffers.push(group)
      }

      // ── Step 2: Upload all variant images in parallel ───────────
      const uploadedUrlsByVariant: string[][] = colorVariants.map(() => [])

      await Promise.all(
        colorVariants.map(async (cv, i) => {
          const group = variantBuffers[i]
          if (!group || group.length === 0) return

          const uploadFd = new FormData()
          group.forEach(({ name, buf, type }) => {
            // Reconstruct File from the already-read ArrayBuffer — never fails
            uploadFd.append('files', new File([buf], name, { type }))
          })

          let uploadRes: Response
          try {
            uploadRes = await fetch('/api/product/upload/images', {
              method:      'POST',
              body:        uploadFd,
              credentials: 'include',
            })
          } catch (networkErr) {
            throw new Error(`Network error uploading images for "${cv.name}". Check your connection.`)
          }

          if (!uploadRes.ok) {
            let detail = `Upload failed for "${cv.name}" (status ${uploadRes.status})`
            try {
              const errData = await uploadRes.json()
              if (errData?.detail) detail = errData.detail
            } catch { /* ignore */ }
            throw new Error(detail)
          }

          const uploadData = await uploadRes.json()
          const urls: string[] = Array.isArray(uploadData.urls)
            ? uploadData.urls
            : Array.isArray(uploadData.images)
              ? uploadData.images.map((img: any) => (typeof img === 'string' ? img : img?.url ?? ''))
              : []

          uploadedUrlsByVariant[i] = urls.filter(Boolean)
        })
      )

      // ── Step 2b: Upload video if a new file was selected ──────────
      if (videoFile) {
        const videoBuf  = await videoFile.arrayBuffer()
        const uploadFd  = new FormData()
        uploadFd.append('file', new File([videoBuf], videoFile.name, { type: videoFile.type }))

        // Upload video DIRECTLY to FastAPI — bypass Next.js proxy entirely.
        // Next.js has a hard body size limit that kills large file proxying.
        const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
        const vRes = await fetch(`${BACKEND}/api/product/upload/video`, {
          method:      'POST',
          body:        uploadFd,
          credentials: 'include',
        })
        if (!vRes.ok) {
          let detail = `Video upload failed (HTTP ${vRes.status})`
          try { const e = await vRes.json(); if (e?.detail) detail = e.detail } catch {}
          throw new Error(detail)
        }
        const vData = await vRes.json()
        form.append('productVideo', vData.url ?? '')
      } else if (removeVideo) {
        // admin explicitly removed the video
        form.append('productVideo', '')
      } else if (existingVideoUrl) {
        // keep existing
        form.append('productVideo', existingVideoUrl)
      }

      // ── Step 3: Build final color_variants payload ──────────────
      const finalVariants = colorVariants
        .filter((cv) => cv.name.trim())
        .map((cv, i) => {
          // Keep existing Cloudinary URLs, discard base64 previews
          const existingUrls = cv.images.filter(
            (url) => url.startsWith('http') || url.startsWith('//')
          )
          return {
            name:   cv.name.trim(),
            hex:    cv.hex,
            images: [...existingUrls, ...uploadedUrlsByVariant[i]],
          }
        })

      form.append('productColorVariants', JSON.stringify(finalVariants))

      // ── Step 4: Save product ────────────────────────────────────
      if (isEdit) {
        await updateProduct(product!.id, form)
      } else {
        await createProduct(form)
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">{isEdit ? '✏️ Edit Product' : '➕ Add Product'}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="drawer-body">
            {error && (
              <div style={{
                background: '#FFF0F0', border: '1px solid var(--coral)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--coral)',
                fontSize: '.82rem', marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Product Name ── */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                name="name"
                className="form-input"
                required
                defaultValue={product?.name}
                placeholder="e.g. Jelly Backpack"
              />
            </div>

            {/* ── Category ── */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-select" required defaultValue={product?.category ?? ''}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category Slug</label>
                <select name="categorySlug" className="form-select" defaultValue={product?.sub_category_slug ?? ''}>
                  <option value="">Select slug</option>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.slug}</option>)}
                </select>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-input"
                rows={3}
                required
                defaultValue={product?.description ?? ''}
                placeholder="Describe the product…"
              />
            </div>

            {/* ── Pricing ── */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input name="price" type="number" min={1} className="form-input" required defaultValue={product?.original_price} placeholder="999" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Count *</label>
                <input name="count" type="number" min={0} className="form-input" required defaultValue={product?.count} placeholder="50" />
              </div>
              <div className="form-group">
                <label className="form-label">Discount %</label>
                <input name="discount" type="number" min={0} max={100} className="form-input" defaultValue={product?.percentage_discount ?? 0} placeholder="20" />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input name="discountAmount" type="number" min={0} className="form-input" defaultValue={product?.amount_discount ?? 0} placeholder="200" />
              </div>
            </div>

            {/* ── Product Details / Bullet Points ── */}
            <div className="form-group">
              <label className="form-label">Product Details</label>
              {details.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    className="form-input"
                    value={d}
                    placeholder={`Detail point ${i + 1}`}
                    onChange={(e) => {
                      const next = [...details]
                      next[i] = e.target.value
                      setDetails(next)
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setDetails(details.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetails([...details, ''])}>
                + Add Point
              </button>
            </div>

            {/* ── Default Product Images ── */}
            <div className="form-group">
              <label className="form-label">Default Product Images</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>
                Shown on listing pages and when no color variant is selected.
              </p>
              {isEdit && keptImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {keptImages.map((img: any, i: number) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={img.url}
                        alt=""
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeKeptImage(i)}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 20, height: 20, borderRadius: '50%',
                          border: 'none', background: '#e74c3c', color: '#fff',
                          fontWeight: 700, fontSize: 11, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1, padding: 0,
                        }}
                        title="Remove this image"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              {isEdit && keptImages.length === 0 && existingImages.length > 0 && (
                <p style={{ fontSize: '.75rem', color: 'var(--coral)', marginBottom: 8 }}>
                  ⚠️ All existing images removed. Upload new ones below or save to clear them.
                </p>
              )}
              <div
                style={{
                  border: '2px dashed var(--border)', borderRadius: 10,
                  padding: '16px', textAlign: 'center', cursor: 'pointer',
                  fontSize: '.82rem', color: 'var(--muted)',
                }}
                onClick={() => fileRef.current?.click()}
              >
                {imageFiles.length > 0
                  ? `${imageFiles.length} file(s) selected`
                  : '📁 Click to upload images (PNG, JPG, WEBP)'}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
              />
            </div>

            {/* ── Product Video ── */}
            <div className="form-group">
              <label className="form-label">Product Video</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>
                Upload an MP4/WEBM demo video (max 50 MB). Shown on the product page.
              </p>

              {/* Existing or new preview */}
              {videoPreview && !removeVideo && (
                <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                  <video
                    src={videoPreview}
                    controls
                    style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1.5px solid var(--border)', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 24, height: 24, borderRadius: '50%',
                      border: 'none', background: '#e74c3c', color: '#fff',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, padding: 0,
                    }}
                    title="Remove video"
                  >✕</button>
                </div>
              )}

              {/* Upload zone */}
              {(!videoPreview || removeVideo) && (
                <div
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 10,
                    padding: '16px', textAlign: 'center', cursor: 'pointer',
                    fontSize: '.82rem', color: 'var(--muted)', background: '#fafafa',
                  }}
                  onClick={() => videoRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith('video/')) handleVideoFile(file)
                  }}
                >
                  🎬 Click or drag & drop an MP4 / WEBM video
                </div>
              )}

              {/* Change button when video already set */}
              {videoPreview && !removeVideo && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() => videoRef.current?.click()}
                >
                  🔄 Replace Video
                </button>
              )}

              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/webm,video/*"
                style={{ display: 'none' }}
                onChange={(e) => handleVideoFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* ── Color Variants ── */}
            <div className="form-group">
              <label className="form-label">Color Variants</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 10 }}>
                Add each available color with its own images. On the product page,
                clicking a color swatch instantly shows that color's images.
              </p>
              <ColorVariantEditor
                variants={colorVariants}
                onChange={setColorVariants}
              />
            </div>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : isEdit ? '💾 Update Product' : '➕ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────

function DeleteConfirm({
  name, onConfirm, onCancel,
}: {
  name: string; onConfirm: () => void; onCancel: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 40 }}>🗑️</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 12 }}>Delete Product?</div>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', margin: '8px 0 24px' }}>
            <strong>"{name}"</strong> will be permanently deleted. This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={deleting}
              onClick={async () => { setDeleting(true); await onConfirm() }}
            >
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function ProductsPage() {
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter]       = useState('')
  const [editProduct, setEditProduct]       = useState<ApiProduct | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget]     = useState<ApiProduct | null>(null)

  const LIMIT = 12

  const { data: productsRes, loading, error, refetch } = useAdminFetch(
    () => fetchAdminProducts({
      skip:     page * LIMIT,
      limit:    LIMIT,
      search:   search   || undefined,
      category: categoryFilter || undefined,
      in_stock: stockFilter === 'in_stock' ? true : undefined,
    }),
    [page, search, categoryFilter, stockFilter]
  )

  const { data: categoriesRes } = useAdminFetch(fetchCategories, [])
  const flatCats = categoriesRes ? flattenCategories(categoriesRes) : []

  async function handleDelete(product: ApiProduct) {
    try {
      await deleteProduct(product.id)
      refetch()
    } catch (err: any) {
      alert('Delete failed: ' + err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  const products   = productsRes?.data       ?? []
  const totalCount = productsRes?.totalCount  ?? 0
  const totalPages = Math.ceil(totalCount / LIMIT)

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Products</div>
          <div className="ph-sub">{loading ? 'Loading…' : `${totalCount} products`}</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline" onClick={refetch}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => setEditProduct(null)}>➕ Add Product</button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="prod-toolbar">
        <div className="tb-search" style={{ flex: 1, maxWidth: 260 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 160, padding: '7px 30px 7px 12px' }}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
        >
          <option value="">All Categories</option>
          {flatCats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 140, padding: '7px 30px 7px 12px' }}
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); setPage(0) }}
        >
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--coral)' }}>
          ⚠️ {error}
          <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>Retry</button>
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="prod-grid">
        {loading
          ? Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="pc">
                <div className="pc-thumb" style={{ background: 'var(--soft-2)' }} />
                <div className="pc-body">
                  <div style={{ height: 12, background: 'var(--soft-2)', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 10, background: 'var(--soft-2)', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))
          : products.map((p) => {
              const stock = stockLabel(p.count)
              const img   = p.product_image?.[0]?.url
              const discountedPrice = p.original_price - p.amount_discount

              const cvArr: any[] = Array.isArray((p as any).color_variants)
                ? (p as any).color_variants
                : []

              return (
                <div key={p.id} className="pc">
                  <div
                    className="pc-thumb"
                    style={{ background: 'linear-gradient(135deg,#FFF3D4,#FFE099)', overflow: 'hidden', position: 'relative' }}
                  >
                    {p.amount_discount > 0 && (
                      <div className="pc-badge-wrap">
                        <span className="pc-badge pc-badge-sale">-{p.percentage_discount}%</span>
                      </div>
                    )}
                    {img
                      ? (
                        <img
                          src={img}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10%', boxSizing: 'border-box', display: 'block' }}
                        />
                      )
                      : <span style={{ fontSize: 40 }}>🧸</span>
                    }
                  </div>
                  <div className="pc-body">
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-cat">{p.category ?? '—'}</div>

                    {/* Color variant dots */}
                    {cvArr.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                        {cvArr.map((cv: any, i: number) => (
                          <span
                            key={i}
                            title={cv.name}
                            style={{
                              width: 14, height: 14, borderRadius: '50%',
                              background: cv.hex ?? '#ccc',
                              border: '1.5px solid rgba(0,0,0,0.12)',
                              display: 'inline-block', flexShrink: 0,
                            }}
                          />
                        ))}
                        <span style={{ fontSize: '.68rem', color: 'var(--muted)', alignSelf: 'center' }}>
                          {cvArr.length} color{cvArr.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="pc-row">
                      <div>
                        <span className="pc-price">₹{discountedPrice.toLocaleString()}</span>
                        {p.amount_discount > 0 && (
                          <span className="pc-orig">₹{p.original_price.toLocaleString()}</span>
                        )}
                      </div>
                      <span className={`pc-stock-tag ${stock.cls}`}>{stock.label}</span>
                    </div>
                    <div className="pc-footer">
                      <button className="btn btn-outline btn-sm" onClick={() => setEditProduct(p)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>🗑 Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
            <button key={i} className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── Add/Edit Drawer ── */}
      {editProduct !== undefined && (
        <ProductForm
          product={editProduct}
          categories={flatCats}
          onClose={() => setEditProduct(undefined)}
          onSaved={refetch}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}