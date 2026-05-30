'use client'

import { PageId, PAGE_META } from '@/lib/adminData'

interface TopbarProps {
  activePage: PageId
  /** optional live subtitle override (e.g. "847 orders") */
  subtitle?: string
}

export default function Topbar({ activePage, subtitle }: TopbarProps) {
  const meta = PAGE_META[activePage]
  return (
    <div className="topbar">
      <div className="topbar-breadcrumb">
        <div className="tb-title">
          {meta.title} <span>{meta.section}</span>
        </div>
        <div className="tb-sub">{subtitle ?? meta.sub}</div>
      </div>

      <div className="tb-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input type="text" placeholder="Search anything…" />
      </div>

      <button className="tb-icon-btn" title="Notifications">
        🔔<span className="tb-notif-dot" />
      </button>
      <button className="tb-icon-btn" title="Help">❓</button>

      <div className="tb-profile">
        <div className="tb-pav">V</div>
        <span className="tb-pname">Varsha</span>
        <span style={{ color: 'var(--muted)', fontSize: '.7rem' }}>▾</span>
      </div>
    </div>
  )
}
