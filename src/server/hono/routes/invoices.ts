import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  cancelInvoiceSchema,
  createInvoiceSchema,
  INVOICE_MESSAGES,
} from '@/features/invoices/schemas'
import { auth } from '@/server/auth'
import {
  cancelInvoice,
  createInvoiceFromRepair,
  getInvoiceById,
} from '@/server/services/invoice.service'

const INVOICE_ROLES = ['OWNER', 'STAFF']

const invoicesRouter = new Hono()

async function requireInvoiceAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!INVOICE_ROLES.includes(role) || !shopId) {
    throw new HTTPException(403, { message: INVOICE_MESSAGES.forbidden })
  }

  return { shopId, userId: session.user.id }
}

invoicesRouter.post(
  '/',
  zValidator('json', createInvoiceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId, userId } = await requireInvoiceAccess(c.req.raw)
    const { repairId } = c.req.valid('json')
    const invoice = await createInvoiceFromRepair({ shopId, repairId, createdBy: userId })
    return c.json(invoice, 201)
  },
)

invoicesRouter.get('/:id', async (c) => {
  const { shopId } = await requireInvoiceAccess(c.req.raw)
  const invoice = await getInvoiceById({ shopId, id: c.req.param('id') })
  return c.json(invoice)
})

invoicesRouter.post(
  '/:id/cancel',
  zValidator('json', cancelInvoiceSchema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Validation failed'
      return c.json({ error: { message, code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId, userId } = await requireInvoiceAccess(c.req.raw)
    const { reason } = c.req.valid('json')
    const invoice = await cancelInvoice({
      shopId,
      id: c.req.param('id'),
      reason,
      cancelledBy: userId,
    })
    return c.json(invoice)
  },
)

export { invoicesRouter }
