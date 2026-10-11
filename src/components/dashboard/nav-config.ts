import type { LucideIcon } from 'lucide-react'
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
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roleRequirement?: 'ALL' | 'NON_TECHNICIAN' | 'OWNER_ONLY'
  exactMatch?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exactMatch: true },
  { href: '/repairs', label: 'Repairs', icon: Wrench },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/devices', label: 'Devices', icon: Smartphone },
  { href: '/inventory', label: 'Inventory', icon: Boxes, roleRequirement: 'NON_TECHNICIAN' },
  { href: '/invoices', label: 'Invoices', icon: CircleDollarSign, roleRequirement: 'NON_TECHNICIAN' },
  { href: '/payments', label: 'Payments', icon: CreditCard, roleRequirement: 'NON_TECHNICIAN' },
  { href: '/settings/staff', label: 'Staff', icon: UserPlus, roleRequirement: 'OWNER_ONLY' },
  { href: '/settings/shop', label: 'Settings', icon: Settings, roleRequirement: 'OWNER_ONLY' },
]

export function getVisibleNavItems(role: string): NavItem[] {
  const restricted = role === 'TECHNICIAN'
  const owner = role === 'OWNER'

  return NAV_ITEMS.filter((item) => {
    if (item.roleRequirement === 'OWNER_ONLY') return owner
    if (item.roleRequirement === 'NON_TECHNICIAN') return !restricted
    return true
  })
}

export function isNavActive(pathname: string, href: string, exactMatch?: boolean): boolean {
  if (exactMatch || href === '/dashboard') {
    return pathname === href
  }
  if (href === '/settings/shop') {
    return pathname.startsWith('/settings') && !pathname.startsWith('/settings/staff')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
