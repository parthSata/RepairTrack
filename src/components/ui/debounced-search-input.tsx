'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div
      className={cn(
        'flex h-10 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/10',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          isTypingRef.current = true
          setSearchTerm(e.target.value)
        }}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={() => {
            isTypingRef.current = false
            setSearchTerm('')
            onChange('')
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
