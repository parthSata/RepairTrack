'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type ListFilterOption = {
  value: string
  label: React.ReactNode
}

type ListFilterSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly ListFilterOption[]
  className?: string
  placeholder?: string
  'aria-label'?: string
  id?: string
  disabled?: boolean
}

/** Shared list-filter dropdown — wraps Radix Select so the chevron matches form selects. */
export function ListFilterSelect({
  value,
  onValueChange,
  options,
  className,
  placeholder,
  'aria-label': ariaLabel,
  id,
  disabled,
}: ListFilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn('bg-background shadow-xs', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
