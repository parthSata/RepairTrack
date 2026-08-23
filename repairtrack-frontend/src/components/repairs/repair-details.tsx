'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, HardDrive, User, Wrench } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Device } from '@/features/devices/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ConditionBadge, DeviceTypeIcon, ModelVerificationBadge } from '@/components/devices/device-table'
import { ModelConfirmationCard } from './model-confirmation-card'
import { StatusChangeControl } from './status-change-control'

interface Repair {
  id: string
  shopId: string
  ticketNumber: string
  status: string
  issueDescription: string | null
  estimatedCost: number | null
  finalCost: number | null
  createdAt: string
  updatedAt: string
  device: {
    id: string
    brand: string
    model: string | null
    serialNumber: string | null
    deviceType: 'PHONE' | 'LAPTOP' | 'TABLET' | 'DESKTOP' | 'OTHER'
    condition: 'GOOD' | 'FAIR' | 'POOR'
    modelVerified: boolean
    modelVerificationOverridden: boolean
    modelVerificationNote: string | null
    customerId: string
    accessories: string | null
  }
  customer: {
    id: string
    name: string
    phone: string
    email: string | null
  }
}

export function RepairDetails({ id }: { id: string }) {
  const {
    data: repair,
    isLoading,
    isError,
    refetch,
  } = useQuery<Repair>({
    queryKey: ['repair', id],
    queryFn: async () => {
      const res = await apiClient.get<Repair>(`repairs/${id}`)
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !repair) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          <p className="font-semibold">Repair ticket not found or failed to load.</p>
          <button onClick={() => refetch()} className="underline font-medium mt-2">
            Retry loading
          </button>
        </div>
      </div>
    )
  }

  const showModelConfirmationCard =
    repair.status === 'DIAGNOSING' && repair.device.modelVerified === false

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
          Ticket #{repair.ticketNumber}
        </span>
      </div>

      {/* 1. TOP CARD: Confirm Device Model Card (if in DIAGNOSING and unverified) */}
      {showModelConfirmationCard && (
        <ModelConfirmationCard device={repair.device as Device} onConfirmed={() => refetch()} />
      )}

      {/* Main Repair Overview Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  Repair Ticket #{repair.ticketNumber}
                </h1>
                <Badge variant="outline" className="font-semibold text-xs uppercase">
                  {repair.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Created on {new Date(repair.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Status Change Control */}
            <div className="w-full sm:w-auto min-w-[240px]">
              <StatusChangeControl
                repairId={repair.id}
                currentStatus={repair.status}
                modelVerified={repair.device.modelVerified}
                onStatusUpdated={() => refetch()}
              />
            </div>
          </div>

          {/* Linked Device Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" />
                Linked Device
              </span>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border shrink-0">
                  <DeviceTypeIcon type={repair.device.deviceType} />
                </div>
                <div className="flex flex-col">
                  <Link
                    href={`/devices/${repair.device.id}`}
                    className="font-semibold text-sm text-foreground hover:text-accent flex items-center gap-1.5 flex-wrap"
                  >
                    <span>{repair.device.brand}</span>
                    {repair.device.model ? (
                      <span>{repair.device.model}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic font-normal">Unconfirmed</span>
                    )}
                    <ModelVerificationBadge
                      modelVerified={repair.device.modelVerified}
                      modelVerificationOverridden={repair.device.modelVerificationOverridden}
                    />
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{repair.device.deviceType.toLowerCase()}</span>
                    <ConditionBadge condition={repair.device.condition} />
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Customer */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Customer
              </span>
              <div className="flex flex-col">
                <Link
                  href={`/customers/${repair.customer.id}`}
                  className="font-semibold text-sm text-accent hover:underline"
                >
                  {repair.customer.name}
                </Link>
                <span className="text-xs text-muted-foreground">{repair.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className="pt-4 border-t border-border space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Reported Issue / Symptoms
            </span>
            <p className="text-sm text-foreground leading-relaxed">
              {repair.issueDescription || 'No description provided.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
