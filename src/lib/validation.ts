import { z } from 'zod'

/** Route param for `/:id` endpoints; rejects blank or oversized ids before any DB call. */
export const idParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'Id is required' }).max(100, { message: 'Invalid id' }),
})

/** Route params for `/:id/emails/:logId` endpoints. */
export const idAndLogIdParamSchema = idParamSchema.extend({
  logId: z.string().trim().min(1, { message: 'Log id is required' }).max(100, { message: 'Invalid log id' }),
})

/** Route params for `/:id/parts/:partRowId` endpoints. */
export const idAndPartRowIdParamSchema = idParamSchema.extend({
  partRowId: z.string().trim().min(1, { message: 'Part row id is required' }).max(100, { message: 'Invalid part row id' }),
})

/** Route params for `/:id/photos/:type` endpoints. */
export const idAndPhotoTypeParamSchema = idParamSchema.extend({
  type: z.string().trim().min(1, { message: 'Photo type is required' }).max(100, { message: 'Invalid photo type' }),
})
