'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const displayHour = hour % 12 || 12
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const label = `${displayHour}:${String(minute).padStart(2, '0')} ${meridiem}`
  return { value, label }
})

type ShopTimeSelectProps = {
  id: string
  value: string
  onValueChange: (value: string) => void
  'aria-label': string
}

export function ShopTimeSelect({ id, value, onValueChange, 'aria-label': ariaLabel }: ShopTimeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-label={ariaLabel} className="h-11 bg-background font-semibold">
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {TIME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
