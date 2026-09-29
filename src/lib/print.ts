// Characters Windows/macOS reject in file names, plus control characters.
const UNSAFE_FILE_CHARS = /[\\/:*?"<>|\p{Cc}]+/gu
const MAX_TITLE_LENGTH = 120

/** Joins parts into a file-name-safe title; browsers use document.title as the suggested PDF name. */
export function toFileTitle(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.replace(UNSAFE_FILE_CHARS, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' - ')
    .slice(0, MAX_TITLE_LENGTH)
    .replace(/[\s-]+$/, '')
}

/** Prints with a temporary title; restores it after the dialog closes, or immediately if printing fails. */
export function printWithTitle(title: string): void {
  const previousTitle = document.title
  const restore = () => {
    document.title = previousTitle
  }
  document.title = title || previousTitle
  // window.print() does not block in every browser (e.g. mobile Safari), so wait for afterprint.
  window.addEventListener('afterprint', restore, { once: true })
  try {
    window.print()
  } catch (error) {
    window.removeEventListener('afterprint', restore)
    restore()
    throw error
  }
}
