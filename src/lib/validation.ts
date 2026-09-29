import { z } from 'zod'

/** Route param for `/:id` endpoints; rejects blank or oversized ids before any DB call. */
export const idParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'Id is required' }).max(100, { message: 'Invalid id' }),
})
