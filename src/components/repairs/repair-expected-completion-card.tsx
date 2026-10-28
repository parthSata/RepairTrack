'use client'

import { AlertTriangle, Calendar, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format-date'

type Props = {
  expectedCompletionDate: string | null
  isOverdue?: boolean
  canEdit: boolean
  isEditing: boolean
  value: string
  minDate: string
  isSaving: boolean
  onValueChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
}

function displayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not set'
  return formatDate(dateStr)
}

export function RepairExpectedCompletionCard({
  expectedCompletionDate,
  isOverdue,
  canEdit,
  isEditing,
  value,
  minDate,
  isSaving,
  onValueChange,
  onStartEdit,
  onCancelEdit,
  onSave,
}: Props) {
  const overdueBadge = isOverdue ? (
    <Badge variant="warning" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Overdue
    </Badge>
  ) : null

  return (
    <div className="flex h-fit min-w-0 flex-col gap-3 self-start rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        Expected completion
      </span>

      {canEdit ? (
        isEditing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={value}
              min={minDate}
              onChange={(e) => onValueChange(e.target.value)}
              className="h-9 flex-1 px-2 text-xs"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
                className="h-9 flex-1 px-2 text-xs sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-9 flex-1 px-2.5 text-xs sm:flex-none"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {displayDate(expectedCompletionDate)}
              </span>
              {overdueBadge}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartEdit}
              className="h-8 w-full gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:w-auto"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          <span>{displayDate(expectedCompletionDate)}</span>
          {overdueBadge}
        </div>
      )}
    </div>
  )
}
