'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MapPin, Phone, User, FileText, AlertCircle } from 'lucide-react'
import { customerSchema, type CustomerFormInput } from '@/features/customers/schemas'
import { useCreateCustomer, useUpdateCustomer } from '@/features/customers/mutations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'

interface CustomerFormProps {
  mode: 'create' | 'edit'
  customerId?: string
  initialData?: Partial<CustomerFormInput>
  onSuccess: () => void
  onCancel?: () => void
}

export function CustomerForm({
  mode,
  customerId,
  initialData,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()

  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: initialData?.name ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      address: initialData?.address ?? '',
      notes: initialData?.notes ?? '',
    },
  })

  const onSubmit = async (values: CustomerFormInput) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(values)
        toast.success('Customer created successfully')
      } else {
        if (!customerId) return
        await updateMutation.mutateAsync({ id: customerId, data: values })
        toast.success('Customer updated successfully')
      }
      onSuccess()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data?.error?.message
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as Error).message || 'An error occurred while saving the customer'

      toast.error(message, {
        duration: 5000,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
      {/* Full Name (Required) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            Full Name <span className="text-destructive font-bold">*</span>
          </Label>
          <span className="text-[11px] font-medium text-destructive">Required</span>
        </div>
        <Input
          id="name"
          placeholder="e.g. John Doe"
          disabled={isPending}
          className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Phone Number (Required - Digits only) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number <span className="text-destructive font-bold">*</span>
          </Label>
          <span className="text-[11px] font-medium text-destructive">Required (Digits Only)</span>
        </div>
        <Input
          id="phone"
          type="tel"
          placeholder="e.g. +919876543210 or 9876543210"
          disabled={isPending}
          className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('phone', {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              // Automatically strip out non-digit characters except leading +
              const val = e.target.value
              const cleaned = val.replace(/(?!^\+)[^\d]/g, '')
              if (cleaned !== val) {
                setValue('phone', cleaned, { shouldValidate: true })
              }
            },
          })}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.phone.message}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Digits only. Example: 9876543210 or +919876543210</p>
        )}
      </div>

      {/* Email Address (Optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Address
          </Label>
          <span className="text-[11px] text-muted-foreground">Optional</span>
        </div>
        <Input
          id="email"
          type="email"
          placeholder="e.g. john@example.com"
          disabled={isPending}
          className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Street Address (Optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Street Address
          </Label>
          <span className="text-[11px] text-muted-foreground">Optional</span>
        </div>
        <Textarea
          id="address"
          placeholder="e.g. 123 Main St, Suite 4B"
          rows={2}
          disabled={isPending}
          className={errors.address ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('address')}
        />
        {errors.address && (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Internal Notes (Optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Internal Notes
          </Label>
          <span className="text-[11px] text-muted-foreground">Optional</span>
        </div>
        <Textarea
          id="notes"
          placeholder="Internal notes for shop staff..."
          rows={3}
          disabled={isPending}
          className={errors.notes ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
            ? 'Add Customer'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
