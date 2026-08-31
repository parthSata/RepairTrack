'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackVerifySchema, type TrackVerifyInput } from '@/features/tracking/schemas'

export function TrackSearchForm({
  onSubmit,
  isSubmitting,
  defaultTicketNumber,
  submitError,
}: {
  onSubmit: (values: TrackVerifyInput) => Promise<void>
  isSubmitting: boolean
  defaultTicketNumber?: string
  submitError?: boolean
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackVerifyInput>({
    resolver: zodResolver(trackVerifySchema),
    defaultValues: {
      ticketNumber: defaultTicketNumber ?? '',
      phone: '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values)
      })}
      className="space-y-5"
    >
      {submitError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>We couldn&apos;t find this repair. Check your repair number and phone, then try again.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="ticketNumber">Repair Number</Label>
        <Input
          id="ticketNumber"
          inputMode="numeric"
          autoComplete="off"
          placeholder="10-digit repair number"
          disabled={isSubmitting}
          {...register('ticketNumber', {
            onChange: (event) => {
              const cleaned = event.target.value.replace(/\D/g, '')
              if (cleaned !== event.target.value) {
                setValue('ticketNumber', cleaned, { shouldValidate: true })
              }
            },
          })}
        />
        {errors.ticketNumber ? (
          <p className="text-xs text-destructive">{errors.ticketNumber.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. 9876543210 or +919876543210"
          disabled={isSubmitting}
          {...register('phone', {
            onChange: (event) => {
              const value = event.target.value
              const cleaned = value.replace(/(?!^\+)[^\d]/g, '')
              if (cleaned !== value) {
                setValue('phone', cleaned, { shouldValidate: true })
              }
            },
          })}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Use the phone number saved with your repair.</p>
        )}
      </div>

      <Button type="submit" className="w-full transition-colors duration-200" disabled={isSubmitting}>
        {isSubmitting ? 'Checking…' : 'Track Repair'}
      </Button>
    </form>
  )
}
