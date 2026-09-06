import { z } from 'zod'

export const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')

export const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/\S/, 'Password cannot be empty or contain only spaces')
  .regex(/^\S+$/, 'Password cannot contain spaces')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character')

const nameSchema = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} must be 100 characters or fewer`)
    .regex(/[\p{L}]/u, `${label} must contain at least one letter`)

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
})

export const registerSchema = z.object({
  shopName: z
    .string({ error: 'Shop name is required' })
    .trim()
    .min(2, 'Shop name must be at least 2 characters')
    .max(120, 'Shop name must be 120 characters or fewer'),
  ownerName: nameSchema('Your name'),
  email: emailSchema,
  password: passwordSchema,
})

export const emailCheckSchema = z.object({ email: emailSchema })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>