'use client'

import { DebouncedSearchInput } from '@/components/ui/debounced-search-input'

interface CustomerSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomerSearchBar({
  value,
  onChange,
  placeholder = 'Search by name or phone...',
}: CustomerSearchBarProps) {
  return (
    <DebouncedSearchInput value={value} onChange={onChange} placeholder={placeholder} />
  )
}
