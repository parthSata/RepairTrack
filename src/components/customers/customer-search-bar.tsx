'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
  const [searchTerm, setSearchTerm] = React.useState(value)
  const [prevValue, setPrevValue] = React.useState(value)

  if (prevValue !== value) {
    setPrevValue(value)
    setSearchTerm(value)
  }


  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, value, onChange])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => {
            setSearchTerm('')
            onChange('')
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
