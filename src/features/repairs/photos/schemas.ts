import { z } from 'zod'

export const repairPhotoTypeValues = ['BEFORE', 'AFTER'] as const
export type RepairPhotoType = (typeof repairPhotoTypeValues)[number]

export const repairPhotoUploadUrlSchema = z.object({
  type: z.enum(repairPhotoTypeValues),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(5 * 1024 * 1024),
})

export const repairPhotoConfirmSchema = z.object({
  type: z.enum(repairPhotoTypeValues),
  publicId: z.string().trim().min(1).max(500),
})

export const repairPhotoVisibilitySchema = z.object({
  hidden: z.boolean(),
})

export type RepairPhotoUploadUrlInput = z.infer<typeof repairPhotoUploadUrlSchema>
export type RepairPhotoConfirmInput = z.infer<typeof repairPhotoConfirmSchema>
export type RepairPhotoVisibilityInput = z.infer<typeof repairPhotoVisibilitySchema>
