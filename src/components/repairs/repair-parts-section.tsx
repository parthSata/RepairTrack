'use client'

import * as React from 'react'
import { Boxes, Plus, Trash2 } from 'lucide-react'
import type { Part } from '@/features/inventory/queries'
import { useAddRepairPart, useRemoveRepairPart } from '@/features/repairs/mutations'
import type { RepairPartLine } from '@/features/repairs/queries'
import { formatRupees } from '@/lib/format-money'
import { PartCombobox } from '@/components/repairs/part-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RepairPartsSectionProps {
  repairId: string
  parts: RepairPartLine[]
  canEdit: boolean
}

export function RepairPartsSection({ repairId, parts, canEdit }: RepairPartsSectionProps) {
  const [inventoryId, setInventoryId] = React.useState<string | null>(null)
  const [quantity, setQuantity] = React.useState('1')

  const addMutation = useAddRepairPart(repairId)
  const removeMutation = useRemoveRepairPart(repairId)

  const handlePartChange = (part: Part | null) => {
    setInventoryId(part?.id ?? null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventoryId) return
    const qty = Number.parseInt(quantity, 10)
    if (!Number.isFinite(qty) || qty < 1) return

    await addMutation.mutateAsync({ inventoryId, quantity: qty })
    setInventoryId(null)
    setQuantity('1')
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Boxes className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Parts used</h3>
        </div>

        {canEdit ? (
          <form
            onSubmit={handleAdd}
            className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_6rem_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="part-combobox">Part</Label>
                <PartCombobox
                  id="part-combobox"
                  value={inventoryId}
                  onChange={handlePartChange}
                  disabled={addMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="part-qty">Qty</Label>
                <Input
                  id="part-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={addMutation.isPending}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 w-full gap-1.5 sm:w-auto"
                  disabled={addMutation.isPending || !inventoryId}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addMutation.isPending ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="space-y-2">
          {parts.length > 0 ? (
            parts.map((line) => (
              <div
                key={line.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{line.partName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{line.partSku}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {line.quantity} · {formatRupees(line.unitSellingPrice)} each
                  </p>
                </div>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${line.partName}`}
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(line.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/15 py-6 text-center text-xs italic text-muted-foreground">
              No parts recorded on this repair yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
