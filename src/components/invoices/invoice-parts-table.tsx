import { Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { invoiceLineTotal } from '@/features/invoices/format'
import type { InvoiceItem } from '@/features/invoices/queries'
import { formatRupees } from '@/lib/format-money'

export function InvoicePartsTable({ items }: { items: InvoiceItem[] }) {
  if (items.length === 0) {
    return (
      <TableEmptyState
        icon={Package}
        title="No parts on this invoice"
        description="This repair was billed for labor and additional charges only."
      />
    )
  }

  return (
    <>
      <div className="hidden sm:block print:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="print:break-inside-avoid">
                <TableCell className="font-medium">{item.partName}</TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupees(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatRupees(invoiceLineTotal(item))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border sm:hidden print:hidden">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="wrap-break-word font-medium text-foreground">{item.partName}</p>
              <p className="tabular-nums text-muted-foreground">
                {item.quantity} × {formatRupees(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums text-foreground">
              {formatRupees(invoiceLineTotal(item))}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
