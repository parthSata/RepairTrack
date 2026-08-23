'use client'

import { useState } from 'react'
import { Check, Copy, Link2, LoaderCircle, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInviteStaff } from '@/features/staff/mutations'
import { inviteStaffSchema, type InviteStaffInput } from '@/features/staff/schemas'
import { cn } from '@/lib/utils'

export function AddStaffDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const inviteMutation = useInviteStaff()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteStaffInput>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'STAFF',
    },
  })

  const selectedRole = watch('role')

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        reset({ name: '', email: '', role: 'STAFF' })
        setGeneratedLink(null)
        setCopied(false)
        setErrorMsg(null)
      }, 200)
    }
  }

  const onSubmit = async (values: InviteStaffInput) => {
    setErrorMsg(null)
    try {
      const result = await inviteMutation.mutateAsync(values)
      const fullUrl = `${window.location.origin}${result.inviteLink}`
      setGeneratedLink(fullUrl)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      setErrorMsg(message || 'Failed to generate staff invitation link. Please try again.')
    }
  }

  const copyToClipboard = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Staff
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <UserPlus className="h-5 w-5 text-accent" />
            Add Team Member
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-muted-foreground">
            Invite a staff member or technician to join your shop workspace.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        {generatedLink ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Invitation Link Created
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Share this link with your team member. They can use it to set up their account and join your shop.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    value={generatedLink}
                    className="pr-10 font-mono text-xs text-foreground bg-background"
                  />
                  <Link2 className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <Button
                  type="button"
                  variant={copied ? 'default' : 'outline'}
                  onClick={copyToClipboard}
                  className="gap-2 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2" noValidate>
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name</Label>
              <Input
                id="staff-name"
                placeholder="e.g. Alex Morgan"
                autoComplete="name"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="alex@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={cn(
                    'flex cursor-pointer flex-col rounded-lg border p-3.5 transition-colors',
                    selectedRole === 'STAFF'
                      ? 'border-accent bg-accent/5 font-medium text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="STAFF"
                      {...register('role')}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold">Staff Member</span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">Full shop operations</span>
                </label>

                <label
                  className={cn(
                    'flex cursor-pointer flex-col rounded-lg border p-3.5 transition-colors',
                    selectedRole === 'TECHNICIAN'
                      ? 'border-accent bg-accent/5 font-medium text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="TECHNICIAN"
                      {...register('role')}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold">Technician</span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">Repair diagnostics</span>
                </label>
              </div>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending} className="gap-2">
                {inviteMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  )
}
