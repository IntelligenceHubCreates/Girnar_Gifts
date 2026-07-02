'use client'

import { useState } from 'react'
import type { AnalyticsRange } from '@/lib/adminApi'

const PRESETS: { key: AnalyticsRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: '6m',    label: '6 Months' },
  { key: '1y',    label: '1 Year' },
]

export default function DateRangeFilter({
  range, start, end, onChange,
}: {
  range: AnalyticsRange
  start?: string
  end?: string
  onChange: (range: AnalyticsRange, start?: string, end?: string) => void
}) {
  const [showCustom, setShowCustom] = useState(range === 'custom')
  const [s, setS] = useState(start ?? '')
  const [e, setE] = useState(end ?? '')

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {PRESETS.map(p => (
        <button key={p.key}
          className={`btn ${range === p.key ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => { setShowCustom(false); onChange(p.key) }}>
          {p.label}
        </button>
      ))}
      <button
        className={`btn ${range === 'custom' ? 'btn-primary' : 'btn-outline'} btn-sm`}
        onClick={() => setShowCustom(v => !v)}>
        Custom
      </button>
      {showCustom && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="date" value={s} max={e || undefined} onChange={ev => setS(ev.target.value)}
            className="form-input" style={{ width: 150, padding: '5px 8px' }} />
          <span style={{ color: 'var(--muted,#9ca3af)' }}>→</span>
          <input type="date" value={e} min={s || undefined} onChange={ev => setE(ev.target.value)}
            className="form-input" style={{ width: 150, padding: '5px 8px' }} />
          <button className="btn btn-primary btn-sm" disabled={!s || !e}
            onClick={() => onChange('custom', s, e)}>Apply</button>
        </div>
      )}
    </div>
  )
}