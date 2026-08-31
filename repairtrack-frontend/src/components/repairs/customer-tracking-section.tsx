'use client'

import * as React from 'react'
import { Copy, Link2, RefreshCw, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRegenerateTrackingLink } from '@/features/repairs/mutations'
import { toast } from 'sonner'

export function CustomerTrackingSection({
  repairId,
  trackingToken,
  onRegenerated,
}: {
  repairId: string
  trackingToken: string | null
  onRegenerated: () => void
}) {
  const regenerateMutation = useRegenerateTrackingLink(repairId)
  const [copied, setCopied] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const trackingUrl = trackingToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${trackingToken}`
    : ''

  async function copyTrackingLink() {
    if (!trackingUrl) return
    await navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    toast.success('Tracking link copied')
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function shareTrackingLink() {
    if (!trackingUrl) return

    // Sprint 3: when gmail.service.ts is connected, this action can optionally trigger a
    // transactional email using the shop's connected Gmail account and tracking template.

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          url: trackingUrl,
          title: 'Repair tracking link',
          text: 'Use this link to track your repair status.',
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
      }
    }

    await copyTrackingLink()
    toast.message('Link copied — paste it into WhatsApp, SMS, or email.')
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Customer Tracking
            </h2>
            <p className="text-sm text-muted-foreground">
              Share this link so customers can view their repair status without signing in.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <p className="break-all font-mono text-xs text-foreground">
              {trackingUrl || 'Tracking link unavailable until a token is generated.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="transition-colors duration-200"
              onClick={() => void copyTrackingLink()}
              disabled={!trackingUrl}
            >
              <Copy className="h-4 w-4 mr-1.5" />
              {copied ? 'Copied' : 'Copy Link'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="transition-colors duration-200"
              onClick={() => void shareTrackingLink()}
              disabled={!trackingUrl}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Send Tracking Link
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="transition-colors duration-200"
              onClick={() => setConfirmOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Regenerate Tracking Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate tracking link?</AlertDialogTitle>
          <AlertDialogDescription>
            This immediately invalidates any previously shared tracking links for this repair.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              regenerateMutation.mutate(undefined, {
                onSuccess: () => {
                  setConfirmOpen(false)
                  toast.success('Tracking link regenerated')
                  onRegenerated()
                },
              })
            }}
          >
            Regenerate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </>
  )
}
