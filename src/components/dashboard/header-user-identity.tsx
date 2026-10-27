const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  STAFF: 'Staff',
  TECHNICIAN: 'Technician',
}

const FALLBACK_SHOP_LABEL = 'Shop Profile'

type HeaderUserIdentityProps = {
  userName: string
  shopName: string | null
  role: string
}

export function HeaderUserIdentity({ userName, shopName, role }: HeaderUserIdentityProps) {
  const displayName = userName.trim() || 'User'
  const shopLabel = shopName?.trim() || FALLBACK_SHOP_LABEL
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div className="min-w-0 max-w-[12rem] text-right sm:max-w-[16rem] sm:text-left">
      <p className="truncate text-sm font-medium leading-5 text-foreground">{displayName}</p>
      <p className="hidden truncate text-xs leading-4 text-muted-foreground sm:block">
        {shopLabel}
        <span className="mx-1 text-border" aria-hidden="true">
          ·
        </span>
        {roleLabel}
      </p>
    </div>
  )
}
