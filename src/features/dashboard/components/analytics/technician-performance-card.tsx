'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRepairDuration } from '@/features/dashboard/lib/format-duration'
import { useTechnicianAnalytics } from '@/features/dashboard/queries'
import type { AnalyticsPeriod, TechnicianPerformancePoint } from '@/features/dashboard/schemas'
import { cn } from '@/lib/utils'
import { AnalyticsCard } from './analytics-card'

const PAGE_SIZE = 5

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

function computeShares(technicians: TechnicianPerformancePoint[]): number[] {
  const total = technicians.reduce((sum, t) => sum + t.completed, 0)
  return technicians.map((t) =>
    total > 0 ? Math.round((t.completed / total) * 100) : 0,
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TechAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent"
    >
      {getInitials(name)}
    </span>
  )
}

function TechNameCell({ name, isActive }: { name: string; isActive: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TechAvatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {!isActive && (
          <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0">
            Inactive
          </Badge>
        )}
      </div>
    </div>
  )
}

function ShareBar({ share }: { share: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${share}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{share}%</span>
    </div>
  )
}

function OverdueCount({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">0</span>
  return (
    <span className="font-semibold text-rose-600 dark:text-rose-400">{value}</span>
  )
}

// ── Desktop Table (md+) ──────────────────────────────────────────────────────

function DesktopTable({
  technicians,
  shares,
}: {
  technicians: TechnicianPerformancePoint[]
  shares: number[]
}) {
  return (
    <div className="hidden md:block w-full overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-0">Technician</TableHead>
            <TableHead className="text-center">Completed</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-center">Overdue</TableHead>
            <TableHead className="text-center">Avg Turnaround</TableHead>
            <TableHead>Share of completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {technicians.map((tech, i) => (
            <TableRow key={tech.technicianId} className="group">
              <TableCell className="pl-0">
                <TechNameCell name={tech.name} isActive={tech.isActive} />
              </TableCell>
              <TableCell className="text-center font-medium">{tech.completed}</TableCell>
              <TableCell className="text-center">{tech.active}</TableCell>
              <TableCell className="text-center">
                <OverdueCount value={tech.overdue} />
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {formatRepairDuration(tech.avgRepairHours)}
              </TableCell>
              <TableCell>
                <ShareBar share={shares[i] ?? 0} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ── Mobile Stacked Cards (< md) ──────────────────────────────────────────────

function MobileCard({
  tech,
  share,
}: {
  tech: TechnicianPerformancePoint
  share: number
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <TechAvatar name={tech.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{tech.name}</p>
          {!tech.isActive && (
            <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0">
              Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Completed', value: tech.completed },
          { label: 'Active', value: tech.active },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-base font-bold text-foreground">{value}</p>
          </div>
        ))}
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p
            className={cn(
              'mt-0.5 text-base font-bold',
              tech.overdue > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-foreground',
            )}
          >
            {tech.overdue}
          </p>
        </div>
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Avg Turnaround</p>
          <p className="mt-0.5 text-base font-bold text-foreground">
            {formatRepairDuration(tech.avgRepairHours)}
          </p>
        </div>
      </div>

      {/* Share bar */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Share of completed repairs</p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${share}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs text-muted-foreground">{share}%</span>
        </div>
      </div>
    </div>
  )
}

function MobileCards({
  technicians,
  shares,
}: {
  technicians: TechnicianPerformancePoint[]
  shares: number[]
}) {
  return (
    <div className="grid gap-3 md:hidden">
      {technicians.map((tech, i) => (
        <MobileCard key={tech.technicianId} tech={tech} share={shares[i] ?? 0} />
      ))}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TechnicianSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-2 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ── Main Export ──────────────────────────────────────────────────────────────

interface TechnicianPerformanceCardProps {
  period: AnalyticsPeriod
  shopId?: string | null
}

export function TechnicianPerformanceCard({ period, shopId }: TechnicianPerformanceCardProps) {
  const query = useTechnicianAnalytics(period, shopId)
  const data = query.data ?? []
  const shares = computeShares(data)

  const [prevPeriod, setPrevPeriod] = useState(period)
  const [page, setPage] = useState(1)

  // Adjust state during rendering when period changes (avoids effect cascading render)
  if (prevPeriod !== period) {
    setPrevPeriod(period)
    setPage(1)
  }

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedData = data.slice(startIndex, endIndex)
  const paginatedShares = shares.slice(startIndex, endIndex)

  return (
    <AnalyticsCard
      title="Technician performance"
      icon={Users}
      iconContainerClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      query={query}
      isEmpty={totalItems === 0}
      emptyText="No technician activity in this period"
      skeleton={<TechnicianSkeleton />}
      className="col-span-full h-full"
    >
      {() => (
        <div className="space-y-4 flex flex-col flex-1 justify-between h-full w-full">
          <DesktopTable technicians={paginatedData} shares={paginatedShares} />
          <MobileCards technicians={paginatedData} shares={paginatedShares} />

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/70 text-xs text-muted-foreground">
              <span>
                Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems} technicians
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <span className="text-xs font-medium text-foreground px-1.5">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AnalyticsCard>
  )
}
