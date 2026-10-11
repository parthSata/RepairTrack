'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

export function getActivePathSegments(pathname: string): BreadcrumbSegment[] {
  if (pathname === '/dashboard') {
    return [{ label: 'Dashboard' }]
  }
  if (pathname.startsWith('/repairs')) {
    const segments: BreadcrumbSegment[] = [{ label: 'Repairs', href: '/repairs' }]
    if (pathname === '/repairs/new') {
      segments.push({ label: 'New Ticket' })
    } else if (pathname.startsWith('/repairs/') && pathname !== '/repairs') {
      segments.push({ label: 'Ticket Details' })
    }
    return segments
  }
  if (pathname.startsWith('/customers')) {
    const segments: BreadcrumbSegment[] = [{ label: 'Customers', href: '/customers' }]
    if (pathname.startsWith('/customers/') && pathname !== '/customers') {
      segments.push({ label: 'Customer Details' })
    }
    return segments
  }
  if (pathname.startsWith('/devices')) {
    const segments: BreadcrumbSegment[] = [{ label: 'Devices', href: '/devices' }]
    if (pathname.startsWith('/devices/') && pathname !== '/devices') {
      segments.push({ label: 'Device Details' })
    }
    return segments
  }
  if (pathname.startsWith('/inventory')) {
    const segments: BreadcrumbSegment[] = [{ label: 'Inventory', href: '/inventory' }]
    if (pathname.startsWith('/inventory/') && pathname !== '/inventory') {
      segments.push({ label: 'Part Details' })
    }
    return segments
  }
  if (pathname.startsWith('/invoices')) {
    const segments: BreadcrumbSegment[] = [{ label: 'Invoices', href: '/invoices' }]
    if (pathname.startsWith('/invoices/') && pathname !== '/invoices') {
      segments.push({ label: 'Invoice Details' })
    }
    return segments
  }
  if (pathname.startsWith('/payments')) {
    return [{ label: 'Payments' }]
  }
  if (pathname.startsWith('/settings')) {
    if (pathname.startsWith('/settings/staff')) {
      return [{ label: 'Staff' }]
    }
    const segments: BreadcrumbSegment[] = [{ label: 'Settings', href: '/settings/shop' }]
    if (pathname.startsWith('/settings/email')) {
      segments.push({ label: 'Email & Notifications' })
    } else if (pathname.startsWith('/settings/shop')) {
      segments.push({ label: 'Shop Profile' })
    }
    return segments
  }
  return [{ label: 'Operations overview' }]
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = getActivePathSegments(pathname)
  const currentTitle = segments[segments.length - 1]?.label ?? 'RepairTrack'

  return (
    <>
      {/* Mobile active path indicator */}
      <span className="text-sm font-semibold tracking-tight text-foreground md:hidden truncate max-w-[180px]">
        {currentTitle}
      </span>

      {/* Desktop breadcrumb trail */}
      <nav aria-label="Breadcrumb navigation" className="hidden items-center gap-1.5 text-sm md:flex">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          return (
            <span key={`${seg.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
              {seg.href && !isLast ? (
                <Link
                  href={seg.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {seg.label}
                </Link>
              ) : (
                <span className={cn(isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {seg.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </>
  )
}
