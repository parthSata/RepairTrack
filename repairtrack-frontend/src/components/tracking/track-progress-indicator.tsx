'use client'

import {
  CheckCircle2,
  ClipboardCheck,
  Package,
  Search,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react'
import {
  getActiveProgressStageIndex,
  getPublicStatusMessage,
  isCancelledStatus,
  PUBLIC_PROGRESS_STAGES,
} from '@/features/tracking/status-labels'
import { cn } from '@/lib/utils'

const STAGE_ICONS = [Package, Search, Wrench, ClipboardCheck, Truck] as const

export function TrackProgressIndicator({ statusLabel }: { statusLabel: string }) {
  if (isCancelledStatus(statusLabel)) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">This repair was cancelled</p>
      </div>
    )
  }

  const activeIndex = getActiveProgressStageIndex(statusLabel)

  return (
    <>
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          <div
            className="absolute left-0 right-0 top-5 h-0.5 bg-border"
            aria-hidden="true"
          />
          <div
            className="absolute left-0 top-5 h-0.5 bg-accent track-progress-fill motion-safe:animate-[track-progress-fill_700ms_ease-out_forwards]"
            style={{ width: `${(activeIndex / (PUBLIC_PROGRESS_STAGES.length - 1)) * 100}%` }}
            aria-hidden="true"
          />
          {PUBLIC_PROGRESS_STAGES.map((stage, index) => {
            const Icon = STAGE_ICONS[index] ?? Package
            const isComplete = index <= activeIndex
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 motion-safe:scale-100',
                    isComplete
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    'max-w-[5.5rem] text-center text-[11px] font-medium leading-4',
                    isComplete ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {stage}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="md:hidden">
        <ol className="space-y-4">
          {PUBLIC_PROGRESS_STAGES.map((stage, index) => {
            const Icon = STAGE_ICONS[index] ?? Package
            const isComplete = index <= activeIndex
            const isCurrent = index === activeIndex
            return (
              <li key={stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200',
                      isComplete
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < PUBLIC_PROGRESS_STAGES.length - 1 ? (
                    <div
                      className={cn(
                        'mt-1 w-0.5 flex-1 min-h-6 track-progress-fill motion-safe:animate-[track-progress-fill_700ms_ease-out_forwards]',
                        isComplete ? 'bg-accent' : 'bg-border',
                      )}
                    />
                  ) : null}
                </div>
                <div className="pt-1.5">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : isComplete ? 'text-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {stage}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </>
  )
}

export function TrackStatusIcon({ statusLabel }: { statusLabel: string }) {
  if (isCancelledStatus(statusLabel)) {
    return <XCircle className="h-8 w-8 text-destructive transition-transform duration-200 motion-safe:scale-100" />
  }

  if (statusLabel === 'Delivered') {
    return <CheckCircle2 className="h-8 w-8 text-success transition-transform duration-200 motion-safe:scale-100" />
  }

  if (statusLabel === 'Ready for Pickup') {
    return <Package className="h-8 w-8 text-accent transition-transform duration-200 motion-safe:scale-100" />
  }

  return <Wrench className="h-8 w-8 text-steel transition-transform duration-200 motion-safe:scale-100" />
}

export function TrackStatusMessage({ statusLabel }: { statusLabel: string }) {
  return <p className="text-sm leading-6 text-muted-foreground">{getPublicStatusMessage(statusLabel)}</p>
}
