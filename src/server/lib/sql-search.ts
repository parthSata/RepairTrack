/**
 * Builds an ILIKE "contains" pattern from user input, escaping `\`, `%` and `_`
 * so typed wildcards match literally. Returns null for an empty search.
 */
export function toContainsPattern(search: string | null | undefined): string | null {
  const term = search?.trim()
  if (!term) return null
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}
