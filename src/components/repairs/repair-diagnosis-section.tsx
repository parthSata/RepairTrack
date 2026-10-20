'use client'

import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  diagnosis: string | null
  canEdit: boolean
  isEditing: boolean
  draft: string
  isSaving: boolean
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function RepairDiagnosisSection({
  diagnosis,
  canEdit,
  isEditing,
  draft,
  isSaving,
  onDraftChange,
  onStartEdit,
  onCancel,
  onSave,
}: Props) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-steel" aria-hidden />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Technical diagnosis
            </h3>
          </div>

          {canEdit && !isEditing ? (
            <Button variant="outline" size="sm" onClick={onStartEdit} className="h-8 text-xs">
              Edit
            </Button>
          ) : null}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Enter technician diagnosis, findings, or required fixes..."
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              rows={4}
              className="rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSaving} className="h-8 text-xs">
                {isSaving ? 'Saving...' : 'Save Diagnosis'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-border/70 bg-muted/15 p-4 text-sm leading-relaxed text-foreground">
            {diagnosis ? (
              diagnosis
            ) : (
              <span className="italic text-muted-foreground">
                No technician diagnosis recorded yet.
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
