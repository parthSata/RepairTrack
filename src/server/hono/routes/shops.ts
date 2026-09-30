import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { logoUploadSchema, shopProfileSchema } from '@/features/shop/schemas'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
import { createLogoUploadData, deleteObject, logoPublicUrl, MAX_UPLOAD_SIZE } from '@/server/storage/cloudinary'
import { getShopById, toShopProfileResponse, updateShopProfile } from '@/server/services/shop.service'

const shopsRouter = new Hono()

const requireOwner = (request: Request) => requireRole(request, ['OWNER'], 'Not authorized')

shopsRouter.get('/me', async (context) => {
  const { shopId, email } = await requireOwner(context.req.raw)
  const shop = await getShopById(shopId)
  if (!shop) throw new HTTPException(404, { message: 'Shop not found' })
  return context.json(toShopProfileResponse(shop, email))
})

shopsRouter.patch('/me', zValidator('json', shopProfileSchema, validationHook), async (context) => {
  const { shopId, email } = await requireOwner(context.req.raw)
  const profile = { ...context.req.valid('json'), email }
  const result = await updateShopProfile(shopId, profile)
  if (!result) throw new HTTPException(404, { message: 'Shop not found' })
  if (result.previousLogoKey && result.previousLogoKey !== profile.logoUrl) {
    await deleteObject(result.previousLogoKey)
  }
  return context.json({ success: true })
})

shopsRouter.post('/me/logo-upload', zValidator('json', logoUploadSchema, validationHook), async (context) => {
  const { shopId } = await requireOwner(context.req.raw)
  const input = context.req.valid('json')
  if (input.size > MAX_UPLOAD_SIZE) throw new HTTPException(413, { message: 'Logo is too large' })
  const upload = createLogoUploadData(shopId)
  return context.json({ ...upload, key: upload.publicId, previewUrl: logoPublicUrl(upload.publicId) })
})

export { shopsRouter }
