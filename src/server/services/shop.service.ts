import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { shops } from '@/server/db/schema'
import type { ShopProfile } from '@/features/shop/schemas'

export async function getShopById(shopId: string) {
  const [shop] = await db
    .select({
      id: shops.id,
      shopName: shops.name,
      phone: shops.phone,
      email: shops.email,
      address: shops.address,
      businessInfo: shops.businessInfo,
      logoUrl: shops.logoKey,
    })
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1)

  return shop ?? null
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
      logoKey: profile.logoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId))

  return { previousLogoKey: existingShop.logoKey }
}