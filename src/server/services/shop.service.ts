import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { shops } from '@/server/db/schema'
import { logoPublicUrl } from '@/server/storage/cloudinary'
import { getUpiPayeeName, type ShopProfile, type ShopProfileResponse } from '@/features/shop/schemas'
import type { ShopUpi } from '@/features/payments/upi'
import { parseBusinessHours, serializeBusinessHours } from '@/features/shop/business-hours'

export async function getShopById(shopId: string) {
  const [shop] = await db
    .select({
      id: shops.id,
      shopName: shops.name,
      phone: shops.phone,
      email: shops.email,
      address: shops.address,
      businessInfo: shops.businessInfo,
      businessHours: shops.businessHours,
      logoUrl: shops.logoKey,
      upiId: shops.upiId,
      upiPayeeName: shops.upiPayeeName,
    })
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1)

  return shop ? { ...shop, businessHours: parseBusinessHours(shop.businessHours) } : null
}

export async function getShopUpi(shopId: string): Promise<ShopUpi | null> {
  const [shop] = await db
    .select({ upiId: shops.upiId, upiPayeeName: shops.upiPayeeName, shopName: shops.name })
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1)

  return shop?.upiId ? { upiId: shop.upiId, payeeName: getUpiPayeeName(shop) } : null
}

type Shop = NonNullable<Awaited<ReturnType<typeof getShopById>>>

export function toShopProfileResponse(shop: Shop, email: string): ShopProfileResponse {
  return {
    id: shop.id,
    shopName: shop.shopName,
    phone: shop.phone ?? '',
    email,
    address: shop.address ?? '',
    businessInfo: shop.businessInfo ?? '',
    businessHours: shop.businessHours,
    logoUrl: shop.logoUrl ?? '',
    logoPreviewUrl: shop.logoUrl ? logoPublicUrl(shop.logoUrl) : null,
    upiId: shop.upiId ?? '',
    upiPayeeName: shop.upiPayeeName ?? '',
  }
}

export async function updateShopProfile(shopId: string, profile: ShopProfile) {
  const [existingShop] = await db
    .select({ logoKey: shops.logoKey })
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1)
  if (!existingShop) return null

  await db
    .update(shops)
    .set({
      name: profile.shopName,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      businessInfo: profile.businessInfo || null,
      businessHours: serializeBusinessHours(profile.businessHours),
      logoKey: profile.logoUrl || null,
      upiId: profile.upiId || null,
      upiPayeeName: profile.upiPayeeName || null,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId))

  return { previousLogoKey: existingShop.logoKey }
}
