'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Boxes, CircleDollarSign, LayoutDashboard, Menu, Settings, Smartphone, Users, Wrench, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const restricted = role === 'TECHNICIAN'
  const owner = role === 'OWNER'
  const close = () => setOpen(false)

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/repairs', label: 'Repairs', icon: Wrench },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/devices', label: 'Devices', icon: Smartphone },
    ...(!restricted ? [
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/invoices', label: 'Invoices', icon: CircleDollarSign },
      ...(owner ? [{ href: '/settings/shop', label: 'Settings', icon: Settings }] : []),
    ] : []),
  ]

  return (
    <div className="md:hidden">
      <Button type="button" variant="ghost" className="h-10 w-10 px-0" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && <>
        <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-foreground/20" onClick={close} />
        <nav aria-label="Mobile navigation" className="fixed inset-y-0 left-0 z-40 w-[min(18rem,85vw)] border-r border-border bg-card p-5 shadow-[0_12px_32px_rgba(24,33,43,0.16)]">
          <div className="flex items-center justify-between border-b border-border pb-5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">RT</span><span className="font-semibold">RepairTrack</span></div><Button type="button" variant="ghost" className="h-9 w-9 px-0" aria-label="Close navigation" onClick={close}><X className="h-5 w-5" /></Button></div>
          <div className="mt-6 space-y-1">{links.map(({ href, label, icon: Icon }, index) => <Link key={href} onClick={close} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${index === 0 ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} href={href}><Icon className="h-4 w-4" />{label}</Link>)}</div>
        </nav>
      </>}
    </div>
  )
}