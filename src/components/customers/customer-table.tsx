'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useCustomers, type Customer } from '@/features/customers/queries'
import type { CustomerFilterInput } from '@/features/customers/schemas'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomerSearchBar } from './customer-search-bar'
import { CustomerForm } from './customer-form'
import { CustomerDeleteDialog } from './customer-delete-dialog'

export function CustomerTable() {
  const [filters, setFilters] = React.useState<CustomerFilterInput>({
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null)
  const [deleteCustomer, setDeleteCustomer] = React.useState<Customer | null>(null)

  const { data, isLoading, isError, refetch } = useCustomers(filters)

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer Name" />,
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex flex-col">
            <Link
              href={`/customers/${customer.id}`}
              className="font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1 group"
            >
              {customer.name}
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </Link>
            {customer.notes && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {customer.notes}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.original.email
        return email ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[180px]">{email}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">—</span>
        )
      },
    },
    {
      accessorKey: 'totalRepairs',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Repairs" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
          {row.original.totalRepairs ?? 0} repairs
        </span>
      ),
    },
    {
      accessorKey: 'lastVisit',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Visit" />,
      cell: ({ row }) => {
        const lastVisit = row.original.lastVisit
        return (
          <span className="text-xs text-muted-foreground">
            {lastVisit ? new Date(lastVisit).toLocaleDateString() : 'Never'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/customers/${customer.id}`}>
              <Button variant="ghost" className="h-8 px-2 text-xs" aria-label={`View ${customer.name}`}>
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setEditCustomer(customer)}
              aria-label={`Edit ${customer.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteCustomer(customer)}
              aria-label={`Delete ${customer.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (pageIndex: number) => {
    setFilters((prev) => ({ ...prev, page: pageIndex + 1 }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, limit: pageSize, page: 1 }))
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as CustomerFilterInput['sortBy'],
      sortOrder,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <CustomerSearchBar value={filters.search ?? ''} onChange={handleSearchChange} />
          {data && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {data.total} {data.total === 1 ? 'Customer' : 'Customers'}
            </span>
          )}
        </div>
        <Button variant="accent" className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Failed to load customers. <button onClick={() => refetch()} className="underline font-medium">Retry</button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          pageCount={data?.totalPages ?? 1}
          pageIndex={(data?.page ?? 1) - 1}
          pageSize={data?.limit ?? 10}
          totalItems={data?.total ?? 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortingChangeManual={handleSortingChange}
          emptyState={
            filters.search ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-foreground">No customers match your search.</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching for a different name or phone number.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No customers yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Add your first customer to start tracking repairs and device histories.
                </p>
                <Button variant="accent" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add First Customer
                </Button>
              </div>
            )
          }
        />
      )}

      {/* Create Customer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          mode="create"
          onSuccess={() => setCreateOpen(false)}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={Boolean(editCustomer)} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        {editCustomer && (
          <CustomerForm
            mode="edit"
            customerId={editCustomer.id}
            initialData={{
              name: editCustomer.name,
              phone: editCustomer.phone,
              email: editCustomer.email ?? '',
              address: editCustomer.address ?? '',
              notes: editCustomer.notes ?? '',
            }}
            onSuccess={() => setEditCustomer(null)}
            onCancel={() => setEditCustomer(null)}
          />
        )}
      </Dialog>

      {/* Delete Customer Dialog */}
      <CustomerDeleteDialog
        open={Boolean(deleteCustomer)}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
        customer={deleteCustomer}
        onSuccess={() => setDeleteCustomer(null)}
      />
    </div>
  )
}
