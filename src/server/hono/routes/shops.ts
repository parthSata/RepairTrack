import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { logoUploadSchema, shopProfileSchema } from '@/features/shop/schemas'
import { auth } from '@/server/auth'
import { createLogoUploadData, deleteObject, logoPublicUrl, MAX_UPLOAD_SIZE } from '@/server/storage/cloudinary'
import { getShopById, updateShopProfile } from '@/server/services/shop.service'

const shopsRouter = new Hono()

async function ownerSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  if (session.user.role !== 'OWNER' || !session.user.shopId) throw new HTTPException(403, { message: 'Not authorized' })
  return { session, shopId: session.user.shopId, email: session.user.email }
}

shopsRouter.get('/me', async (context) => {
  const { shopId, email } = await ownerSession(context.req.raw)
  const shop = await getShopById(shopId)
  if (!shop) throw new HTTPException(404, { message: 'Shop not found' })
  return context.json({
    id: shop.id,
    shopName: shop.shopName,
    phone: shop.phone ?? '',
    email,
    address: shop.address ?? '',
    businessInfo: shop.businessInfo ?? '',
    logoUrl: shop.logoUrl ?? '',
    logoPreviewUrl: shop.logoUrl ? logoPublicUrl(shop.logoUrl) : null,
  })
})

shopsRouter.patch('/me', zValidator('json', shopProfileSchema, (result, context) => {
  if (!result.success) return context.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
}), async (context) => {
  const { shopId, email } = await ownerSession(context.req.raw)
  const profile = { ...context.req.valid('json'), email }
  const result = await updateShopProfile(shopId, profile)
  if (!result) throw new HTTPException(404, { message: 'Shop not found' })
  if (result.previousLogoKey && result.previousLogoKey !== profile.logoUrl) {
    await deleteObject(result.previousLogoKey)
  }
  return context.json({ success: true })
})

shopsRouter.post('/me/logo-upload', zValidator('json', logoUploadSchema, (result, context) => {
  if (!result.success) return context.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
}), async (context) => {
  const { shopId } = await ownerSession(context.req.raw)
  const input = context.req.valid('json')
  if (input.size > MAX_UPLOAD_SIZE) throw new HTTPException(413, { message: 'Logo is too large' })
  const upload = createLogoUploadData(shopId)
  return context.json({ ...upload, key: upload.publicId, previewUrl: logoPublicUrl(upload.publicId) })
})

export { shopsRouter }