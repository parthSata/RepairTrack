'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Check, Copy, Search, ShieldAlert, UserCheck, UserX, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table/data-table'
import { Input } from '@/components/ui/input'
import { useChangeStaffRole, useSetStaffStatus } from '@/features/staff/mutations'
import { useStaffList } from '@/features/staff/queries'
import type { UnifiedStaffMember } from '@/features/staff/schemas'
import { AddStaffDialog } from './add-staff-dialog'

export function StaffListStub() {
  const { data: staffList = [], isLoading, isError } = useStaffList()
  const setStatusMutation = useSetStaffStatus()
  const changeRoleMutation = useChangeStaffRole()

  const [roleFilter, setRoleFilter] = React.useState<'ALL' | 'STAFF' | 'TECHNICIAN'>('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)

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
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      toast.error(msg || 'Failed to update staff status')
    }
  }

  const handleRoleChange = async (member: UnifiedStaffMember, newRole: 'STAFF' | 'TECHNICIAN') => {
    if (member.role === newRole) return
    try {
      await changeRoleMutation.mutateAsync({ id: member.id, role: newRole })
      toast.success(`Role updated to ${newRole}`)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      toast.error(msg || 'Failed to update role')
    }
  }

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
    [changeRoleMutation.isPending, setStatusMutation.isPending, copiedToken, handleRoleChange, handleStatusToggle],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">Manage your shop staff and technician access permissions.</p>
        </div>
        <AddStaffDialog />
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">Please refresh the page or try again later.</p>
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
    </div>
  )
}
