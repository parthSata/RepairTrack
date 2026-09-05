'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

export type TechnicianOption = {
  id: string
  name: string
  email?: string
  activeRepairCount?: number
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

type TechnicianComboboxProps = {
  technicians: TechnicianOption[]
  value: string | null | undefined
  onChange: (technicianId: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowUnassigned?: boolean
  excludeIds?: string[]
  className?: string
  id?: string
  'aria-label'?: string
}

export function TechnicianCombobox({
  technicians,
  value,
  onChange,
  placeholder = 'Select technician…',
  disabled,
  allowUnassigned = false,
  excludeIds = [],
  className,
  id,
  'aria-label': ariaLabel = 'Assign technician',
}: TechnicianComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const filtered = technicians.filter((t) => !excludeIds.includes(t.id))
  const available = filtered.filter((t) => (t.activeRepairCount ?? 0) === 0)
  const busy = filtered.filter((t) => (t.activeRepairCount ?? 0) > 0)
  const selected = filtered.find((t) => t.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            {selected ? (
              <>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent"
                  aria-hidden
                >
                  {initials(selected.name)}
                </span>
                <span className="truncate text-foreground">{selected.name}</span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search technicians…" aria-label="Search technicians" />
          <CommandList>
            <CommandEmpty>No technicians found.</CommandEmpty>
            {allowUnassigned && (
              <CommandGroup heading="Clear">
                <CommandItem
                  value="__unassigned__"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <span className="text-muted-foreground">Unassigned</span>
                  {!value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              </CommandGroup>
            )}
            {available.length > 0 && (
              <CommandGroup heading="Available">
                {available.map((tech) => (
                  <TechnicianRow
                    key={tech.id}
                    tech={tech}
                    selected={value === tech.id}
                    onSelect={() => {
                      onChange(tech.id)
                      setOpen(false)
                    }}
                  />
                ))}
              </CommandGroup>
            )}
            {busy.length > 0 && (
              <CommandGroup heading="Assigned elsewhere">
                {busy.map((tech) => (
                  <TechnicianRow
                    key={tech.id}
                    tech={tech}
                    selected={value === tech.id}
                    onSelect={() => {
                      onChange(tech.id)
                      setOpen(false)
                    }}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function TechnicianRow({
  tech,
  selected,
  onSelect,
}: {
  tech: TechnicianOption
  selected: boolean
  onSelect: () => void
}) {
  const count = tech.activeRepairCount ?? 0
  return (
    <CommandItem
      value={`${tech.name} ${tech.email ?? ''} ${tech.id}`}
      onSelect={onSelect}
      aria-label={`${tech.name}${count === 0 ? ', available' : `, ${count} active repairs`}`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent"
        aria-hidden
      >
        {initials(tech.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{tech.name}</span>
        {tech.email ? <span className="block truncate text-xs text-muted-foreground">{tech.email}</span> : null}
      </span>
      <Badge variant={count === 0 ? 'success' : 'secondary'} className="shrink-0">
        {count === 0 ? 'Available' : `${count} active`}
      </Badge>
      {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
    </CommandItem>
  )
}
