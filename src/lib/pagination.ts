import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

/** Base list query; features `.extend()` it with their own `search` / `sortBy`. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 }
}
