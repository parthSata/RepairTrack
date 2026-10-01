import QRCode from 'qrcode'

export type ShopUpi = { upiId: string; payeeName: string }

type UpiLinkInput = ShopUpi & { amountPaise: number; ticketNumber: string }

/** Builds a `upi://pay` deep link. Spaces must be %20, not `+` (URLSearchParams), for UPI apps. */
export function buildUpiLink({ upiId, payeeName, amountPaise, ticketNumber }: UpiLinkInput) {
  const params = {
    pa: upiId,
    pn: payeeName,
    am: (amountPaise / 100).toFixed(2),
    cu: 'INR',
    tn: `Ticket ${ticketNumber}`,
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `upi://pay?${query}`
}

export function toUpiQrDataUrl(link: string) {
  return QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 240 })
}

export function canCollectByUpi({ balance, repairStatus }: { balance: number | null; repairStatus: string }) {
  return balance != null && balance > 0 && repairStatus !== 'CANCELLED'
}
