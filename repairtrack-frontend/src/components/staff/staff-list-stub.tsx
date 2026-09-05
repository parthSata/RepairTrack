'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Check, Copy, Search, ShieldAlert, UserCheck, UserX, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table/data-table'
import { Input } from '@/components/ui/input'
import {
  useChangeStaffRole,
  useResumeAssignments,
  useSetStaffStatus,
  useStaffHeldAssignments,
} from '@/features/staff/mutations'
import { useStaffList } from '@/features/staff/queries'
import type { StaffAssignmentItem, UnifiedStaffMember } from '@/features/staff/schemas'
import { useTechnicians } from '@/features/repairs/queries'
import { AddStaffDialog } from './add-staff-dialog'
import { RoleChangeAssignmentsDialog } from './role-change-assignments-dialog'
import { ResumeAssignmentsDialog } from './resume-assignments-dialog'
import { apiClient } from '@/lib/api-client'

type PendingRoleChange = {
  member: UnifiedStaffMember
  newRole: 'STAFF' | 'TECHNICIAN'
  assignments: StaffAssignmentItem[]
}

type ResumeBanner = {
  memberId: string
  memberName: string
  count: number
}

function extractErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string; error?: { message?: string } } } })
      .response?.data
    return data?.error?.message || data?.message || fallback
  }
  return fallback
}

export function StaffListStub() {
  const { data: staffList = [], isLoading, isError } = useStaffList()
  const { data: technicians = [] } = useTechnicians()
  const setStatusMutation = useSetStaffStatus()
  const changeRoleMutation = useChangeStaffRole()
  const resumeMutation = useResumeAssignments()

  const [roleFilter, setRoleFilter] = React.useState<'ALL' | 'STAFF' | 'TECHNICIAN'>('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = React.useState<PendingRoleChange | null>(null)
  const [dismissedBanners, setDismissedBanners] = React.useState<Set<string>>(new Set())
  const [resumeTarget, setResumeTarget] = React.useState<ResumeBanner | null>(null)

  const heldQuery = useStaffHeldAssignments(resumeTarget?.memberId ?? null, Boolean(resumeTarget))

  const handleCopyLink = async (token?: string) => {
    if (!token) return
    const link = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedToken(token)
      toast.success('Invitation link copied to clipboard')
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleStatusToggle = async (member: UnifiedStaffMember) => {
    if (member.isInvitation) return
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await setStatusMutation.mutateAsync({ id: member.id, status: nextStatus })
      toast.success(`Staff status updated to ${nextStatus.toLowerCase()}`)
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to update staff status'))
    }
  }

  const applyRoleChange = async (
    member: UnifiedStaffMember,
    newRole: 'STAFF' | 'TECHNICIAN',
    extras?: {
      assignmentAction?: 'HOLD' | 'REASSIGN'
      reassignments?: { repairId: string; technicianId: string }[]
    },
  ) => {
    const result = await changeRoleMutation.mutateAsync({
      id: member.id,
      role: newRole,
      ...extras,
    })

    if (extras?.assignmentAction === 'HOLD') {
      toast.success(
        `Held ${result.affectedCount ?? 0} assignments and updated ${member.name} to Staff`,
      )
    } else if (extras?.assignmentAction === 'REASSIGN') {
      toast.success(
        `Reassigned ${result.affectedCount ?? 0} repairs and updated ${member.name} to Staff`,
      )
    } else if (newRole === 'TECHNICIAN') {
      toast.success(`Role updated to Technician`)
      if ((result.heldAssignmentCount ?? 0) > 0) {
        setDismissedBanners((prev) => {
          const next = new Set(prev)
          next.delete(member.id)
          return next
        })
      }
    } else {
      toast.success(`Role updated to ${newRole === 'STAFF' ? 'Staff' : newRole}`)
    }
  }

  const handleRoleChange = async (member: UnifiedStaffMember, newRole: 'STAFF' | 'TECHNICIAN') => {
    if (member.role === newRole) return

    // Demotion from Technician on a real user — check active assignments first
    if (!member.isInvitation && member.role === 'TECHNICIAN' && newRole === 'STAFF') {
      try {
        const response = await apiClient.get<{ assignments: StaffAssignmentItem[] }>(
          `staff/${member.id}/active-assignments`,
        )
        const assignments = response.data.assignments
        if (assignments.length > 0) {
          setPendingRoleChange({ member, newRole, assignments })
          return
        }
      } catch (err: unknown) {
        toast.error(extractErrorMessage(err, 'Failed to check active assignments'))
        return
      }
    }

    try {
      await applyRoleChange(member, newRole)
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to update role'))
    }
  }

  const resumeBanners: ResumeBanner[] = staffList
    .filter(
      (m) =>
        !m.isInvitation &&
        m.role === 'TECHNICIAN' &&
        m.status === 'ACTIVE' &&
        (m.heldAssignmentCount ?? 0) > 0 &&
        !dismissedBanners.has(m.id),
    )
    .map((m) => ({
      memberId: m.id,
      memberName: m.name,
      count: m.heldAssignmentCount ?? 0,
    }))

  const filteredData = React.useMemo(() => {
    return staffList.filter((member) => {
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = member.name.toLowerCase().includes(query)
        const matchesEmail = member.email.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail) return false
      }
      return true
    })
  }, [staffList, roleFilter, searchQuery])

  const columns = React.useMemo<ColumnDef<UnifiedStaffMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{member.name}</span>
                <span className="text-xs text-muted-foreground">{member.email}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const member = row.original
          return (
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member, e.target.value as 'STAFF' | 'TECHNICIAN')}
              disabled={changeRoleMutation.isPending}
              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="STAFF">Staff Member</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          if (status === 'ACTIVE') {
            return <Badge variant="success">Active</Badge>
          }
          if (status === 'INVITED') {
            return <Badge variant="warning">Invited</Badge>
          }
          if (status === 'EXPIRED') {
            return <Badge variant="secondary">Expired</Badge>
          }
          return <Badge variant="secondary">Inactive</Badge>
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              {member.isInvitation ? (
                <Button
                  variant="outline"
                  onClick={() => handleCopyLink(member.token)}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {copiedToken === member.token ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant={member.status === 'ACTIVE' ? 'outline' : 'default'}
                  onClick={() => handleStatusToggle(member)}
                  disabled={setStatusMutation.isPending}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {member.status === 'ACTIVE' ? (
                    <>
                      <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Reactivate
                    </>
                  )}
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [changeRoleMutation.isPending, setStatusMutation.isPending, copiedToken],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your shop staff and technician access permissions.
          </p>
        </div>
        <AddStaffDialog />
      </div>

      {resumeBanners.map((banner) => (
        <div
          key={banner.memberId}
          className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="text-sm text-foreground">
            <span className="font-medium">{banner.memberName}</span> is a Technician again.{' '}
            {banner.count} previously held repair assignment{banner.count === 1 ? '' : 's'} can be
            resumed.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => setResumeTarget(banner)}
            >
              Review & Resume
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Dismiss notice"
              onClick={() =>
                setDismissedBanners((prev) => new Set(prev).add(banner.memberId))
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Team ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('STAFF')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === 'STAFF'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Staff ({staffList.filter((m) => m.role === 'STAFF').length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('TECHNICIAN')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === 'TECHNICIAN'
                ? 'bg-accent text-accent-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Technicians ({staffList.filter((m) => m.role === 'TECHNICIAN').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="h-8 w-8 text-destructive mb-2" />
            <h3 className="text-base font-semibold text-foreground">Failed to load staff list</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Please refresh the page or try again later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">No team members found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Try adjusting your search query or filter.'
                  : 'Invite staff members or technicians to collaborate in your shop.'}
              </p>
            </div>
          }
        />
      )}

      <RoleChangeAssignmentsDialog
        open={Boolean(pendingRoleChange)}
        memberName={pendingRoleChange?.member.name ?? ''}
        assignments={pendingRoleChange?.assignments ?? []}
        technicians={technicians}
        excludeTechnicianId={pendingRoleChange?.member.id ?? ''}
        isPending={changeRoleMutation.isPending}
        onCancel={() => setPendingRoleChange(null)}
        onConfirm={async ({ assignmentAction, reassignments }) => {
          if (!pendingRoleChange) return
          if (assignmentAction === 'REASSIGN') {
            const missing = pendingRoleChange.assignments.some(
              (a) => !reassignments?.find((r) => r.repairId === a.repairId)?.technicianId,
            )
            if (missing) {
              toast.error('Pick a technician for every repair before confirming')
              return
            }
          }
          try {
            await applyRoleChange(pendingRoleChange.member, pendingRoleChange.newRole, {
              assignmentAction,
              reassignments,
            })
            setPendingRoleChange(null)
          } catch (err: unknown) {
            toast.error(extractErrorMessage(err, 'Failed to update role'))
          }
        }}
      />

      <ResumeAssignmentsDialog
        open={Boolean(resumeTarget)}
        onOpenChange={(open) => {
          if (!open) setResumeTarget(null)
        }}
        memberName={resumeTarget?.memberName ?? ''}
        assignments={heldQuery.data ?? []}
        isLoading={heldQuery.isLoading}
        isError={heldQuery.isError}
        isPending={resumeMutation.isPending}
        onConfirm={async (assignmentIds) => {
          if (!resumeTarget) return
          try {
            const result = await resumeMutation.mutateAsync({
              id: resumeTarget.memberId,
              assignmentIds,
            })
            toast.success(
              `Resumed ${result.resumedCount} of ${resumeTarget.count} held assignments`,
            )
            setResumeTarget(null)
          } catch (err: unknown) {
            toast.error(extractErrorMessage(err, 'Failed to resume assignments'))
          }
        }}
      />
    </div>
  )
}
