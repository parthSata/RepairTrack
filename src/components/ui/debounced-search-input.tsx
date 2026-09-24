'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DebouncedSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function DebouncedSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
}: DebouncedSearchInputProps) {
  const [searchTerm, setSearchTerm] = React.useState(value)
  const isTypingRef = React.useRef(false)

  React.useEffect(() => {
    if (!isTypingRef.current) {
      setSearchTerm(value)
    }
    isTypingRef.current = false
  }, [value])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        isTypingRef.current = true
        onChange(searchTerm)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, value, onChange, debounceMs])

  return (
    <div className={className ?? 'relative w-full max-w-sm'}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          isTypingRef.current = true
          setSearchTerm(e.target.value)
        }}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={() => {
            isTypingRef.current = false
            setSearchTerm('')
            onChange('')
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
