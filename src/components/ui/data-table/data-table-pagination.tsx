import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
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

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
      <div className="flex-1 text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{totalRows > 0 ? currentPage * currentSize + 1 : 0}</span> to{' '}
        <span className="font-medium text-foreground">{Math.min((currentPage + 1) * currentSize, totalRows)}</span> of{' '}
        <span className="font-medium text-foreground">{totalRows}</span> result(s)
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-xs font-medium">Rows per page</p>
          <select
            value={currentSize}
            onChange={(e) => {
              const newSize = Number(e.target.value)
              if (onPageSizeChange) {
                onPageSizeChange(newSize)
              } else {
                table.setPageSize(newSize)
              }
            }}
            className="h-8 w-[70px] rounded-md border border-border bg-background px-2 text-xs font-medium focus:outline-none"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-xs font-medium">
          Page {currentPage + 1} of {totalPages || 1}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => {
              if (onPageChange) onPageChange(0)
              else table.setPageIndex(0)
            }}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (onPageChange) onPageChange(currentPage - 1)
              else table.previousPage()
            }}
            disabled={!canGoPrevious}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              if (onPageChange) onPageChange(currentPage + 1)
              else table.nextPage()
            }}
            disabled={!canGoNext}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => {
              if (onPageChange) onPageChange(totalPages - 1)
              else table.setPageIndex(totalPages - 1)
            }}
            disabled={!canGoNext}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
