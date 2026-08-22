import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairs } from '@/server/db/schema/repairs'
import type { DeviceFilterInput, DeviceFormInput, DeviceType } from '@/features/devices/schemas'

export async function listDevices({
  shopId,
  search,
  deviceType,
  customerId,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: DeviceFilterInput & { shopId: string }) {
  const offset = (page - 1) * limit

  const searchCondition = search
    ? or(
        ilike(devices.brand, `%${search}%`),
        ilike(devices.model, `%${search}%`),
        ilike(devices.serialNumber, `%${search}%`),
        ilike(customers.name, `%${search}%`),
      )
    : undefined

  const conditions = [eq(devices.shopId, shopId)]

  if (searchCondition) {
    conditions.push(searchCondition)
  }
  if (deviceType && deviceType !== 'ALL') {
    conditions.push(eq(devices.deviceType, deviceType as DeviceType))
  }
  if (customerId) {
    conditions.push(eq(devices.customerId, customerId))
  }

  const whereClause = and(...conditions)

  const countResult = await db
    .select({ total: count() })
    .from(devices)
    .leftJoin(customers, eq(customers.id, devices.customerId))
    .where(whereClause)

  const total = countResult[0]?.total ?? 0
  const totalPages = Math.ceil(total / limit) || 1

  const sortColumn =
    sortBy === 'brand'
      ? devices.brand
      : sortBy === 'model'
      ? devices.model
      : sortBy === 'updatedAt'
      ? devices.updatedAt
      : devices.createdAt

  const items = await db
    .select({
      id: devices.id,
      shopId: devices.shopId,
      customerId: devices.customerId,
      brand: devices.brand,
      model: devices.model,
      serialNumber: devices.serialNumber,
      deviceType: devices.deviceType,
      condition: devices.condition,
      accessories: devices.accessories,
      createdAt: devices.createdAt,
      updatedAt: devices.updatedAt,
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      },
      totalRepairs: sql<number>`(SELECT COUNT(*)::int FROM repairs WHERE repairs.device_id = ${devices.id})`,
    })
    .from(devices)
    .leftJoin(customers, eq(customers.id, devices.customerId))
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

export async function getDeviceById({ shopId, id }: { shopId: string; id: string }) {
  const result = await db
    .select({
      id: devices.id,
      shopId: devices.shopId,
      customerId: devices.customerId,
      brand: devices.brand,
      model: devices.model,
      serialNumber: devices.serialNumber,
      deviceType: devices.deviceType,
      condition: devices.condition,
      accessories: devices.accessories,
      createdAt: devices.createdAt,
      updatedAt: devices.updatedAt,
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      },
      totalRepairs: sql<number>`(SELECT COUNT(*)::int FROM repairs WHERE repairs.device_id = ${devices.id})`,
    })
    .from(devices)
    .leftJoin(customers, eq(customers.id, devices.customerId))
    .where(and(eq(devices.id, id), eq(devices.shopId, shopId)))

  const device = result[0]
  if (!device) throw new HTTPException(404, { message: 'Device not found' })

  return device
}

export async function createDevice({
  shopId,
  data,
}: {
  shopId: string
  data: DeviceFormInput
}) {
  // Verify linked customer belongs to the same shop_id
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, data.customerId), eq(customers.shopId, shopId)))

  if (!customer) {
    throw new HTTPException(400, {
      message: 'Invalid customer selection. Customer does not exist in your shop.',
    })
  }

  const id = crypto.randomUUID()
  const [created] = await db
    .insert(devices)
    .values({
      id,
      shopId,
      customerId: data.customerId,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber ?? null,
      deviceType: data.deviceType,
      condition: data.condition,
      accessories: data.accessories ?? null,
    })
    .returning()

  return created
}

export async function updateDevice({
  shopId,
  id,
  data,
}: {
  shopId: string
  id: string
  data: DeviceFormInput
}) {
  // Verify device exists in this shop
  const [existing] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, id), eq(devices.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Device not found' })
  }

  // Verify linked customer belongs to the same shop_id
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, data.customerId), eq(customers.shopId, shopId)))

  if (!customer) {
    throw new HTTPException(400, {
      message: 'Invalid customer selection. Customer does not exist in your shop.',
    })
  }

  const [updated] = await db
    .update(devices)
    .set({
      customerId: data.customerId,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber ?? null,
      deviceType: data.deviceType,
      condition: data.condition,
      accessories: data.accessories ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(devices.id, id), eq(devices.shopId, shopId)))
    .returning()

  return updated
}

export async function deleteDevice({ shopId, id }: { shopId: string; id: string }) {
  const [existing] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, id), eq(devices.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Device not found' })
  }

  const [repairCount] = await db
    .select({ total: count() })
    .from(repairs)
    .where(and(eq(repairs.deviceId, id), eq(repairs.shopId, shopId)))

  if ((repairCount?.total ?? 0) > 0) {
    throw new HTTPException(400, {
      message: 'Cannot delete device with existing repair history.',
    })
  }

  await db
    .delete(devices)
    .where(and(eq(devices.id, id), eq(devices.shopId, shopId)))

  return { success: true }
}

export async function getDeviceRepairHistory({
  shopId,
  deviceId,
}: {
  shopId: string
  deviceId: string
}) {
  // Check device exists
  const [existing] = await db
    .select({ id: devices.id })
    .from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Device not found' })
  }

  const history = await db
    .select({
      id: repairs.id,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
      issueDescription: repairs.issueDescription,
      estimatedCost: repairs.estimatedCost,
      finalCost: repairs.finalCost,
      createdAt: repairs.createdAt,
    })
    .from(repairs)
    .where(and(eq(repairs.deviceId, deviceId), eq(repairs.shopId, shopId)))
    .orderBy(desc(repairs.createdAt))

  return history
}
