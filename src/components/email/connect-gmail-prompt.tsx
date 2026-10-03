'use client'

import { Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ConnectGmailPromptProps = {
  description: string
  continueLabel: string
  onContinue: () => void
}

export function ConnectGmailPrompt({ description, continueLabel, onContinue }: ConnectGmailPromptProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
          <Mail className="h-5 w-5 text-accent" />
          Send emails from your shop&apos;s Gmail
        </DialogTitle>
        <DialogDescription className="text-sm leading-5 text-muted-foreground">{description}</DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
        <span className="text-sm text-muted-foreground">Gmail status</span>
        <Badge variant="warning">Gmail not connected</Badge>
      </div>

      <p id="connect-gmail-hint" className="mt-3 text-xs leading-5 text-muted-foreground">
        Connecting Gmail is coming soon. Shop emails will then be sent from your own address.
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onContinue}>
          {continueLabel}
        </Button>
        <Button type="button" disabled aria-describedby="connect-gmail-hint" className="gap-2">
          <Mail className="h-4 w-4" />
          Connect Gmail
        </Button>
      </DialogFooter>
    </>
  )
}
