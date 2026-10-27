import { logoPublicUrl } from '@/server/storage/cloudinary'

/**
 * Public HTTPS default logo for emails with no shop logo.
 * Path must not contain spaces — Gmail's image proxy double-encodes `%20` and 404s.
 * `e_replace_color:white:40:black` turns the asset's black canvas white so the
 * navy mark stays readable on the dark email header (and inside a white logo plate).
 */
export const DEFAULT_EMAIL_LOGO_URL =
  'https://res.cloudinary.com/dwxhjomtn/image/upload/e_replace_color:white:40:black/v1793025273/RepairTrack/assets/email-logo.png'

/** Absolute HTTPS logo URL. Never a filesystem path. */
export function resolveEmailLogoUrl(logoKey?: string | null) {
  const key = logoKey?.trim()
  if (key) return logoPublicUrl(key)
  return DEFAULT_EMAIL_LOGO_URL
}
