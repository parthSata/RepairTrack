'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Hash, History, Pencil, User, Wrench } from 'lucide-react'
import { useDevice } from '@/features/devices/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ConditionBadge, DeviceTypeIcon } from './device-table'
import { DeviceForm } from './device-form'
import { DeviceRepairHistory } from './device-repair-history'

interface DeviceDetailsProps {
  id: string
}

export function DeviceDetails({ id }: DeviceDetailsProps) {
  const { data: device, isLoading, isError, refetch } = useDevice(id)
  const [editOpen, setEditOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !device) {
    return (
      <div className="space-y-4">
        <Link href="/devices">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Devices
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p className="font-semibold">Device not found or failed to load.</p>
          <button onClick={() => refetch()} className="underline font-medium mt-2">
            Retry loading
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/devices">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Devices
          </Button>
        </Link>

        <Button variant="outline" className="h-8 px-3 text-xs gap-2" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Device
        </Button>
      </div>

      {/* Main Device Overview Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 shrink-0">
              <DeviceTypeIcon type={device.deviceType} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {device.brand} {device.model}
                </h1>
                <ConditionBadge condition={device.condition} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {device.deviceType}
              </p>
            </div>
          </div>
        </div>

        {/* Detail Meta Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          {/* Linked Customer */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Owner / Customer
            </span>
            {device.customer ? (
              <Link
                href={`/customers/${device.customer.id}`}
                className="text-sm font-semibold text-accent hover:underline block"
              >
                {device.customer.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground italic">No linked customer</span>
            )}
          </div>

          {/* Serial Number */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              Serial / IMEI
            </span>
            <p className="text-sm font-mono font-medium text-foreground">
              {device.serialNumber || '—'}
            </p>
          </div>

          {/* Accessories */}
          <div className="space-y-1 sm:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Accessories Included
            </span>
            <p className="text-sm text-foreground">
              {device.accessories || 'None recorded'}
            </p>
          </div>
        </div>
      </div>

      {/* Repair History Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Repair History</h2>
          </div>
          <DeviceRepairHistory deviceId={device.id} />
        </CardContent>
      </Card>

      {/* Edit Device Dialog Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogHeader>
          <DialogTitle>Edit Device Details</DialogTitle>
          <DialogDescription>
            Update device specification, serial number, condition, or customer association.
          </DialogDescription>
        </DialogHeader>
        <DeviceForm
          mode="edit"
          deviceId={device.id}
          initialData={{
            customerId: device.customerId,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serialNumber ?? '',
            deviceType: device.deviceType,
            condition: device.condition,
            accessories: device.accessories ?? '',
          }}
          initialCustomer={device.customer}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>
    </div>
  )
}
