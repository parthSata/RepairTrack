'use client'

import * as React from 'react'
import { Check, User, Search, X, UserCheck } from 'lucide-react'
import { useCustomerSearch, type LinkedCustomer } from '@/features/devices/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CustomerPickerProps {
  value: string // customerId
  onChange: (customerId: string, customer?: LinkedCustomer) => void
  selectedCustomer?: LinkedCustomer | null
  error?: string
}

export function CustomerPicker({
  value,
  onChange,
  selectedCustomer: initialCustomer,
  error,
}: CustomerPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedQuery, setDebouncedQuery] = React.useState('')
  const [selected, setSelected] = React.useState<LinkedCustomer | null>(initialCustomer ?? null)
  const [isOpen, setIsOpen] = React.useState(!initialCustomer && !value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading } = useCustomerSearch(debouncedQuery)

  const handleSelect = (customer: LinkedCustomer) => {
    setSelected(customer)
    onChange(customer.id, customer)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    setSelected(null)
    onChange('', undefined)
    setIsOpen(true)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Linked Customer <span className="text-destructive">*</span>
      </label>

      {selected && !isOpen ? (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.phone} {selected.email ? `• ${selected.email}` : ''}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search customer by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
              autoFocus={isOpen && !selected}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-sm divide-y divide-border">
            {searchQuery.trim().length < 3 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Type at least 3 letters to see customer suggestions (up to 5).
              </div>
            ) : isLoading ? (
              <div className="p-3 text-center text-xs text-muted-foreground">Searching customers...</div>
            ) : data?.items && data.items.length > 0 ? (
              data.items.slice(0, 5).map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 text-left text-xs hover:bg-muted/50 transition-colors',
                    value === customer.id && 'bg-accent/10 font-medium text-accent',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{customer.name}</span>
                      <span className="ml-2 text-muted-foreground">{customer.phone}</span>
                    </div>
                  </div>
                  {value === customer.id && <Check className="h-4 w-4 text-accent shrink-0" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No customers found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
