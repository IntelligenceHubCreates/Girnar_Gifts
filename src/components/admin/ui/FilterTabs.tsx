'use client'

import { useState } from 'react'

interface FilterTabsProps {
  tabs: string[]
  defaultActive?: number
  active?: string          // controlled mode — pass tab label
  onChange?: (tab: string, index: number) => void
}

export default function FilterTabs({ tabs, defaultActive = 0, active, onChange }: FilterTabsProps) {
  const [internalActive, setInternalActive] = useState(defaultActive)

  // controlled mode: find index from label
  const activeIndex = active !== undefined
    ? tabs.findIndex((t) => t.startsWith(active)) ?? 0
    : internalActive

  return (
    <div className="filter-tabs">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`ftab${activeIndex === i ? ' active' : ''}`}
          onClick={() => {
            setInternalActive(i)
            onChange?.(tab, i)
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
