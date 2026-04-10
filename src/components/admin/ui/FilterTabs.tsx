'use client'

import { useState } from 'react'

interface FilterTabsProps {
  tabs: string[]
  defaultActive?: number
  onChange?: (tab: string, index: number) => void
}

export default function FilterTabs({ tabs, defaultActive = 0, onChange }: FilterTabsProps) {
  const [active, setActive] = useState(defaultActive)
  return (
    <div className="filter-tabs">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`ftab${active === i ? ' active' : ''}`}
          onClick={() => { setActive(i); onChange?.(tab, i) }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
