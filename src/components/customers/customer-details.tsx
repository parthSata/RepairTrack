'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, FileText, Mail, MapPin, Pencil, Phone, Trash2, User } from 'lucide-react'



import { useCustomer } from '@/features/customers/queries'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerForm } from './customer-form'
import { CustomerDeleteDialog } from './customer-delete-dialog'
import { CustomerRepairHistory } from './customer-repair-history'

interface CustomerDetailsProps {
  id: string
}

export function CustomerDetails({ id }: CustomerDetailsProps) {
  const router = useRouter()
  const { data: customer, isLoading, isError } = useCustomer(id)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Customer not found or failed to load details.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Customers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit Customer
            </Button>
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10 gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 md:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-steel">Contact Information</h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </p>
              <p className="font-medium text-foreground mt-0.5">{customer.phone}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </p>
              <p className="font-medium text-foreground mt-0.5">{customer.email || 'Not provided'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </p>
              <p className="font-medium text-foreground mt-0.5 whitespace-pre-line">
                {customer.address || 'No address on file'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Customer Since
              </p>
              <p className="font-medium text-foreground mt-0.5">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3 md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-steel flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Internal Shop Notes
          </h2>
          {customer.notes ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/40 rounded-lg p-3 border border-border/50">
              {customer.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No internal notes for this customer.</p>
          )}
        </div>
      </div>

      {/* Repair History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Repair History</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {customer.totalRepairs ?? 0} {customer.totalRepairs === 1 ? 'Repair' : 'Repairs'}
          </span>
        </div>

        <CustomerRepairHistory customerId={customer.id} />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          mode="edit"
          customerId={customer.id}
          initialData={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? '',
          }}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>

      {/* Delete Dialog */}
      <CustomerDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customer={customer}
        onSuccess={() => {
          setDeleteOpen(false)
          router.push('/customers')
        }}
      />
    </div>
  )
}
