'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminFetch } from '@/hooks/useAdminFetch'
import {
  fetchAdminProducts, fetchCategories, createProduct, updateProduct, deleteProduct, createCategory,
  type ApiProduct, type ApiCategory,
} from '@/lib/adminApi'

// ── Types ─────────────────────────────────────────────────────────

interface ColorVariantEntry {
  name:   string
  hex:    string
  images: string[]
  files?: File[]
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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const NEW_SUBCAT_VALUE = '__new__'

// Unprefixed flatten (unlike flattenCategories above, which prefixes names
// with "— " for display in a dropdown) - used to check a typed sub-category
// name/slug against every category that exists anywhere in the tree, not
// just the children of whichever main category is currently selected.
// Category slugs are globally unique, so a name that already exists under a
// *different* main category still needs to be reused rather than re-created.
function flattenAll(cats: ApiCategory[]): ApiCategory[] {
  const result: ApiCategory[] = []
  for (const c of cats) {
    result.push(c)
    if (c.children?.length) result.push(...flattenAll(c.children))
  }
  return result
}

function fileToPreview(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload  = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

// Live final-price preview (D4: ₹ amount_discount is the source of truth)
function computeFinalPrice(price: number, amountOff: number) {
  const p = Number.isFinite(price) ? price : 0
  const a = Number.isFinite(amountOff) ? amountOff : 0
  const final = Math.max(0, p - a)
  const pct = p > 0 ? Math.round((a / p) * 100) : 0
  return { final, pct }
}

// ── Color Variant Editor (UNCHANGED — working machinery) ──────────

interface ColorVariantEditorProps {
  variants: ColorVariantEntry[]
  onChange: (variants: ColorVariantEntry[]) => void
}

function ColorVariantEditor({ variants, onChange }: ColorVariantEditorProps) {
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  function addVariant() {
    onChange([...variants, { name: '', hex: '#7A1E33', images: [], files: [] }])
  }
  function removeVariant(idx: number) {
    onChange(variants.filter((_, i) => i !== idx))
  }
  function updateField<K extends keyof ColorVariantEntry>(idx: number, field: K, value: ColorVariantEntry[K]) {
    onChange(variants.map((v, i) => i === idx ? { ...v, [field]: value } : v))
  }
  async function handleFiles(idx: number, files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArr = Array.from(files)
    const previews = await Promise.all(fileArr.map(fileToPreview))
    onChange(variants.map((v, i) => {
      if (i !== idx) return v
      return { ...v, files: [...(v.files ?? []), ...fileArr], images: [...v.images, ...previews] }
    }))
  }
  function removeImage(variantIdx: number, imgIdx: number) {
    onChange(variants.map((v, i) => {
      if (i !== variantIdx) return v
      const newImages = v.images.filter((_, ii) => ii !== imgIdx)
      const existingCount = v.images.length - (v.files?.length ?? 0)
      const newFiles = imgIdx >= existingCount
        ? (v.files ?? []).filter((_, fi) => fi !== (imgIdx - existingCount))
        : v.files ?? []
      return { ...v, images: newImages, files: newFiles }
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {variants.length === 0 && (
        <div style={{ background: 'var(--gg-muted-fill)', border: '1.5px dashed var(--gg-border)', borderRadius: 12, padding: '16px', textAlign: 'center', fontSize: '.82rem', color: 'var(--muted)' }}>
          No color variants added yet. Click "+ Add Color" to add one.
        </div>
      )}
      {variants.map((cv, idx) => (
        <div key={idx} style={{ background: 'var(--gg-muted-fill)', border: '1.5px solid var(--gg-border)', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
          <button type="button" onClick={() => removeVariant(idx)} style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', border: 'none', background: '#ffe4e1', color: 'var(--coral)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove this color">✕</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Color Name *</label>
              <input className="form-input" value={cv.name} placeholder="e.g. Pink, Orange, Blue" onChange={(e) => updateField(idx, 'name', e.target.value)} style={{ height: 38 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={cv.hex} onChange={(e) => updateField(idx, 'hex', e.target.value)} style={{ width: 38, height: 38, padding: 2, cursor: 'pointer', border: '1.5px solid var(--gg-border)', borderRadius: 8 }} title="Pick color" />
                <input className="form-input" value={cv.hex} placeholder="#F4A7B9" maxLength={7} onChange={(e) => updateField(idx, 'hex', e.target.value)} style={{ width: 90, height: 38, fontFamily: 'monospace', fontSize: '.82rem' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: cv.hex, border: '2px solid var(--gg-border)', flexShrink: 0 }} />
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{cv.name || 'Unnamed'} — {cv.hex}</span>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '.75rem', marginBottom: 6 }}>Images for this color</label>
            {cv.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {cv.images.map((url, imgIdx) => (
                  <div key={imgIdx} style={{ position: 'relative' }}>
                    <img src={url} alt={`${cv.name} ${imgIdx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--gg-border)' }} />
                    <button type="button" onClick={() => removeImage(idx, imgIdx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#e74c3c', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ border: '2px dashed var(--gg-border)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', cursor: 'pointer', fontSize: '.78rem', color: 'var(--muted)', background: '#fff' }} onClick={() => fileRefs.current[idx]?.click()}>
              📷 Click to upload images for {cv.name || 'this color'}
            </div>
            <input ref={(el) => { fileRefs.current[idx] = el }} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(idx, e.target.files)} />
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={addVariant} style={{ alignSelf: 'flex-start', border: '1.5px dashed var(--coral)', color: 'var(--coral)' }}>
        + Add Color
      </button>
    </div>
  )
}

// ── Product Form ──────────────────────────────────────────────────

interface ProductFormProps {
  product?: ApiProduct | null
  categoryTree: ApiCategory[]
  onClose: () => void
  onSaved: () => void
}

function ProductForm({ product, categoryTree, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product
  const { data: adminSession } = useSession()
  const adminToken = (adminSession as any)?.accessToken as string | undefined
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Sub-category picker: a real dropdown listing every sub-category that
  // already exists under the selected main category, so the admin can see
  // and reuse one at a glance - plus a "+ Create new" option that reveals a
  // text input, instead of requiring them to already know/retype an exact
  // existing name (see MANUAL_STEPS.md — subcategories are added by the
  // admin from here now, instead of requiring a trip to the separate
  // Categories screen first).
  const [selectedCategoryName, setSelectedCategoryName] = useState(product?.category ?? '')
  const selectedCategoryNode = categoryTree.find((c) => c.name === selectedCategoryName)
  const subcategoryOptions = selectedCategoryNode?.children ?? []
  const [subcategorySelectValue, setSubcategorySelectValue] = useState(product?.sub_category_slug ?? '')
  const [subcategoryInput, setSubcategoryInput] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [details, setDetails] = useState<string[]>(product?.details?.length ? product.details : [''])
  const fileRef = useRef<HTMLInputElement>(null)

  // Live final-price preview state (D4)
  const [pricePreview, setPricePreview] = useState({
    price: product?.original_price ?? 0,
    amount: product?.amount_discount ?? 0,
  })
  const { final: finalPrice, pct: derivedPct } = computeFinalPrice(pricePreview.price, pricePreview.amount)

  const parseExistingVariants = (): ColorVariantEntry[] => {
    const raw = (product as any)?.color_variants
    if (!Array.isArray(raw)) return []
    return raw.map((cv: any) => ({ name: cv.name ?? '', hex: cv.hex ?? '#ffffff', images: Array.isArray(cv.images) ? cv.images : [], files: [] }))
  }
  const [colorVariants, setColorVariants] = useState<ColorVariantEntry[]>(parseExistingVariants)
  const [isFeatured, setIsFeatured] = useState<boolean>((product as any)?.is_featured ?? false)

  const existingImages = product?.product_image ?? []
  const [keptImages, setKeptImages] = useState<any[]>(existingImages)
  function removeKeptImage(idx: number) { setKeptImages((prev) => prev.filter((_, i) => i !== idx)) }

  // Video (UNCHANGED machinery) + object-URL cleanup (new)
  const existingVideoUrl = (product as any)?.product_video ?? ''
  const [videoFile,    setVideoFile]    = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>(existingVideoUrl)
  const [removeVideo,  setRemoveVideo]  = useState(false)
  const videoRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  function handleVideoFile(file: File | null) {
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setVideoFile(file)
    setVideoPreview(url)
    setRemoveVideo(false)
  }
  function handleRemoveVideo() {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null }
    setVideoFile(null); setVideoPreview(''); setRemoveVideo(true)
    if (videoRef.current) videoRef.current.value = ''
  }
  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current) }, [])

  // Client-side validation (item 19)
  function validate(fd: HTMLFormElement): boolean {
    const errs: Record<string, string> = {}
    const name  = (fd.elements.namedItem('name') as HTMLInputElement)?.value.trim()
    const cat   = (fd.elements.namedItem('category') as HTMLSelectElement)?.value
    const desc  = (fd.elements.namedItem('description') as HTMLTextAreaElement)?.value.trim()
    const price = Number((fd.elements.namedItem('price') as HTMLInputElement)?.value)
    const count = Number((fd.elements.namedItem('count') as HTMLInputElement)?.value)
    const disc  = Number((fd.elements.namedItem('discountAmount') as HTMLInputElement)?.value)

    if (!name)  errs.name = 'Product name is required'
    if (!cat)   errs.category = 'Select a category'
    if (!desc)  errs.description = 'Description is required'
    if (!Number.isFinite(price) || price <= 0) errs.price = 'Price must be greater than 0'
    if (!Number.isFinite(count) || count < 0)  errs.count = 'Stock cannot be negative'
    if (disc > price) errs.discountAmount = 'Discount cannot exceed price'

    const hasDefaultImages = keptImages.length > 0 || imageFiles.length > 0
    const hasVariantImages = colorVariants.some((cv) => cv.name.trim() && (cv.images.length > 0 || (cv.files?.length ?? 0) > 0))
    if (!hasDefaultImages && !hasVariantImages) {
      errs.images = 'Add at least one product image (default or color variant)'
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── handleSubmit — upload pipeline UNCHANGED (parallel arrayBuffer) ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = e.currentTarget
    if (!validate(fd)) { setError('Please fix the highlighted fields.'); return }
    setSaving(true)

    try {
      // Resolve the sub-category before touching uploads. Picking an
      // existing one from the dropdown already gives us its slug directly.
      // "+ Create new" needs a name typed in - reuse an existing category
      // anywhere in the tree if the typed name (or the slug it would
      // generate) already matches one, since slugs are globally unique and
      // creating a duplicate would 409. Only create a new one if it truly
      // doesn't exist anywhere yet.
      let subcategorySlug = ''
      if (subcategorySelectValue === NEW_SUBCAT_VALUE) {
        const typedSubcat = subcategoryInput.trim()
        if (typedSubcat) {
          const typedSlug = slugify(typedSubcat)
          const existing = flattenAll(categoryTree).find(
            (c) => c.slug === typedSlug || c.name.toLowerCase() === typedSubcat.toLowerCase(),
          )
          if (existing) {
            subcategorySlug = existing.slug
          } else if (selectedCategoryNode) {
            try {
              const created = await createCategory({
                name: typedSubcat,
                slug: typedSlug,
                parent_id: selectedCategoryNode.id,
              })
              subcategorySlug = created.slug
            } catch (err: any) {
              throw new Error(
                /already exists/i.test(err?.message ?? '')
                  ? `A sub-category named "${typedSubcat}" already exists — pick it from the dropdown instead.`
                  : (err?.message ?? 'Could not create the sub-category'),
              )
            }
          }
        }
      } else if (subcategorySelectValue) {
        subcategorySlug = subcategorySelectValue
      }

      const form = new FormData()
      form.append('productName',           (fd.elements.namedItem('name')            as HTMLInputElement).value)
      form.append('productCategory',       (fd.elements.namedItem('category')        as HTMLInputElement).value)
      form.append('productCategorySlug',   subcategorySlug)
      form.append('productDescription',    (fd.elements.namedItem('description')     as HTMLTextAreaElement).value)
      form.append('productPrice',          (fd.elements.namedItem('price')           as HTMLInputElement).value)
      form.append('productCount',          (fd.elements.namedItem('count')           as HTMLInputElement).value)
      form.append('productDiscount',       (fd.elements.namedItem('discount')        as HTMLInputElement).value)
      form.append('productDiscountAmount', (fd.elements.namedItem('discountAmount')  as HTMLInputElement).value)
      details.filter(Boolean).forEach((d) => form.append('productDetails', d))

      if (isEdit) form.append('oldProductImages', JSON.stringify(keptImages))
      imageFiles.forEach((f) => form.append('productImages', f))

      // Read ALL variant file buffers upfront (prevents consumed-stream on 3rd+ variant)
      const variantBuffers: { variantIdx: number; name: string; buf: ArrayBuffer; type: string }[][] = []
      for (let i = 0; i < colorVariants.length; i++) {
        const files = colorVariants[i].files ?? []
        const group = await Promise.all(files.map(async (f) => ({
          variantIdx: i, name: f.name, buf: await f.arrayBuffer(), type: f.type || 'image/jpeg',
        })))
        variantBuffers.push(group)
      }

      const uploadedUrlsByVariant: string[][] = colorVariants.map(() => [])
      await Promise.all(colorVariants.map(async (cv, i) => {
        const group = variantBuffers[i]
        if (!group || group.length === 0) return
        const uploadFd = new FormData()
        group.forEach(({ name, buf, type }) => uploadFd.append('files', new File([buf], name, { type })))
        let uploadRes: Response
        try {
          uploadRes = await fetch('/api/product/upload/images', {
            method: 'POST', body: uploadFd, credentials: 'include',
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
          })
        } catch { throw new Error(`Network error uploading images for "${cv.name}". Check your connection.`) }
        if (!uploadRes.ok) {
          let detail = `Upload failed for "${cv.name}" (status ${uploadRes.status})`
          try { const errData = await uploadRes.json(); if (errData?.detail) detail = errData.detail } catch {}
          throw new Error(detail)
        }
        const uploadData = await uploadRes.json()
        const urls: string[] = Array.isArray(uploadData.urls) ? uploadData.urls
          : Array.isArray(uploadData.images) ? uploadData.images.map((img: any) => (typeof img === 'string' ? img : img?.url ?? '')) : []
        uploadedUrlsByVariant[i] = urls.filter(Boolean)
      }))

      if (videoFile) {
        const videoBuf = await videoFile.arrayBuffer()
        const uploadFd = new FormData()
        uploadFd.append('file', new File([videoBuf], videoFile.name, { type: videoFile.type }))
        const vRes = await fetch(`/api/product/upload/video`, {
          method: 'POST', body: uploadFd, credentials: 'include',
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
        })
        if (!vRes.ok) { let detail = `Video upload failed (HTTP ${vRes.status})`; try { const er = await vRes.json(); if (er?.detail) detail = er.detail } catch {} ; throw new Error(detail) }
        const vData = await vRes.json()
        form.append('productVideo', vData.url ?? '')
      } else if (removeVideo) {
        // Send an explicit delete flag — empty string is coerced to None by FastAPI/Pydantic v2
        // before the `if productVideo is not None` guard runs, so the video never gets cleared.
        form.append('deleteVideo', 'true')
      } else if (existingVideoUrl) { form.append('productVideo', existingVideoUrl) }

      const finalVariants = colorVariants.filter((cv) => cv.name.trim()).map((cv, i) => {
        const existingUrls = cv.images.filter((url) => url.startsWith('http') || url.startsWith('//'))
        return { name: cv.name.trim(), hex: cv.hex, images: [...existingUrls, ...uploadedUrlsByVariant[i]] }
      })
      form.append('productColorVariants', JSON.stringify(finalVariants))
      form.append('productFeatured', String(isFeatured))

      if (isEdit) await updateProduct(product!.id, form)
      else        await createProduct(form)

      onSaved(); onClose()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const errStyle = (k: string) => fieldErrors[k] ? { borderColor: 'var(--coral)' } : undefined
  const errMsg = (k: string) => fieldErrors[k] ? <span style={{ fontSize: '.7rem', color: 'var(--coral)', fontWeight: 700 }}>{fieldErrors[k]}</span> : null

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
              <div style={{ background: '#FFF0F0', border: '1px solid var(--coral)', borderRadius: 8, padding: '10px 14px', color: 'var(--coral)', fontSize: '.82rem', marginBottom: 16 }}>⚠️ {error}</div>
            )}

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input name="name" className="form-input" defaultValue={product?.name} placeholder="e.g. Jelly Backpack" style={errStyle('name')} />
              {errMsg('name')}
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  className="form-select"
                  defaultValue={product?.category ?? ''}
                  style={errStyle('category')}
                  onChange={(e) => {
                    setSelectedCategoryName(e.target.value)
                    setSubcategorySelectValue('')
                    setSubcategoryInput('')
                  }}
                >
                  <option value="">Select category</option>
                  {categoryTree.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errMsg('category')}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Sub-category <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
                </label>
                <select
                  className="form-select"
                  value={subcategorySelectValue}
                  onChange={(e) => {
                    setSubcategorySelectValue(e.target.value)
                    if (e.target.value !== NEW_SUBCAT_VALUE) setSubcategoryInput('')
                  }}
                  disabled={!selectedCategoryName}
                >
                  <option value="">{selectedCategoryName ? 'None' : 'Pick a category first'}</option>
                  {subcategoryOptions.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                  <option value={NEW_SUBCAT_VALUE}>+ Create new sub-category…</option>
                </select>
                {subcategorySelectValue === NEW_SUBCAT_VALUE && (
                  <input
                    className="form-input"
                    style={{ marginTop: 8 }}
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    placeholder="e.g. Birthday"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className="form-input" rows={3} defaultValue={product?.description ?? ''} placeholder="Describe the product…" style={errStyle('description')} />
              {errMsg('description')}
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input name="price" type="number" min={1} className="form-input" defaultValue={product?.original_price} placeholder="999" style={errStyle('price')}
                  onChange={(e) => setPricePreview((p) => ({ ...p, price: Number(e.target.value) }))} />
                {errMsg('price')}
              </div>
              <div className="form-group">
                <label className="form-label">Stock Count *</label>
                <input name="count" type="number" min={0} className="form-input" defaultValue={product?.count} placeholder="50" style={errStyle('count')} />
                {errMsg('count')}
              </div>
              <div className="form-group">
                <label className="form-label">Discount % <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(display)</span></label>
                <input name="discount" type="number" min={0} max={100} className="form-input" defaultValue={product?.percentage_discount ?? 0} placeholder="20" />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input name="discountAmount" type="number" min={0} className="form-input" defaultValue={product?.amount_discount ?? 0} placeholder="200" style={errStyle('discountAmount')}
                  onChange={(e) => setPricePreview((p) => ({ ...p, amount: Number(e.target.value) }))} />
                {errMsg('discountAmount')}
              </div>
            </div>

            {/* Live final-price preview (item 15) */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.05em' }}>Final Price</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
              {pricePreview.amount > 0 && (
                <>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)', textDecoration: 'line-through' }}>₹{pricePreview.price.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>{derivedPct}% off</span>
                </>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => setIsFeatured((v) => !v)}
                style={{
                  width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: isFeatured ? '#1d4ed8' : '#d1d5db',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: isFeatured ? 21 : 3,
                  transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <label className="form-label" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setIsFeatured((v) => !v)}>
                {isFeatured ? '⭐ Featured — shown on the homepage' : 'Not featured'}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Product Details</label>
              {details.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input className="form-input" value={d} placeholder={`Detail point ${i + 1}`} onChange={(e) => { const next = [...details]; next[i] = e.target.value; setDetails(next) }} />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setDetails(details.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetails([...details, ''])}>+ Add Point</button>
            </div>

            <div className="form-group">
              <label className="form-label">Default Product Images</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>Shown on listing pages and when no color variant is selected.</p>
              {isEdit && keptImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {keptImages.map((img: any, i: number) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      <button type="button" onClick={() => removeKeptImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#e74c3c', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }} title="Remove this image">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {isEdit && keptImages.length === 0 && existingImages.length > 0 && (
                <p style={{ fontSize: '.75rem', color: 'var(--coral)', marginBottom: 8 }}>⚠️ All existing images removed. Upload new ones below or save to clear them.</p>
              )}
              <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', fontSize: '.82rem', color: 'var(--muted)', ...(fieldErrors.images ? { borderColor: 'var(--coral)' } : {}) }} onClick={() => fileRef.current?.click()}>
                {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : '📁 Click to upload images (PNG, JPG, WEBP)'}
              </div>
              {errMsg('images')}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))} />
            </div>

            {/* Video (UNCHANGED) */}
            <div className="form-group">
              <label className="form-label">Product Video</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>Upload an MP4/WEBM demo video (max 50 MB). Shown on the product page.</p>
              {videoPreview && !removeVideo && (
                <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                  <video src={videoPreview} controls style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1.5px solid var(--border)', display: 'block' }} />
                  <button type="button" onClick={handleRemoveVideo} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#e74c3c', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }} title="Remove video">✕</button>
                </div>
              )}
              {(!videoPreview || removeVideo) && (
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', fontSize: '.82rem', color: 'var(--muted)', background: '#fafafa' }}
                  onClick={() => videoRef.current?.click()} onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith('video/')) handleVideoFile(file) }}>
                  🎬 Click or drag & drop an MP4 / WEBM video
                </div>
              )}
              {videoPreview && !removeVideo && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => videoRef.current?.click()}>🔄 Replace Video</button>
              )}
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/*" style={{ display: 'none' }} onChange={(e) => handleVideoFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className="form-group">
              <label className="form-label">Color Variants</label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 10 }}>Add each available color with its own images. On the product page, clicking a color swatch instantly shows that color's images.</p>
              <ColorVariantEditor variants={colorVariants} onChange={setColorVariants} />
            </div>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : isEdit ? '💾 Update Product' : '➕ Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm (UNCHANGED) ────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="drawer-overlay" onClick={onCancel}>
      <div className="drawer" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 40 }}>🗑️</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 12 }}>Delete Product?</div>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', margin: '8px 0 24px' }}><strong>"{name}"</strong> will be permanently deleted. This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" disabled={deleting} onClick={async () => { setDeleting(true); await onConfirm() }}>{deleting ? 'Deleting…' : 'Yes, Delete'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

type SortOpt = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'

function useDebounce<T>(value: T, ms = 380): T {
  const [dv, setDv] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDv(value), ms); return () => clearTimeout(t) }, [value, ms])
  return dv
}

export default function ProductsPage() {
  const [page, setPage]           = useState(0)
  const [rawSearch, setRawSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter]       = useState<'' | 'in_stock' | 'low_stock' | 'out_of_stock'>('')
  const [flagFilter, setFlagFilter]         = useState<'' | 'featured' | 'new' | 'inactive'>('')
  const [sortBy, setSortBy]                 = useState<SortOpt>('featured')
  const [editProduct, setEditProduct]       = useState<ApiProduct | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget]     = useState<ApiProduct | null>(null)

  const LIMIT = 12
  const search = useDebounce(rawSearch, 380)

  const { data: productsRes, loading, error, refetch } = useAdminFetch(
    () => { 
      console.log('[FETCH] page =', page, '-> skip =', page * LIMIT)   // ← TEMP
    return fetchAdminProducts({
      skip: page * LIMIT, limit: LIMIT,
      search: search || undefined,
      category: categoryFilter || undefined,
      stock_status: stockFilter || undefined,
      is_new:      flagFilter === 'new' ? true : undefined,
      is_featured: flagFilter === 'featured' ? true : undefined,
      is_active:   flagFilter === 'inactive' ? false : undefined,
      include_inactive: flagFilter === 'inactive' ? true : undefined,
      sort_by: sortBy,
    })
  },
    [page, search, categoryFilter, stockFilter, flagFilter, sortBy],
  )

  const { data: categoriesRes, refetch: refetchCategories } = useAdminFetch(fetchCategories, [])
  const flatCats = categoriesRes ? flattenCategories(categoriesRes) : []

  useEffect(() => { setPage(0) }, [search, categoryFilter, stockFilter, flagFilter, sortBy])

  async function handleDelete(product: ApiProduct) {
    try { await deleteProduct(product.id); refetch() }
    catch (err: any) { alert('Delete failed: ' + err.message) }
    finally { setDeleteTarget(null) }
  }

  const products   = productsRes?.data       ?? []
  const totalCount = productsRes?.totalCount  ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  return (
    <div>
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

      {/* Toolbar */}
      <div className="prod-toolbar">
        <div className="tb-search" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="text" placeholder="Search products…" value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} />
          {rawSearch && <button onClick={() => setRawSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 15, padding: 0 }}>×</button>}
        </div>

        <select className="form-select" style={{ minWidth: 150 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {flatCats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select className="form-select" style={{ minWidth: 140 }} value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}>
          <option value="">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <select className="form-select" style={{ minWidth: 130 }} value={flagFilter} onChange={(e) => setFlagFilter(e.target.value as any)}>
          <option value="">All Products</option>
          <option value="featured">⭐ Featured</option>
          <option value="new">🆕 New</option>
          <option value="inactive">🚫 Inactive</option>
        </select>

        <select className="form-select" style={{ minWidth: 150 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOpt)}>
          <option value="featured">Sort: Featured</option>
          <option value="newest">Sort: Latest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="stock_desc">Stock: High → Low</option>
          <option value="stock_asc">Stock: Low → High</option>
        </select>
      </div>

      {error && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--coral)' }}>⚠️ {error}<button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>Retry</button></div>
      )}

      {/* Grid */}
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
          : products.length === 0
          ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🧸</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6 }}>No products found</div>
              <div style={{ fontSize: '.82rem' }}>
                {rawSearch ? `No results for "${rawSearch}"` : (categoryFilter || stockFilter || flagFilter) ? 'No products match these filters' : 'Add your first product to get started'}
              </div>
            </div>
          )
          : products.map((p) => {
              const stock = stockLabel(p.count)
              const img   = p.product_image?.[0]?.url
              const discountedPrice = p.original_price - p.amount_discount
              const cvArr: any[] = Array.isArray((p as any).color_variants) ? (p as any).color_variants : []
              const isInactive = (p as any).is_active === false

              return (
                <div key={p.id} className="pc" style={isInactive ? { opacity: 0.6 } : undefined}>
                  <div className="pc-thumb" style={{ background: 'linear-gradient(135deg,#FFF3D4,#FFE099)', overflow: 'hidden', position: 'relative' }}>
                    <div className="pc-badge-wrap">
                      {p.amount_discount > 0 && <span className="pc-badge pc-badge-sale">-{p.percentage_discount}%</span>}
                      {(p as any).is_new && <span className="pc-badge pc-badge-new">New</span>}
                      {(p as any).is_featured && <span className="pc-badge pc-badge-hot">★</span>}
                      {isInactive && <span className="pc-badge" style={{ background: '#9ca3af', color: '#fff' }}>Inactive</span>}
                    </div>
                    {img
                      ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10%', boxSizing: 'border-box', display: 'block' }} />
                      : <span style={{ fontSize: 40 }}>🧸</span>}
                  </div>
                  <div className="pc-body">
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-cat">{p.category ?? '—'}</div>
                    {cvArr.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                        {cvArr.map((cv: any, i: number) => (
                          <span key={i} title={cv.name} style={{ width: 14, height: 14, borderRadius: '50%', background: cv.hex ?? '#ccc', border: '1.5px solid rgba(0,0,0,0.12)', display: 'inline-block', flexShrink: 0 }} />
                        ))}
                        <span style={{ fontSize: '.68rem', color: 'var(--muted)', alignSelf: 'center' }}>{cvArr.length} color{cvArr.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="pc-row">
                      <div>
                        <span className="pc-price">₹{discountedPrice.toLocaleString()}</span>
                        {p.amount_discount > 0 && <span className="pc-orig">₹{p.original_price.toLocaleString()}</span>}
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

      {totalPages > 1 && !loading && products.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(0)}>«</button>
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>

          {(() => {
            // Sliding window of up to 7 pages centred on the current page.
            const WINDOW = 7
            const half = Math.floor(WINDOW / 2)
            let start = Math.max(0, page - half)
            let end = Math.min(totalPages - 1, start + WINDOW - 1)
            start = Math.max(0, end - WINDOW + 1)   // re-expand near the end
            const pages: number[] = []
            for (let i = start; i <= end; i++) pages.push(i)
            return pages.map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {console.log('[CLICK] setPage', p); setPage(p)}}
              >
                {p + 1}
              </button>
            ))
          })()}

          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
        </div>
      )}

      {editProduct !== undefined && (
        <ProductForm
          product={editProduct}
          categoryTree={categoriesRes ?? []}
          onClose={() => setEditProduct(undefined)}
          onSaved={() => { refetch(); refetchCategories() }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}