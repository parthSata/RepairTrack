'use client'

import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

function PaginationIconButton({
  label,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('h-8 w-8 leading-none', className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </Button>
  )
}

export function DataTablePagination<TData>({
  table,
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const currentPage = pageIndex !== undefined ? pageIndex : table.getState().pagination.pageIndex
  const currentSize = pageSize !== undefined ? pageSize : table.getState().pagination.pageSize
  const totalPages = pageCount !== undefined ? pageCount : table.getPageCount()
  const totalRows = totalItems !== undefined ? totalItems : table.getFilteredRowModel().rows.length

  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  function handlePageSizeChange(value: string) {
    const newSize = Number(value)
    if (onPageSizeChange) {
      onPageSizeChange(newSize)
    } else {
      table.setPageSize(newSize)
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      <div className="flex-1 text-xs text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground">
          {totalRows > 0 ? currentPage * currentSize + 1 : 0}
        </span>{' '}
        to{' '}
        <span className="font-medium text-foreground">
          {Math.min((currentPage + 1) * currentSize, totalRows)}
        </span>{' '}
        of <span className="font-medium text-foreground">{totalRows}</span> result(s)
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-xs font-medium">Rows per page</p>
          <Select value={String(currentSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger
              aria-label="Rows per page"
              className="h-8 w-[4.5rem] bg-background px-2 text-xs shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-xs font-medium">
          Page {currentPage + 1} of {totalPages || 1}
        </div>

        <div className="flex items-center space-x-1">
          <PaginationIconButton
            label="Go to first page"
            className="hidden lg:inline-flex"
            disabled={!canGoPrevious}
            onClick={() => {
              if (onPageChange) onPageChange(0)
              else table.setPageIndex(0)
            }}
          >
            <ChevronsLeft className="size-4 shrink-0" aria-hidden />
          </PaginationIconButton>
          <PaginationIconButton
            label="Go to previous page"
            disabled={!canGoPrevious}
            onClick={() => {
              if (onPageChange) onPageChange(currentPage - 1)
              else table.previousPage()
            }}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
          </PaginationIconButton>
          <PaginationIconButton
            label="Go to next page"
            disabled={!canGoNext}
            onClick={() => {
              if (onPageChange) onPageChange(currentPage + 1)
              else table.nextPage()
            }}
          >
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </PaginationIconButton>
          <PaginationIconButton
            label="Go to last page"
            className="hidden lg:inline-flex"
            disabled={!canGoNext}
            onClick={() => {
              if (onPageChange) onPageChange(totalPages - 1)
              else table.setPageIndex(totalPages - 1)
            }}
          >
            <ChevronsRight className="size-4 shrink-0" aria-hidden />
          </PaginationIconButton>
        </div>
      </div>
    </div>
  )
}
