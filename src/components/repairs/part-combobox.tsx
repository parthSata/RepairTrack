'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Package } from 'lucide-react'
import { useParts, type Part } from '@/features/inventory/queries'
import { formatRupees } from '@/lib/format-money'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const SEARCH_DEBOUNCE_MS = 200
const MIN_SEARCH_LENGTH = 1

type PartComboboxProps = {
  value: string | null
  onChange: (part: Part | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export function PartCombobox({
  value,
  onChange,
  placeholder = 'Type part name or SKU…',
  disabled,
  className,
  id,
  'aria-label': ariaLabel = 'Search parts',
}: PartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [selectedPart, setSelectedPart] = React.useState<Part | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [inputValue])

  const canSearch = debouncedSearch.length >= MIN_SEARCH_LENGTH
  const isDebouncing = inputValue.trim() !== debouncedSearch

  const { data, isFetching, isError } = useParts(
    {
      search: canSearch ? debouncedSearch : '',
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    { enabled: open && canSearch },
  )

  const parts = canSearch ? (data?.items ?? []) : []
  const showSearching = canSearch && (isDebouncing || isFetching)
  const displayPart = selectedPart && value === selectedPart.id ? selectedPart : null

  const handleSelect = (part: Part) => {
    if (part.quantity < 1) return
    setSelectedPart(part)
    onChange(part)
    setOpen(false)
    setInputValue('')
    setDebouncedSearch('')
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setInputValue('')
      setDebouncedSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(
            'inline-flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {displayPart ? (
              <>
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate text-left">
                  <span className="font-medium text-foreground">{displayPart.name}</span>
                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                    {displayPart.sku}
                  </span>
                </span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[20rem] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Type part name or SKU…"
            aria-label="Search parts by name or SKU"
          />
          <CommandList>
            {!canSearch && !isDebouncing ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least {MIN_SEARCH_LENGTH} character to search…
              </div>
            ) : null}

            {showSearching ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
            ) : null}

            {canSearch && !showSearching && isError ? (
              <div className="py-6 text-center text-sm text-destructive">Failed to load parts.</div>
            ) : null}

            {canSearch && !showSearching && !isError && parts.length === 0 ? (
              <CommandEmpty>No parts match “{debouncedSearch}”.</CommandEmpty>
            ) : null}

            {canSearch && !showSearching && !isError && parts.length > 0 ? (
              <CommandGroup heading="Parts">
                {parts.map((part) => {
                  const outOfStock = part.quantity < 1
                  return (
                    <CommandItem
                      key={part.id}
                      value={`${part.name} ${part.sku} ${part.id}`}
                      disabled={outOfStock}
                      onSelect={() => handleSelect(part)}
                      aria-label={`${part.name}, ${part.sku}, ${part.quantity} in stock`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{part.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="font-mono">{part.sku}</span>
                          <span aria-hidden>·</span>
                          <span>
                            {outOfStock ? 'Out of stock' : `${part.quantity} in stock`}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{formatRupees(part.sellingPrice)}</span>
                        </span>
                      </span>
                      {value === part.id ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
