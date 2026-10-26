'use client'

import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PasswordConfirmFields({
  passwordRegister,
  confirmRegister,
  passwordError,
  confirmError,
  idPrefix,
  passwordLabel = 'Password',
  confirmLabel = 'Confirm Password',
}: {
  passwordRegister: UseFormRegisterReturn
  confirmRegister: UseFormRegisterReturn
  passwordError?: string
  confirmError?: string
  idPrefix: string
  passwordLabel?: string
  confirmLabel?: string
}) {
  const passwordId = `${idPrefix}-password`
  const confirmId = `${idPrefix}-confirm-password`

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={passwordId}>{passwordLabel}</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...passwordRegister}
        />
        {passwordError ? (
          <p className="text-xs text-destructive">{passwordError}</p>
        ) : null}
        <p className="text-[11px] leading-4 text-muted-foreground">
          Must be at least 8 characters with upper &amp; lowercase letters, a
          number, and a special character.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmId}>{confirmLabel}</Label>
        <Input
          id={confirmId}
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          {...confirmRegister}
        />
        {confirmError ? (
          <p className="text-xs text-destructive">{confirmError}</p>
        ) : null}
      </div>
    </>
  )
}
