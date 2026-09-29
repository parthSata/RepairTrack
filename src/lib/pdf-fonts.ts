import { Font } from '@react-pdf/renderer'

/** Noto Sans (public/fonts) is used because the built-in PDF fonts have no ₹ glyph. */
export const PDF_FONT_FAMILY = 'NotoSans'

let isRegistered = false

/** Registers PDF fonts once; call before rendering. Browser-only: font URLs resolve against the current origin. */
export function registerPdfFonts(): void {
  if (isRegistered) return
  const origin = window.location.origin
  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: `${origin}/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
    ],
  })
  // Keep words whole; the default hyphenation splits names and part numbers.
  Font.registerHyphenationCallback((word) => [word])
  isRegistered = true
}
