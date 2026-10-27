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

export type PrimaryNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

/** Primary dashboard nav filtered by role. TECHNICIAN sees Dashboard + Repairs only. */
export function getPrimaryNavItems(role: string): PrimaryNavItem[] {
  const restricted = role === 'TECHNICIAN'
  const owner = role === 'OWNER'

  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/repairs', label: 'Repairs', icon: Wrench },
    ...(!restricted
      ? [
          { href: '/customers', label: 'Customers', icon: Users },
          { href: '/devices', label: 'Devices', icon: Smartphone },
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
}

export function isPrimaryNavLinkActive(pathname: string, href: string): boolean {
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
