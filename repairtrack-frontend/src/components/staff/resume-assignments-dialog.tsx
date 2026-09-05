'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StaffAssignmentItem } from '@/features/staff/schemas'

type ResumeAssignmentsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName: string
  assignments: StaffAssignmentItem[]
  isLoading: boolean
  isError?: boolean
  isPending: boolean
  onConfirm: (assignmentIds: string[]) => void
}

export function ResumeAssignmentsDialog(props: ResumeAssignmentsDialogProps) {
  if (!props.open) return null
  return (
    <ResumeAssignmentsDialogInner
      key={props.assignments.map((a) => a.assignmentId).join(',') || 'empty'}
      {...props}
    />
  )
}

function ResumeAssignmentsDialogInner({
  open,
  onOpenChange,
  memberName,
  assignments,
  isLoading,
  isError,
  isPending,
  onConfirm,
}: ResumeAssignmentsDialogProps) {
  const [selected, setSelected] = React.useState(
    () => new Set(assignments.map((a) => a.assignmentId)),
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Resume held assignments</DialogTitle>
        <DialogDescription>
          Select which of {memberName}&apos;s previously held repairs to resume. Unselected rows stay
          on hold until reviewed again.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading held assignments…</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-destructive">Failed to load held assignments.</p>
        ) : assignments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No held assignments to resume.</p>
        ) : (
          assignments.map((item) => {
            const checked = selected.has(item.assignmentId)
            return (
              <label
                key={item.assignmentId}
                className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  checked={checked}
                  onChange={() => toggle(item.assignmentId)}
                  disabled={isPending}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    #{item.ticketNumber} · {item.deviceLabel}
                  </span>
                  {item.heldReason ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.heldReason}</span>
                  ) : null}
                  {item.heldAt ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Held {new Date(item.heldAt).toLocaleString()}
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={selected.size === 0 || isPending || isLoading || assignments.length === 0}
          onClick={() => onConfirm([...selected])}
        >
          {isPending ? 'Resuming…' : `Resume ${selected.size} selected`}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
