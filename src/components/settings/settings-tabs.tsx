'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SETTINGS_TABS = [
  { href: '/settings/shop', label: 'Shop Profile' },
  { href: '/settings/email', label: 'Email & Notifications' },
] as const

/** Route-based tabs: each settings section keeps its own URL (the Gmail callback lands on /settings/email). */
export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Settings sections"
      className="inline-flex h-10 max-w-full items-center overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground"
    >
      {SETTINGS_TABS.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-background font-semibold text-foreground shadow-xs'
                : 'hover:bg-background/50 hover:text-foreground',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
