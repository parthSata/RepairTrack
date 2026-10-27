'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getPrimaryNavItems, isPrimaryNavLinkActive } from './primary-nav'

export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const links = getPrimaryNavItems(role)
  const close = () => setOpen(false)

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
                <Image src="/icon.png" alt="RepairTrack" width={32} height={32} className="h-8 w-8 object-contain" />
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
              {links.map(({ href, label, icon: Icon }) => {
                const active = isPrimaryNavLinkActive(pathname, href)
                return (
                  <Link
                    key={href}
                    onClick={close}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                      active
                        ? 'bg-accent/10 font-semibold text-accent border-l-2 border-accent pl-2.5'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-accent' : 'text-muted-foreground',
                      )}
                    />
                    {label}
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
