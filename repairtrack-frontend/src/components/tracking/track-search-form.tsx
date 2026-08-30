'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackVerifySchema, type TrackVerifyInput } from '@/features/tracking/schemas'

export function TrackSearchForm({
  onSubmit,
  isSubmitting,
  defaultTicketNumber,
}: {
  onSubmit: (values: TrackVerifyInput) => void
  isSubmitting: boolean
  defaultTicketNumber?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackVerifyInput>({
    resolver: zodResolver(trackVerifySchema),
    defaultValues: {
      ticketNumber: defaultTicketNumber ?? '',
      phone: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="ticketNumber">Repair Number</Label>
        <Input
          id="ticketNumber"
          inputMode="numeric"
          autoComplete="off"
          placeholder="10-digit repair number"
          {...register('ticketNumber')}
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
          placeholder="Phone number on file"
          {...register('phone')}
        />
        {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
      </div>

      <Button type="submit" className="w-full transition-colors duration-200" disabled={isSubmitting}>
        {isSubmitting ? 'Checking…' : 'Track Repair'}
      </Button>
    </form>
  )
}
