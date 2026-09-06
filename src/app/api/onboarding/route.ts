import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { shops, users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

const onboardingSchema = z.object({ shopName: z.string().trim().min(2).max(120) })

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = onboardingSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid shop name' }, { status: 400 })

  const shopId = crypto.randomUUID()
  await db.transaction(async (transaction) => {
    await transaction.insert(shops).values({ id: shopId, name: parsed.data.shopName })
    await transaction.update(users).set({ shopId, role: 'OWNER' }).where(eq(users.id, session.user.id))
  })
  return NextResponse.json({ shopId }, { status: 201 })
}