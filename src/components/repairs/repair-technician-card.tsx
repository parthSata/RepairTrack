'use client'

import { User, UserCheck } from 'lucide-react'
import { AssignmentOnHoldCard } from '@/components/repairs/assignment-on-hold-card'
import { TechnicianCombobox } from '@/components/repairs/technician-combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Repair, TechnicianUser } from '@/features/repairs/queries'

type Props = {
  repair: Pick<Repair, 'assignedTechnicianId' | 'assignedTechnician' | 'currentAssignment'>
  technicians: TechnicianUser[]
  canReassign: boolean
  selectedTechId: string
  isReassignPending: boolean
  onSelectedTechChange: (id: string) => void
  onSave: () => void
  onHoldReassign: (technicianId: string) => Promise<void>
}

export function RepairTechnicianCard({
  repair,
  technicians,
  canReassign,
  selectedTechId,
  isReassignPending,
  onSelectedTechChange,
  onSave,
  onHoldReassign,
}: Props) {
  const isOnHold = repair.currentAssignment?.status === 'ON_HOLD'

  return (
    <div className="flex h-fit min-w-0 flex-col gap-3 self-start rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <UserCheck className="h-3.5 w-3.5" />
        Assigned technician
      </span>

      {isOnHold && repair.currentAssignment ? (
        <div className="space-y-2">
          <Badge variant="warning">Assignment On Hold</Badge>
          <AssignmentOnHoldCard
            assignment={repair.currentAssignment}
            technicians={technicians}
            canManage={canReassign}
            isReassignPending={isReassignPending}
            onReassigned={onHoldReassign}
          />
        </div>
      ) : null}

      {canReassign && !isOnHold ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:flex-1">
            <TechnicianCombobox
              technicians={technicians}
              value={selectedTechId || null}
              allowUnassigned
              onChange={(id) => onSelectedTechChange(id ?? '')}
              aria-label="Assign technician"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSave}
            disabled={
              isReassignPending ||
              (selectedTechId || null) === (repair.assignedTechnicianId || null)
            }
            className="h-9 w-full px-3 text-xs sm:w-auto"
          >
            {isReassignPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      ) : (
        <div className="text-sm font-medium text-foreground">
          {repair.assignedTechnician ? (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              {repair.assignedTechnician.name}
            </span>
          ) : (
            <span className="text-xs italic text-muted-foreground">Unassigned</span>
          )}
        </div>
      )}
    </div>
  )
}
