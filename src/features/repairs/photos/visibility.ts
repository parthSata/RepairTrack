const CUSTOMER_VISIBLE_STATUSES = new Set(['READY_FOR_PICKUP', 'COMPLETED'])

/** Derived visibility — no manual Share flag. */
export function isRepairPhotosCustomerVisible(opts: {
  status: string
  customerPhotosHidden: boolean
  hasBefore: boolean
  hasAfter: boolean
}): boolean {
  return (
    !opts.customerPhotosHidden &&
    opts.hasBefore &&
    opts.hasAfter &&
    CUSTOMER_VISIBLE_STATUSES.has(opts.status)
  )
}

export function canMutateRepairPhotos(opts: {
  userRole: string
  isCustomerVisible: boolean
}): boolean {
  if (opts.userRole === 'OWNER' || opts.userRole === 'STAFF') return true
  if (opts.userRole === 'TECHNICIAN') return !opts.isCustomerVisible
  return false
}

export function canHideRepairPhotos(userRole: string): boolean {
  return userRole === 'OWNER' || userRole === 'STAFF'
}
