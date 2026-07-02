'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { signOut } from 'next-auth/react'
import { PageId, PAGE_META } from '@/lib/adminData'

interface TopbarProps {
  activePage: PageId
  /** optional live subtitle override (e.g. "847 orders") */
  subtitle?: string
  /** toggle the mobile/tablet drawer */
  onMenuClick: () => void
  /** optional global-search handler. Left unwired by default — there is no
   *  global-search endpoint yet, so this is a ready hook, not faked results. */
  onSearch?: (q: string) => void
}

export default function Topbar({ activePage, subtitle, onMenuClick, onSearch }: TopbarProps) {
  const meta = PAGE_META[activePage]
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside-click + Escape
  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function submitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSearch?.(query.trim())
  }

  return (
    <header className="topbar">
      {/* Hamburger — visible on tablet/mobile only (CSS) */}
      <button className="tb-hamburger" type="button" onClick={onMenuClick} aria-label="Toggle navigation menu">
        <span /><span /><span />
      </button>

      <div className="topbar-breadcrumb">
        <div className="tb-title">
          {meta.title} <span>{meta.section}</span>
        </div>
        <div className="tb-sub">{subtitle ?? meta.sub}</div>
      </div>

      <form className="tb-search" onSubmit={submitSearch} role="search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            className="tb-search-clear"
            onClick={() => { setQuery(''); onSearch?.('') }}
            aria-label="Clear search"
          >×</button>
        )}
      </form>

      <button className="tb-icon-btn" type="button" title="Notifications" aria-label="Notifications">
        🔔<span className="tb-notif-dot" />
      </button>
      <button className="tb-icon-btn tb-help" type="button" title="Help" aria-label="Help">❓</button>

      <div className={`tb-profile-wrap${menuOpen ? ' open' : ''}`} ref={profileRef}>
        <button
          className="tb-profile"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="tb-pav">L</span>
          <span className="tb-pname">Little Loot</span>
          <span className="tb-caret">▾</span>
        </button>

        {menuOpen && (
          <div className="tb-menu" role="menu">
            <div className="tb-menu-head">
              <div className="tb-menu-name">Little Loot</div>
              <div className="tb-menu-role">Store Administrator</div>
            </div>
            <button
              className="tb-menu-item danger"
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >↩ Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}