import type { Invoice } from '@/features/invoices/queries'

export interface InvoicePartyRow {
  label: string
  value: string | null
}

export function customerRows({ customer }: Invoice): InvoicePartyRow[] {
  return [
    { label: 'Name', value: customer.name },
    { label: 'Phone', value: customer.phone },
    { label: 'Email', value: customer.email },
  ]
}

export function deviceRows({ device }: Invoice): InvoicePartyRow[] {
  return [
    { label: 'Brand', value: device.brand },
    { label: 'Model', value: device.model },
    { label: 'Serial / IMEI', value: device.serialNumber },
  ]
}

export function InvoiceParty({ title, rows }: { title: string; rows: InvoicePartyRow[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <dl className="space-y-1 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-2">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 wrap-break-word font-medium text-foreground">
              {row.value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
