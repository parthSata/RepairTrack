'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LinkedCustomer } from '@/features/devices/queries'

interface DeviceGroupHeaderProps {
  customer: LinkedCustomer | null
  deviceCount: number
  isExpanded: boolean
  onToggle: () => void
}

export function DeviceGroupHeader({
  customer,
  deviceCount,
  isExpanded,
  onToggle,
}: DeviceGroupHeaderProps) {
  const handleCustomerLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className="flex w-full items-center justify-between py-2 px-3 bg-muted/60 hover:bg-muted/80 transition-colors cursor-pointer select-none border-y border-border"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          aria-label={isExpanded ? 'Collapse customer group' : 'Expand customer group'}
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200 ease-in-out motion-reduce:transition-none',
              isExpanded && 'rotate-90',
            )}
          />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
            <User className="h-3.5 w-3.5" />
          </div>

          {customer ? (
            <Link
              href={`/customers/${customer.id}`}
              onClick={handleCustomerLinkClick}
              className="font-semibold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1"
            >
              <span>{customer.name}</span>
              {customer.phone && (
                <span className="text-xs font-normal text-muted-foreground ml-1 hidden sm:inline">
                  ({customer.phone})
                </span>
              )}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-muted-foreground italic">
              Unlinked Devices
            </span>
          )}
        </div>
      </div>

      <Badge
        variant="outline"
        className="bg-accent/10 border-accent/20 text-accent font-medium text-xs shrink-0"
      >
        {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
      </Badge>
    </div>
  )
}
