/** Reorder cue when quantity drops to this level or below (and not already out of stock). */
export const REORDER_THRESHOLD = 3

export type PartStockStatus = 'OUT' | 'LOW' | 'OK'

export const STOCK_STATUS_COPY = {
  OUT: 'Out of stock — order this part.',
  LOW: 'Low stock — order new stock soon.',
} as const

export function getPartStockStatus(quantity: number, minimumStock: number): PartStockStatus {
  if (quantity === 0) return 'OUT'
  if (quantity <= REORDER_THRESHOLD || quantity <= minimumStock) return 'LOW'
  return 'OK'
}

export function formatStockAlertBanner(outOfStockCount: number, lowStockCount: number): string | null {
  const parts: string[] = []
  if (outOfStockCount > 0) {
    parts.push(`${outOfStockCount} part${outOfStockCount === 1 ? '' : 's'} out of stock`)
  }
  if (lowStockCount > 0) {
    parts.push(
      `${lowStockCount} part${lowStockCount === 1 ? '' : 's'} running low — consider ordering`,
    )
  }
  if (parts.length === 0) return null
  return `${parts.join('. ')}.`
}
