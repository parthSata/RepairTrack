'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ChevronRight,
  HardDrive,
  Laptop,
  MessageSquareWarning,
  Monitor,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  X,
} from 'lucide-react'

export function ModelVerificationBadge({
  modelVerified,
  modelVerificationOverridden,
}: {
  modelVerified: boolean
  modelVerificationOverridden?: boolean
}) {
  if (modelVerificationOverridden) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 border border-amber-500/20 shrink-0">
        <MessageSquareWarning className="h-3 w-3 shrink-0 text-amber-600" />
        Model Unconfirmed (Override)
      </span>
    )
  }

  if (!modelVerified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 border border-amber-500/20 shrink-0">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
        Unverified
      </span>
    )
  }

  return null
}
import { useDevices, type Device, type LinkedCustomer } from '@/features/devices/queries'
import type { DeviceFilterInput, DeviceType } from '@/features/devices/schemas'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DeviceForm } from './device-form'
import { DeviceDeleteDialog } from './device-delete-dialog'
import { DeviceGroupHeader } from './device-group-header'

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
  const [deleteDevice, setDeleteDevice] = React.useState<Device | null>(null)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({})

  const { data, isLoading, isError, refetch } = useDevices(filters)

  const [searchTerm, setSearchTerm] = React.useState(filters.search ?? '')

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchTerm) return prev
        return { ...prev, search: searchTerm, page: 1 }
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Group devices by customer ID
  const deviceItems = data?.items
  const groupedData = React.useMemo(() => {
    if (!deviceItems) return []
    const groupsMap = new Map<string, { customer: LinkedCustomer | null; items: Device[] }>()

    for (const device of deviceItems) {
      const key = device.customer?.id ?? 'unlinked'
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          customer: device.customer ?? null,
          items: [],
        })
      }
      groupsMap.get(key)!.items.push(device)
    }

    return Array.from(groupsMap.entries()).map(([key, group]) => ({
      key,
      customer: group.customer,
      items: group.items,
    }))
  }, [deviceItems])

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handlePageChange = (pageIndex: number) => {
    setFilters((prev) => ({ ...prev, page: pageIndex + 1 }))
  }

  const handleSortToggle = (column: 'brand' | 'model' | 'createdAt') => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
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
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 pr-8 h-10 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setFilters((prev) => ({ ...prev, search: '', page: 1 }))
                }}
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

      {/* Table Container */}
      {isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Failed to load devices.{' '}
          <button onClick={() => refetch()} className="underline font-medium">
            Retry
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%] cursor-pointer select-none" onClick={() => handleSortToggle('brand')}>
                  <div className="flex items-center gap-1">
                    <span>Device (Brand / Model)</span>
                    {filters.sortBy === 'brand' && (
                      <span className="text-xs">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-[20%]">Serial / IMEI</TableHead>
                <TableHead className="w-[15%]">Condition</TableHead>
                <TableHead className="w-[15%]">Repairs</TableHead>
                <TableHead className="w-[15%] text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-row-${index}`}>
                    <TableCell className="pl-4">
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : groupedData.length > 0 ? (
                groupedData.map((group) => {
                  const isExpanded = !collapsedGroups[group.key]

                  return (
                    <React.Fragment key={`group-${group.key}`}>
                      {/* Customer Group Header Row */}
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="p-0 border-b border-border">
                          <DeviceGroupHeader
                            customer={group.customer}
                            deviceCount={group.items.length}
                            isExpanded={isExpanded}
                            onToggle={() => toggleGroup(group.key)}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Nested Device Rows */}
                      {isExpanded &&
                        group.items.map((device) => (
                          <TableRow
                            key={device.id}
                            className="hover:bg-muted/30 transition-colors border-b border-border/50"
                          >
                            {/* Brand / Model Column (Indented) */}
                            <TableCell className="pl-8 sm:pl-10">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border shrink-0">
                                  <DeviceTypeIcon type={device.deviceType} />
                                </div>
                                <div className="flex flex-col">
                                  <Link
                                    href={`/devices/${device.id}`}
                                    className="font-semibold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1.5 flex-wrap group"
                                  >
                                    <span>{device.brand}</span>
                                    {device.model ? (
                                      <span>{device.model}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic font-normal">
                                        Unconfirmed
                                      </span>
                                    )}
                                    <ModelVerificationBadge
                                      modelVerified={device.modelVerified}
                                      modelVerificationOverridden={device.modelVerificationOverridden}
                                    />
                                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                  </Link>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {device.deviceType.toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Serial Number */}
                            <TableCell>
                              {device.serialNumber ? (
                                <span className="font-mono text-xs text-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border">
                                  {device.serialNumber}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/60 italic">—</span>
                              )}
                            </TableCell>

                            {/* Condition */}
                            <TableCell>
                              <ConditionBadge condition={device.condition} />
                            </TableCell>

                            {/* Repairs Count */}
                            <TableCell>
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                                {device.totalRepairs ?? 0} repairs
                              </span>
                            </TableCell>

                            {/* Row Actions */}
                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/devices/${device.id}`}>
                                  <Button
                                    variant="ghost"
                                    className="h-8 px-2 text-xs"
                                    aria-label={`View ${device.brand} ${device.model}`}
                                  >
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
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteDevice(device)}
                                  aria-label={`Delete ${device.brand} ${device.model}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    {filters.search ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Smartphone className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                          No devices match your search.
                        </p>
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
                        <Button
                          variant="accent"
                          className="mt-4 gap-2"
                          onClick={() => setCreateOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Add First Device
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card text-xs text-muted-foreground">
              <span>
                Page {data.page} of {data.totalPages} ({data.total} total devices)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => handlePageChange(data.page - 2)}
                  disabled={data.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => handlePageChange(data.page)}
                  disabled={data.page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
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

      {/* Delete Device Dialog */}
      <DeviceDeleteDialog
        open={Boolean(deleteDevice)}
        onOpenChange={(open) => !open && setDeleteDevice(null)}
        device={deleteDevice}
        onSuccess={() => setDeleteDevice(null)}
      />
    </div>
  )
}
