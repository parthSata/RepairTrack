'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wrench,
  Plus,
  Search,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Flame,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRepairs, useTechnicians } from '@/features/repairs/queries'
import { useSession } from '@/lib/auth-client'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'RECEIVED':
      return 'Received'
    case 'DIAGNOSING':
      return 'Diagnosing'
    case 'WAITING_FOR_APPROVAL':
      return 'Waiting for Approval'
    case 'APPROVED':
      return 'Approved'
    case 'WAITING_FOR_PARTS':
      return 'Waiting for Parts'
    case 'IN_REPAIR':
      return 'In Repair'
    case 'QUALITY_CHECK':
      return 'Quality Check'
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status.replace(/_/g, ' ')
  }
}

function getStatusBadgeConfig(status: string): { badgeClass: string; dotClass: string } {
  switch (status) {
    case 'RECEIVED':
      return {
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        dotClass: 'bg-sky-500',
      }
    case 'DIAGNOSING':
      return {
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      }
    case 'WAITING_FOR_APPROVAL':
      return {
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
        dotClass: 'bg-amber-500',
      }
    case 'APPROVED':
      return {
        badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
        dotClass: 'bg-cyan-500',
      }
    case 'WAITING_FOR_PARTS':
      return {
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700',
        dotClass: 'bg-orange-500',
      }
    case 'IN_REPAIR':
      return {
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
      }
    case 'QUALITY_CHECK':
      return {
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
        dotClass: 'bg-teal-500',
      }
    case 'READY_FOR_PICKUP':
      return {
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      }
    case 'COMPLETED':
      return {
        badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
        dotClass: 'bg-green-500',
      }
    case 'CANCELLED':
      return {
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
      }
    default:
      return {
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      }
  }
}

function formatPriorityLabel(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'Urgent'
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return priority
  }
}

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-semibold'
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-medium'
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-medium'
    case 'LOW':
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 font-medium'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export function RepairList() {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [technicianId, setTechnicianId] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data: technicians } = useTechnicians()
  const { data, isLoading, isError, error, refetch } = useRepairs({
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    assignedTechnicianId: technicianId || undefined,
    page,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Wrench className="h-6 w-6 text-primary" />
            Repair Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === 'TECHNICIAN'
              ? 'View and manage your assigned repair service tickets.'
              : 'Track, manage, and update repair jobs across your shop.'}
          </p>
        </div>

        {['OWNER', 'STAFF'].includes(userRole) && (
          <Link href="/repairs/new">
            <Button className="gap-2 shadow-sm font-semibold">
              <Plus className="h-4 w-4" />
              New Repair Ticket
            </Button>
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Filter Tickets</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ticket #, Customer, Phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-10 text-sm rounded-lg bg-background"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:border-accent-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-foreground font-medium"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="DIAGNOSING">Diagnosing</option>
            <option value="WAITING_FOR_APPROVAL">Waiting for Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              setPage(1)
            }}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:border-accent-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-foreground font-medium"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Technician Filter (Visible to Owner & Staff) */}
          {userRole !== 'TECHNICIAN' && (
            <select
              value={technicianId}
              onChange={(e) => {
                setTechnicianId(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:border-accent-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-foreground font-medium"
            >
              <option value="">All Technicians</option>
              {technicians?.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          {(search || status || priority || technicianId) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatus('')
                setPriority('')
                setTechnicianId('')
                setPage(1)
              }}
              className="h-10 text-xs font-semibold gap-1.5 rounded-lg border-dashed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {error instanceof Error ? error.message : 'Failed to load repair tickets.'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 bg-muted/30 font-bold text-[11px] uppercase tracking-wider text-muted-foreground grid grid-cols-8 gap-4 border-b border-border">
            <div>Ticket #</div>
            <div>Customer</div>
            <div>Device</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Technician</div>
            <div>Completion</div>
            <div>Actions</div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-8 gap-4 items-center animate-pulse border-b border-border/50 last:border-0">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-6 bg-muted rounded-full w-24"></div>
              <div className="h-6 bg-muted rounded-md w-16"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded-md w-8 justify-self-end"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Wrench className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Repair Tickets Found</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            {search || status || priority || technicianId
              ? 'No tickets matched your filter criteria. Try resetting your search filters.'
              : userRole === 'TECHNICIAN'
              ? 'You currently have no assigned repair tickets.'
              : 'Get started by creating your first repair service ticket.'}
          </p>
          {['OWNER', 'STAFF'].includes(userRole) && !search && !status && !priority && (
            <div className="mt-6">
              <Link href="/repairs/new">
                <Button className="gap-2 font-semibold">
                  <Plus className="h-4 w-4" />
                  Create Repair Ticket
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Ticket #</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Device</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Priority</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Technician</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Expected Completion</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Created Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((repair) => {
                  const { badgeClass, dotClass } = getStatusBadgeConfig(repair.status)
                  const priorityClass = getPriorityBadgeClass(repair.priority)

                  return (
                    <tr
                      key={repair.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Ticket # */}
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                        <Link
                          href={`/repairs/${repair.id}`}
                          className="font-mono font-bold text-primary hover:underline text-sm inline-flex items-center gap-1"
                        >
                          #{repair.ticketNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{repair.customer.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {repair.customer.phone}
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {repair.device.brand} {repair.device.model ?? ''}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase font-medium mt-0.5">
                          {repair.device.deviceType}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass} shadow-2xs`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                          {formatStatusLabel(repair.status)}
                        </span>
                      </td>

                      {/* Priority Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs border ${priorityClass}`}
                        >
                          {repair.priority === 'URGENT' && <Flame className="h-3 w-3 text-red-600 dark:text-red-400" />}
                          {formatPriorityLabel(repair.priority)}
                        </span>
                      </td>

                      {/* Technician */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {repair.assignedTechnician ? (
                          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{repair.assignedTechnician.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground/80">Unassigned</span>
                        )}
                      </td>

                      {/* Expected Completion */}
                      <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(repair.expectedCompletionDate)}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(repair.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link href={`/repairs/${repair.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground group-hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View Repair Ticket Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="font-medium">
              Showing {items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              tickets
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 gap-1 px-2.5 font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>

              <span className="font-semibold text-foreground px-1.5">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 gap-1 px-2.5 font-medium"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
