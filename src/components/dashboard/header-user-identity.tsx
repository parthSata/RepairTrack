'use client'

import { useState } from 'react'
import { ChevronRight, Pencil, UserRound } from 'lucide-react'
import { ProfileUpdateDialog } from '@/components/dashboard/profile-update-dialog'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  STAFF: 'Staff',
  TECHNICIAN: 'Technician',
}

const FALLBACK_SHOP_LABEL = 'Shop Profile'

type HeaderUserIdentityProps = {
  userName: string
  email: string
  shopName: string | null
  role: string
}

export function HeaderUserIdentity({
  userName,
  email,
  shopName,
  role,
}: HeaderUserIdentityProps) {
  const [open, setOpen] = useState(false)
  const [optimisticName, setOptimisticName] = useState<string | null>(null)

  const name = (optimisticName ?? userName).trim() || 'User'
  const shopLabel = shopName?.trim() || FALLBACK_SHOP_LABEL
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Edit profile, ${name}, ${shopLabel}, ${roleLabel}`}
        className={cn(
          'group flex max-w-[15rem] items-center gap-2.5 rounded-xl border border-border bg-card px-2 py-1.5 text-left sm:max-w-[19rem]',
          'shadow-sm transition-[border-color,box-shadow,background-color] duration-200',
          'hover:border-accent/45 hover:bg-accent/[0.04] hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        )}
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            'bg-accent/12 text-accent ring-1 ring-accent/25',
            'transition-colors duration-200 group-hover:bg-accent/18',
          )}
          aria-hidden="true"
        >
          <UserRound className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-5 text-foreground">
            {name}
          </span>
          <span className="mt-0.5 hidden truncate text-xs leading-4 text-muted-foreground sm:block">
            {shopLabel}
            <span className="mx-1 text-border" aria-hidden="true">
              ·
            </span>
            {roleLabel}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium leading-4 text-accent sm:hidden">
            <Pencil className="h-3 w-3 shrink-0" aria-hidden="true" />
            Edit profile
          </span>
        </span>

        <span
          className={cn(
            'hidden items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent sm:inline-flex',
            'transition-colors duration-200 group-hover:bg-accent/10',
          )}
          aria-hidden="true"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </span>

        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            'bg-accent text-accent-foreground shadow-sm',
            'transition-transform duration-200 group-hover:translate-x-0.5',
          )}
          aria-hidden="true"
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>

      <ProfileUpdateDialog
        open={open}
        onOpenChange={setOpen}
        name={name === 'User' ? '' : name}
        email={email}
        shopName={shopLabel}
        roleLabel={roleLabel}
        onSaved={setOptimisticName}
      />
    </>
  )
}
