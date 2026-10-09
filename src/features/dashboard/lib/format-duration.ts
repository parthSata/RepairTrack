export function formatRepairDuration(hours: number | null | undefined): string {
  if (hours == null || isNaN(hours)) return '—'
  if (hours <= 0) return '0h'

  const totalMinutes = Math.round(hours * 60)
  if (totalMinutes < 60) {
    return `${Math.max(1, totalMinutes)}m`
  }

  const days = Math.floor(hours / 24)
  const remHours = Math.round(hours % 24)

  if (days > 0) {
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
  }

  return `${Math.round(hours)}h`
}
