'use client'

import * as React from 'react'
import { PauseCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TechnicianCombobox, type TechnicianOption } from '@/components/repairs/technician-combobox'
import { cn } from '@/lib/utils'
import type { StaffAssignmentItem } from '@/features/staff/schemas'

type AssignmentAction = 'HOLD' | 'REASSIGN'

type RoleChangeAssignmentsDialogProps = {
  open: boolean
  memberName: string
  assignments: StaffAssignmentItem[]
  technicians: TechnicianOption[]
  excludeTechnicianId: string
  isPending: boolean
  onCancel: () => void
  onConfirm: (payload: {
    assignmentAction: AssignmentAction
    reassignments?: { repairId: string; technicianId: string }[]
  }) => void
}

export function RoleChangeAssignmentsDialog(props: RoleChangeAssignmentsDialogProps) {
  if (!props.open) return null
  return <RoleChangeAssignmentsDialogInner key={props.excludeTechnicianId} {...props} />
}

function RoleChangeAssignmentsDialogInner({
  open,
  memberName,
  assignments,
  technicians,
  excludeTechnicianId,
  isPending,
  onCancel,
  onConfirm,
}: RoleChangeAssignmentsDialogProps) {
  const [action, setAction] = React.useState<AssignmentAction | null>(null)
  const [picks, setPicks] = React.useState<Record<string, string>>({})

  const count = assignments.length
  const allPicked =
    action === 'REASSIGN' &&
    assignments.every((a) => Boolean(picks[a.repairId])) &&
    Object.keys(picks).length >= assignments.length

  const canConfirm = action === 'HOLD' || (action === 'REASSIGN' && allPicked)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isPending && onCancel()} preventDismiss className="max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {memberName} is currently assigned to {count} active repair{count === 1 ? '' : 's'}
        </DialogTitle>
        <DialogDescription>
          How would you like to handle these assignments before changing their role?
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAction('HOLD')}
          disabled={isPending}
          className={cn(
            'rounded-xl border p-4 text-left transition-colors',
            action === 'HOLD'
              ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
              : 'border-border hover:bg-muted/50',
          )}
        >
          <PauseCircle className="mb-2 h-5 w-5 text-accent" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Hold Assignments</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep {memberName} assigned, but pause the assignments. They can be resumed if they
            become a Technician again.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAction('REASSIGN')}
          disabled={isPending}
          className={cn(
            'rounded-xl border p-4 text-left transition-colors',
            action === 'REASSIGN'
              ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
              : 'border-border hover:bg-muted/50',
          )}
        >
          <Users className="mb-2 h-5 w-5 text-accent" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Reassign Repairs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Move the active repairs to other available Technicians now.
          </p>
        </button>
      </div>

      {action === 'REASSIGN' && (
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border p-3">
          {assignments.map((item) => (
            <div key={item.repairId} className="space-y-2 rounded-lg bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">#{item.ticketNumber}</p>
                <p className="text-xs text-muted-foreground">{item.deviceLabel}</p>
              </div>
              <TechnicianCombobox
                technicians={technicians}
                value={picks[item.repairId] ?? null}
                excludeIds={[excludeTechnicianId]}
                onChange={(technicianId) => {
                  if (!technicianId) return
                  setPicks((prev) => ({ ...prev, [item.repairId]: technicianId }))
                }}
                aria-label={`Reassign ticket ${item.ticketNumber}`}
              />
            </div>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={!canConfirm || isPending}
          onClick={() => {
            if (action === 'HOLD') {
              onConfirm({ assignmentAction: 'HOLD' })
              return
            }
            if (action === 'REASSIGN') {
              onConfirm({
                assignmentAction: 'REASSIGN',
                reassignments: assignments.map((a) => ({
                  repairId: a.repairId,
                  technicianId: picks[a.repairId]!,
                })),
              })
            }
          }}
        >
          {isPending ? 'Saving…' : 'Confirm'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
