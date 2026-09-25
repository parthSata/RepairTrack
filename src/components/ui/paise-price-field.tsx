'use client'

import * as React from 'react'
import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { IndianRupee } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import {
  formatPaiseAsRupeesInput,
  parseRupeesInput,
  rupeesToPaise,
} from '@/lib/money'
import { cn } from '@/lib/utils'

interface PaisePriceFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>
  label: string
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
  disabled?: boolean
  required?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function PaisePriceField<TFieldValues extends FieldValues>({
  name,
  label,
  control,
  errors,
  disabled,
  required = true,
  placeholder = '0',
  className,
  id,
}: PaisePriceFieldProps<TFieldValues>) {
  const error = errors[name]
  const inputId = id ?? name

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium">
        <IndianRupee className="h-4 w-4 text-muted-foreground" />
        {label} {required && <span className="font-bold text-destructive">*</span>}
      </Label>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          aria-hidden="true"
        >
          ₹
        </span>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'pl-7',
                error ? 'border-destructive focus-visible:ring-destructive' : '',
              )}
              value={formatPaiseAsRupeesInput(field.value) || ''}
              onChange={(e) => {
                const rupees = parseRupeesInput(e.target.value)
                if (rupees == null) {
                  field.onChange(e.target.value === '' ? 0 : Number.NaN)
                  return
                }
                field.onChange(rupeesToPaise(rupees))
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>
      <FieldError message={error?.message as string | undefined} />
    </div>
  )
}
