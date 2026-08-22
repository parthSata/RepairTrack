'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronRight,
  HardDrive,
  Laptop,
  Monitor,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Tablet,
  User,
  X,
} from 'lucide-react'
import { useDevices, type Device } from '@/features/devices/queries'
import type { DeviceFilterInput, DeviceType } from '@/features/devices/schemas'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DeviceForm } from './device-form'

export function DeviceTypeIcon({ type }: { type: DeviceType }) {
  switch (type) {
    case 'PHONE':
      return <Smartphone className="h-4 w-4 text-sky-500 shrink-0" />
    case 'LAPTOP':
      return <Laptop className="h-4 w-4 text-indigo-500 shrink-0" />
    case 'TABLET':
      return <Tablet className="h-4 w-4 text-purple-500 shrink-0" />
    case 'DESKTOP':
      return <Monitor className="h-4 w-4 text-emerald-500 shrink-0" />
    default:
      return <HardDrive className="h-4 w-4 text-slate-500 shrink-0" />
  }
}

export function ConditionBadge({ condition }: { condition: string }) {
  switch (condition) {
    case 'GOOD':
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
          Good
        </span>
      )
    case 'FAIR':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
          Fair
        </span>
      )
    case 'POOR':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 border border-rose-500/20">
          Poor
        </span>
      )
    default:
      return <Badge variant="outline">{condition}</Badge>
  }
}

export function DeviceTable() {
  const [filters, setFilters] = React.useState<DeviceFilterInput>({
    search: '',
    deviceType: 'ALL',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editDevice, setEditDevice] = React.useState<Device | null>(null)

  const { data, isLoading, isError, refetch } = useDevices(filters)

  const columns: ColumnDef<Device>[] = [
    {
      accessorKey: 'brand',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Device (Brand / Model)" />,
      cell: ({ row }) => {
        const device = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border shrink-0">
              <DeviceTypeIcon type={device.deviceType} />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/devices/${device.id}`}
                className="font-semibold text-foreground hover:text-accent transition-colors flex items-center gap-1 group"
              >
                <span>{device.brand} {device.model}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </Link>
              <span className="text-xs text-muted-foreground capitalize">
                {device.deviceType.toLowerCase()}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'serialNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Serial / IMEI" />,
      cell: ({ row }) => {
        const sn = row.original.serialNumber
        return sn ? (
          <span className="font-mono text-xs text-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border">
            {sn}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">—</span>
        )
      },
    },
    {
      accessorKey: 'customer',
      header: 'Linked Customer',
      cell: ({ row }) => {
        const cust = row.original.customer
        return cust ? (
          <Link
            href={`/customers/${cust.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[160px]">{cust.name}</span>
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">Unlinked</span>
        )
      },
    },
    {
      accessorKey: 'condition',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Condition" />,
      cell: ({ row }) => <ConditionBadge condition={row.original.condition} />,
    },
    {
      accessorKey: 'totalRepairs',
      header: 'Repairs',
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          {row.original.totalRepairs ?? 0} repairs
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row }) => {
        const device = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/devices/${device.id}`}>
              <Button variant="ghost" className="h-8 px-2 text-xs" aria-label={`View ${device.brand} ${device.model}`}>
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setEditDevice(device)}
              aria-label={`Edit ${device.brand} ${device.model}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
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
      sortBy: sortBy as DeviceFilterInput['sortBy'],
      sortOrder,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by brand, model, serial..."
              value={filters.search ?? ''}
              onChange={handleSearchChange}
              className="pl-9 pr-8 h-10 text-sm"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, search: '', page: 1 }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {data && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {data.total} {data.total === 1 ? 'Device' : 'Devices'}
            </span>
          )}
        </div>

        <Button variant="accent" className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Table */}
      {isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Failed to load devices.{' '}
          <button onClick={() => refetch()} className="underline font-medium">
            Retry
          </button>
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
                <Smartphone className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-foreground">No devices match your search.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for a different brand, model, or serial number.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No devices yet — register a device to start a repair.
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Register customer devices to manage repairs, track service histories, and link tickets.
                </p>
                <Button variant="accent" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add First Device
                </Button>
              </div>
            )
          }
        />
      )}

      {/* Create Device Dialog Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Register New Device</DialogTitle>
          <DialogDescription>
            Select an existing customer and enter device information to register it to your shop.
          </DialogDescription>
        </DialogHeader>
        <DeviceForm
          mode="create"
          onSuccess={() => setCreateOpen(false)}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>

      {/* Edit Device Dialog Modal */}
      <Dialog open={Boolean(editDevice)} onOpenChange={(open) => !open && setEditDevice(null)}>
        <DialogHeader>
          <DialogTitle>Edit Device Details</DialogTitle>
          <DialogDescription>
            Update brand, model, condition, or linked customer for this device.
          </DialogDescription>
        </DialogHeader>
        {editDevice && (
          <DeviceForm
            mode="edit"
            deviceId={editDevice.id}
            initialData={{
              customerId: editDevice.customerId,
              brand: editDevice.brand,
              model: editDevice.model,
              serialNumber: editDevice.serialNumber ?? '',
              deviceType: editDevice.deviceType,
              condition: editDevice.condition,
              accessories: editDevice.accessories ?? '',
            }}
            initialCustomer={editDevice.customer}
            onSuccess={() => setEditDevice(null)}
            onCancel={() => setEditDevice(null)}
          />
        )}
      </Dialog>
    </div>
  )
}
