'use client'

import { Mail } from 'lucide-react'
import { ConnectGmailButton } from '@/components/email/connect-gmail-button'
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onContinue}>
          {continueLabel}
        </Button>
        <ConnectGmailButton />
      </DialogFooter>
    </>
  )
}
