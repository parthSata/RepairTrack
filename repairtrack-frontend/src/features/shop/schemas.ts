import { z } from 'zod'

const phoneSchema = z
  .string({ error: 'Phone is required' })
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(30, 'Phone must be 30 characters or fewer')
  .regex(/^[+\d][\d\s().-]{6,29}$/, 'Enter a valid phone number')
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length >= 7 && !/^0+$/.test(digits)
  }, 'Enter a real phone number')

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .regex(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/, 'Enter a valid email address')

const addressSchema = z
  .string({ error: 'Address is required' })
  .trim()
  .min(5, 'Address is required')
  .max(500, 'Address must be 500 characters or fewer')
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 6, 'Address must contain at least 6 words')

export const shopProfileSchema = z.object({
  shopName: z.string({ error: 'Shop name is required' }).trim().min(2).max(100),
  phone: phoneSchema,
  email: emailSchema,
  address: addressSchema,
  businessInfo: z.string().trim().max(1000).optional(),
  logoUrl: z.string().trim().max(500).optional(),
})

export const logoUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(5 * 1024 * 1024),
  extension: z.enum(['jpg', 'jpeg', 'png', 'webp']),
})

export type ShopProfile = z.infer<typeof shopProfileSchema>
export type ShopProfileResponse = ShopProfile & { id: string; logoPreviewUrl: string | null }
export type LogoUploadInput = z.infer<typeof logoUploadSchema>