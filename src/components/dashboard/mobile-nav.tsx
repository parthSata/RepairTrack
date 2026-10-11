'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getVisibleNavItems, isNavActive } from './nav-config'

export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const close = () => setOpen(false)
  const items = getVisibleNavItems(role)

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 px-0"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-foreground/20"
            onClick={close}
          />
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-40 w-[min(18rem,85vw)] border-r border-border bg-card p-5 shadow-[0_12px_32px_rgba(24,33,43,0.16)]"
          >
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                  RT
                </span>
                <span className="font-semibold">RepairTrack</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-9 px-0"
                aria-label="Close navigation"
                onClick={close}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6 space-y-1">
              {items.map((item) => {
                const active = isNavActive(pathname, item.href, item.exactMatch)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    onClick={close}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-muted text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-accent"
                      />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}