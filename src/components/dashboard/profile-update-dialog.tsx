'use client'

import { useRouter } from 'next/navigation'
import { LoaderCircle, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateUser } from '@/lib/auth-client'
import { mapBetterAuthClientError } from '@/features/auth/map-auth-client-error'
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/features/auth/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProfileUpdateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  email: string
  shopName: string
  roleLabel: string
  onSaved?: (name: string) => void
}

export function ProfileUpdateDialog({
  open,
  onOpenChange,
  name,
  email,
  shopName,
  roleLabel,
  onSaved,
}: ProfileUpdateDialogProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: name.trim() || '' },
  })

  function handleOpenChange(next: boolean) {
    if (next) reset({ name: name.trim() || '' })
    onOpenChange(next)
  }

  async function onSubmit(values: UpdateProfileInput) {
    const result = await updateUser({ name: values.name })

    if (result.error) {
      toast.error(
        mapBetterAuthClientError(
          result.error,
          "We couldn't update your profile. Please try again.",
        ),
      )
      return
    }

    toast.success('Profile updated')
    onSaved?.(values.name)
    handleOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} className="max-w-md">
      <DialogHeader className="mb-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <DialogTitle className="text-xl">Your profile</DialogTitle>
        <DialogDescription>
          {roleLabel === 'Owner'
            ? `Owner of ${shopName}. Update how your name appears across the shop.`
            : `${roleLabel} at ${shopName}. Update how your name appears across the shop.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="rounded-lg border border-border bg-muted/60 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel">
            Shop
          </p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{shopName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            autoComplete="name"
            autoFocus
            disabled={isSubmitting}
            placeholder="Your name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            readOnly
            tabIndex={-1}
            className="cursor-default bg-muted text-muted-foreground"
          />
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="accent" disabled={isSubmitting} className="gap-2 min-w-28">
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
