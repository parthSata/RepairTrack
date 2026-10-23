'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Settings,
  Smartphone,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface SidebarNavProps {
  role: string
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()
  const restricted = role === 'TECHNICIAN'
  const owner = role === 'OWNER'

  const links: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/repairs', label: 'Repairs', icon: Wrench },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/devices', label: 'Devices', icon: Smartphone },
    ...(!restricted
      ? [
          { href: '/inventory', label: 'Inventory', icon: Boxes },
          { href: '/invoices', label: 'Invoices', icon: CircleDollarSign },
          { href: '/payments', label: 'Payments', icon: CreditCard },
          ...(owner
            ? [
                { href: '/settings/staff', label: 'Staff', icon: UserPlus },
                { href: '/settings/shop', label: 'Settings', icon: Settings },
              ]
            : []),
        ]
      : []),
  ]

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    // Settings nav points at /settings/shop but covers all shop-settings tabs
    // (shop, email, …). Staff is a separate nav item under /settings/staff.
    if (href === '/settings/shop') {
      return (
        pathname.startsWith('/settings/') &&
        pathname !== '/settings/staff' &&
        !pathname.startsWith('/settings/staff/')
      )
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav aria-label="Primary navigation" className="space-y-1 p-4">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isLinkActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
              active
                ? 'bg-accent/10 font-semibold text-accent border-l-2 border-accent pl-2.5'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground',
              )}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
