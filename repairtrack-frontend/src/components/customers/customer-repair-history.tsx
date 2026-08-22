'use client'

import * as React from 'react'
import Link from 'next/link'
import { History, Wrench, ChevronRight } from 'lucide-react'
import { useCustomerRepairHistory } from '@/features/customers/queries'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface CustomerRepairHistoryProps {
  customerId: string
}

export function CustomerRepairHistory({ customerId }: CustomerRepairHistoryProps) {
  const { data: repairs, isLoading, isError } = useCustomerRepairHistory(customerId)

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load repair history. Please try refreshing.
      </div>
    )
  }

  if (!repairs || repairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center bg-card/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <History className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No repairs yet for this customer</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          When this customer submits a device for service, repair tickets will be tracked here.
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'READY_FOR_PICKUP':
        return <Badge variant="warning">Ready for Pickup</Badge>
      case 'IN_REPAIR':
      case 'DIAGNOSING':
        return <Badge variant="default">{status.replace('_', ' ')}</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket #</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repairs.map((repair) => (
            <TableRow key={repair.id}>
              <TableCell className="font-mono text-xs font-semibold text-foreground">
                #{repair.ticketNumber}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">
                    {repair.device ? `${repair.device.brand} ${repair.device.model}` : 'Unknown Device'}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(repair.status)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(repair.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {repair.finalCost
                  ? `₹${(repair.finalCost / 100).toFixed(2)}`
                  : repair.estimatedCost
                  ? `~₹${(repair.estimatedCost / 100).toFixed(2)}`
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/repairs/${repair.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-steel hover:text-foreground transition-colors"
                >
                  Details
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
