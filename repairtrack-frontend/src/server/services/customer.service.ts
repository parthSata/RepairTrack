import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairs } from '@/server/db/schema/repairs'
import type { CustomerFilterInput, CustomerFormInput } from '@/features/customers/schemas'
import { verifyEmailDomain } from '@/server/utils/email-domain-validator'

export async function listCustomers({
  shopId,
  search,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: CustomerFilterInput & { shopId: string }) {
  const offset = (page - 1) * limit

  const searchCondition = search
    ? or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(customers.email, `%${search}%`),
      )
    : undefined

  const whereClause = searchCondition
    ? and(eq(customers.shopId, shopId), searchCondition)
    : eq(customers.shopId, shopId)

  const countResult = await db
    .select({ total: count() })
    .from(customers)
    .where(whereClause)

  const total = countResult[0]?.total ?? 0
  const totalPages = Math.ceil(total / limit) || 1

  const sortColumn =
    sortBy === 'name'
      ? customers.name
      : sortBy === 'phone'
      ? customers.phone
      : sortBy === 'updatedAt'
      ? customers.updatedAt
      : customers.createdAt

  const items = await db
    .select({
      id: customers.id,
      shopId: customers.shopId,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      notes: customers.notes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      totalRepairs: sql<number>`COALESCE((SELECT COUNT(*)::int FROM repairs WHERE repairs.customer_id = customers.id), 0)`,
      lastVisit: sql<string | null>`(SELECT max(created_at) FROM repairs WHERE repairs.customer_id = customers.id)`,
    })
    .from(customers)
    .where(whereClause)
    .orderBy(sortOrder === 'asc' ? sortColumn : desc(sortColumn))
    .limit(limit)
    .offset(offset)

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  }
}

export async function getCustomerById({ shopId, id }: { shopId: string; id: string }) {
  const result = await db
    .select({
      id: customers.id,
      shopId: customers.shopId,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      notes: customers.notes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      totalRepairs: sql<number>`COALESCE((SELECT COUNT(*)::int FROM repairs WHERE repairs.customer_id = customers.id), 0)`,
      lastVisit: sql<string | null>`(SELECT max(created_at) FROM repairs WHERE repairs.customer_id = customers.id)`,
    })
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.shopId, shopId)))

  const customer = result[0]
  if (!customer) throw new HTTPException(404, { message: 'Customer not found' })

  return customer
}

export async function checkCustomerEmail({
  shopId,
  email,
  excludeCustomerId,
}: {
  shopId: string
  email: string
  excludeCustomerId?: string
}) {
  if (!email || email.trim() === '') {
    return { exists: false, validDomain: true, customer: null, reason: null }
  }

  const domainCheck = await verifyEmailDomain(email)
  if (!domainCheck.valid) {
    return {
      exists: false,
      validDomain: false,
      customer: null,
      reason: domainCheck.reason ?? 'Invalid or non-existent email domain.',
    }
  }

  const conditions = [eq(customers.shopId, shopId), ilike(customers.email, email.trim())]
  if (excludeCustomerId) {
    conditions.push(sql`${customers.id} != ${excludeCustomerId}`)
  }

  const [existing] = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
    })
    .from(customers)
    .where(and(...conditions))

  if (existing) {
    return {
      exists: true,
      validDomain: true,
      customer: existing,
      reason: `Customer "${existing.name}" already uses this email.`,
    }
  }

  return { exists: false, validDomain: true, customer: null, reason: null }
}

export async function createCustomer({
  shopId,
  data,
}: {
  shopId: string
  data: CustomerFormInput
}) {
  const existingPhone = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.phone, data.phone)))

  if (existingPhone.length > 0) {
    throw new HTTPException(400, { message: 'A customer with this phone number already exists in your shop' })
  }

  if (data.email && data.email.trim() !== '') {
    const domainCheck = await verifyEmailDomain(data.email)
    if (!domainCheck.valid) {
      throw new HTTPException(400, {
        message: domainCheck.reason || `Email address "${data.email}" does not exist or cannot receive mail.`,
      })
    }

    const existingEmail = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(and(eq(customers.shopId, shopId), ilike(customers.email, data.email.trim())))

    if (existingEmail.length > 0) {
      throw new HTTPException(400, {
        message: `A customer (${existingEmail[0].name}) with email "${data.email}" already exists in your shop`,
      })
    }
  }

  const id = crypto.randomUUID()
  const [created] = await db
    .insert(customers)
    .values({
      id,
      shopId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    })
    .returning()

  return created
}

export async function updateCustomer({
  shopId,
  id,
  data,
}: {
  shopId: string
  id: string
  data: CustomerFormInput
}) {
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Customer not found' })
  }

  if (data.phone !== existing.phone) {
    const existingPhone = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.shopId, shopId), eq(customers.phone, data.phone)))

    if (existingPhone.length > 0) {
      throw new HTTPException(400, { message: 'A customer with this phone number already exists in your shop' })
    }
  }

  if (data.email && data.email.trim() !== '' && data.email.toLowerCase() !== (existing.email ?? '').toLowerCase()) {
    const domainCheck = await verifyEmailDomain(data.email)
    if (!domainCheck.valid) {
      throw new HTTPException(400, {
        message: domainCheck.reason || `Email address "${data.email}" does not exist or cannot receive mail.`,
      })
    }

    const existingEmail = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(
        and(
          eq(customers.shopId, shopId),
          ilike(customers.email, data.email.trim()),
          sql`${customers.id} != ${id}`,
        ),
      )

    if (existingEmail.length > 0) {
      throw new HTTPException(400, {
        message: `A customer (${existingEmail[0].name}) with email "${data.email}" already exists in your shop`,
      })
    }
  }

  const [updated] = await db
    .update(customers)
    .set({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, id), eq(customers.shopId, shopId)))
    .returning()

  return updated
}

export async function deleteCustomer({ shopId, id }: { shopId: string; id: string }) {
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Customer not found' })
  }

  const [repairCount] = await db
    .select({ total: count() })
    .from(repairs)
    .where(and(eq(repairs.customerId, id), eq(repairs.shopId, shopId)))

  if ((repairCount?.total ?? 0) > 0) {
    throw new HTTPException(400, {
      message: 'Cannot delete customer with existing repair history. Archive or delete repairs first.',
    })
  }

  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.shopId, shopId)))

  return { success: true }
}

export async function getCustomerRepairHistory({
  shopId,
  customerId,
}: {
  shopId: string
  customerId: string
}) {
  const history = await db
    .select({
      id: repairs.id,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
      issueDescription: repairs.issueDescription,
      estimatedCost: repairs.estimatedCost,
      finalCost: repairs.finalCost,
      createdAt: repairs.createdAt,
      device: {
        id: devices.id,
        brand: devices.brand,
        model: devices.model,
        serialNumber: devices.serialNumber,
      },
    })
    .from(repairs)
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
    .where(and(eq(repairs.customerId, customerId), eq(repairs.shopId, shopId)))
    .orderBy(desc(repairs.createdAt))

  return history
}
