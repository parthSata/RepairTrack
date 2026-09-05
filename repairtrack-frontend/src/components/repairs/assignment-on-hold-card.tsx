'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TechnicianCombobox, type TechnicianOption } from '@/components/repairs/technician-combobox'
import { useResumeAssignments } from '@/features/staff/mutations'
import { toast } from 'sonner'

type AssignmentOnHoldCardProps = {
  assignment: {
    id: string
    technicianId: string
    technicianName: string
    technicianIsEligible: boolean
    heldReason: string | null
  }
  technicians: TechnicianOption[]
  canManage: boolean
  onReassigned: (technicianId: string) => Promise<void>
  isReassignPending: boolean
}

export function AssignmentOnHoldCard({
  assignment,
  technicians,
  canManage,
  onReassigned,
  isReassignPending,
}: AssignmentOnHoldCardProps) {
  const [reassignOpen, setReassignOpen] = React.useState(false)
  const [pickedTechId, setPickedTechId] = React.useState<string | null>(null)
  const resumeMutation = useResumeAssignments()

  const handleResume = async () => {
    if (!assignment.technicianIsEligible) return
    try {
      await resumeMutation.mutateAsync({
        id: assignment.technicianId,
        assignmentIds: [assignment.id],
      })
      toast.success(`Resumed assignment for ${assignment.technicianName}`)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
              .response?.data?.error?.message ||
            (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      toast.error(msg || 'Failed to resume assignment')
    }
  }

  return (
    <>
      <div
        className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Assignment On Hold</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {assignment.technicianName} is currently not a Technician. This assignment can be
                resumed if they become a Technician again, or reassigned to another Technician.
              </p>
              {assignment.heldReason ? (
                <p className="mt-1 text-xs text-muted-foreground">{assignment.heldReason}</p>
              ) : null}
            </div>
            {canManage && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <span className="relative inline-flex" title={
                  assignment.technicianIsEligible
                    ? undefined
                    : `${assignment.technicianName} must be an active Technician to resume`
                }>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!assignment.technicianIsEligible || resumeMutation.isPending}
                    onClick={handleResume}
                  >
                    {resumeMutation.isPending ? 'Resuming…' : 'Resume when eligible'}
                  </Button>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    setPickedTechId(null)
                    setReassignOpen(true)
                  }}
                >
                  Reassign Technician
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign technician</DialogTitle>
          <DialogDescription>
            Move this held repair to another Technician. It will not auto-return to{' '}
            {assignment.technicianName} later.
          </DialogDescription>
        </DialogHeader>
        <TechnicianCombobox
          technicians={technicians}
          value={pickedTechId}
          excludeIds={[assignment.technicianId]}
          onChange={setPickedTechId}
          aria-label="Select replacement technician"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setReassignOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={!pickedTechId || isReassignPending}
            onClick={async () => {
              if (!pickedTechId) {
                toast.error('Select a technician')
                return
              }
              try {
                await onReassigned(pickedTechId)
                setReassignOpen(false)
              } catch {
                // parent mutation toasts error
              }
            }}
          >
            {isReassignPending ? 'Reassigning…' : 'Confirm reassign'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
