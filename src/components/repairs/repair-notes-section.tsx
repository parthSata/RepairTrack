'use client'

import type { FormEvent } from 'react'
import { MessageSquare, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { RepairNote } from '@/features/repairs/queries'
import { formatDateTime } from '@/lib/format-date'

type Props = {
  notes: RepairNote[]
  canEdit: boolean
  draft: string
  isAdding: boolean
  onDraftChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function RepairNotesSection({
  notes,
  canEdit,
  draft,
  isAdding,
  onDraftChange,
  onSubmit,
}: Props) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Repair notes</h3>
        </div>

        {canEdit ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <Textarea
              placeholder="Add a new repair note..."
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              rows={2}
              className="rounded-xl text-sm"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || !draft.trim()}
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {isAdding ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="space-y-2.5">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="space-y-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-3 transition-colors duration-200 hover:bg-muted/20"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {note.author.name}
                    {note.author.role ? (
                      <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {note.author.role}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="pl-5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {note.note}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/15 py-6 text-center text-xs italic text-muted-foreground">
              No repair notes recorded.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
