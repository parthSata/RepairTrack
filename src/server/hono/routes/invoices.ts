import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  cancelInvoiceSchema,
  createInvoiceSchema,
  INVOICE_MESSAGES,
  invoiceFilterSchema,
} from '@/features/invoices/schemas'
import { idParamSchema } from '@/lib/validation'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
import {
  cancelInvoice,
  createInvoiceFromRepair,
  getInvoiceById,
  listInvoices,
} from '@/server/services/invoice.service'

const invoicesRouter = new Hono()

const requireInvoiceAccess = (request: Request) =>
  requireRole(request, ['OWNER', 'STAFF'], INVOICE_MESSAGES.forbidden)

invoicesRouter.get('/', zValidator('query', invoiceFilterSchema, validationHook), async (c) => {
  const { shopId } = await requireInvoiceAccess(c.req.raw)
  const result = await listInvoices({ ...c.req.valid('query'), shopId })
  return c.json(result)
})

invoicesRouter.post('/', zValidator('json', createInvoiceSchema, validationHook), async (c) => {
  const { shopId, userId } = await requireInvoiceAccess(c.req.raw)
  const { repairId } = c.req.valid('json')
  const invoice = await createInvoiceFromRepair({ shopId, repairId, createdBy: userId })
  return c.json(invoice, 201)
})

invoicesRouter.get('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId } = await requireInvoiceAccess(c.req.raw)
  const invoice = await getInvoiceById({ shopId, id: c.req.valid('param').id })
  return c.json(invoice)
})

invoicesRouter.post(
  '/:id/cancel',
  zValidator('param', idParamSchema, validationHook),
  zValidator('json', cancelInvoiceSchema, validationHook),
  async (c) => {
    const { shopId, userId } = await requireInvoiceAccess(c.req.raw)
    const { reason } = c.req.valid('json')
    const invoice = await cancelInvoice({
      shopId,
      id: c.req.valid('param').id,
      reason,
      cancelledBy: userId,
    })
    return c.json(invoice)
  },
)

export { invoicesRouter }
