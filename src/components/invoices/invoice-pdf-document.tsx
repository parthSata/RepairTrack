import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  customerRows,
  deviceRows,
  type InvoicePartyRow,
} from '@/components/invoices/invoice-party'
import { invoiceFileTitle, invoiceLineTotal } from '@/features/invoices/format'
import type { Invoice } from '@/features/invoices/queries'
import { INVOICE_STATUS_LABELS } from '@/features/invoices/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'
import { PDF_FONT_FAMILY } from '@/lib/pdf-fonts'

const MUTED = '#6b7280'
const BORDER = '#e5e7eb'

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: PDF_FONT_FAMILY, fontSize: 10, color: '#111827' },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  header: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderColor: BORDER },
  shopName: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  muted: { color: MUTED },
  right: { textAlign: 'right' },
  label: { fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 4 },
  invoiceNumber: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  cancelled: { color: '#b91c1c' },
  parties: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  party: { flex: 1 },
  partyLabel: { width: 72, color: MUTED },
  partyValue: { flex: 1 },
  tableHead: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 5, fontWeight: 700 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderColor: BORDER },
  colPart: { flex: 3, paddingHorizontal: 6 },
  colNum: { flex: 1.2, paddingHorizontal: 6, textAlign: 'right' },
  summary: { width: 220, marginLeft: 'auto', marginTop: 16, gap: 4 },
  total: { borderTopWidth: 1, borderColor: BORDER, paddingTop: 6, marginTop: 2, fontSize: 12, fontWeight: 700 },
})

function PartyBlock({ title, rows }: { title: string; rows: InvoicePartyRow[] }) {
  return (
    <View style={styles.party}>
      <Text style={styles.label}>{title.toUpperCase()}</Text>
      {rows.map((row) => (
        <View key={row.label} style={[styles.row, { marginBottom: 2 }]}>
          <Text style={styles.partyLabel}>{row.label}</Text>
          <Text style={styles.partyValue}>{row.value || '—'}</Text>
        </View>
      ))}
    </View>
  )
}

function AmountLine({ label, paise, isTotal }: { label: string; paise: number; isTotal?: boolean }) {
  return (
    <View style={isTotal ? [styles.between, styles.total] : styles.between}>
      <Text style={isTotal ? undefined : styles.muted}>{label}</Text>
      <Text>{formatRupees(paise)}</Text>
    </View>
  )
}

/** A4 PDF version of the invoice page; shows the stored amounts only, like InvoiceSummary. */
export function InvoicePdfDocument({ invoice }: { invoice: Invoice }) {
  const { shop } = invoice
  const isCancelled = invoice.status === 'CANCELLED'

  return (
    <Document title={invoiceFileTitle(invoice)} author={shop.name}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.between, styles.header]}>
          <View style={{ maxWidth: '55%' }}>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.address ? <Text style={styles.muted}>{shop.address}</Text> : null}
            {shop.phone ? <Text style={styles.muted}>{shop.phone}</Text> : null}
          </View>
          <View style={styles.right}>
            <Text style={[styles.label, isCancelled ? styles.cancelled : {}]}>
              INVOICE · {INVOICE_STATUS_LABELS[invoice.status].toUpperCase()}
            </Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text>Date: {formatDate(invoice.createdAt)}</Text>
            <Text>Ticket: #{invoice.ticketNumber}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <PartyBlock title="Customer" rows={customerRows(invoice)} />
          <PartyBlock title="Device" rows={deviceRows(invoice)} />
        </View>

        <Text style={styles.label}>PARTS</Text>
        <View style={styles.tableHead}>
          <Text style={styles.colPart}>Part</Text>
          <Text style={styles.colNum}>Qty</Text>
          <Text style={styles.colNum}>Unit price</Text>
          <Text style={styles.colNum}>Line total</Text>
        </View>
        {invoice.items.length === 0 ? (
          <Text style={[styles.muted, { padding: 6 }]}>No parts on this invoice.</Text>
        ) : (
          invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colPart}>{item.partName}</Text>
              <Text style={styles.colNum}>{item.quantity}</Text>
              <Text style={styles.colNum}>{formatRupees(item.unitPrice)}</Text>
              <Text style={styles.colNum}>{formatRupees(invoiceLineTotal(item))}</Text>
            </View>
          ))
        )}

        <View style={styles.summary} wrap={false}>
          <AmountLine label="Labor" paise={invoice.laborCharges} />
          <AmountLine label="Parts" paise={invoice.partsCharges} />
          <AmountLine label="Additional" paise={invoice.additionalCharges} />
          <AmountLine label={`Tax (${invoice.taxPercent}%)`} paise={invoice.taxAmount} />
          <AmountLine label="Total" paise={invoice.total} isTotal />
        </View>
      </Page>
    </Document>
  )
}
