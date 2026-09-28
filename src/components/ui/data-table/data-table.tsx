'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DataTablePagination } from './data-table-pagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortingChangeManual?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  /** When set, rows render as cards below `md` and the table shows from `md` up. */
  renderMobileCard?: (row: TData) => React.ReactNode
}

function MobileCardList<TData>({
  rows,
  isLoading,
  skeletonCount,
  emptyState,
  renderCard,
}: {
  rows: { id: string; original: TData }[]
  isLoading: boolean
  skeletonCount: number
  emptyState?: React.ReactNode
  renderCard: (row: TData) => React.ReactNode
}) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: Math.min(skeletonCount, 5) }).map((_, index) => (
          <Skeleton key={`skeleton-card-${index}`} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-10 text-center">
        {emptyState ?? <p className="text-sm text-muted-foreground">No records found.</p>}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.id}>{renderCard(row.original)}</li>
      ))}
    </ul>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyState,
  pageCount,
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSortingChangeManual,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pageIndex ?? 0,
        pageSize: pageSize ?? 10,
      },
    },
    pageCount: pageCount ?? -1,
    manualPagination: Boolean(pageCount !== undefined),
    manualSorting: Boolean(onSortingChangeManual),
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(nextSorting)
      if (onSortingChangeManual && nextSorting.length > 0) {
        const firstSort = nextSorting[0]
        if (firstSort) {
          onSortingChangeManual(firstSort.id, firstSort.desc ? 'desc' : 'asc')
        }
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      {renderMobileCard ? (
        <div className="md:hidden">
          <MobileCardList
            rows={table.getRowModel().rows}
            isLoading={isLoading}
            skeletonCount={pageSize || 5}
            emptyState={emptyState}
            renderCard={renderMobileCard}
          />
        </div>
      ) : null}
      <div
        className={cn(
          'rounded-lg border border-border bg-card shadow-xs overflow-hidden',
          renderMobileCard && 'hidden md:block',
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize || 5 }).map((_, index) => (
                <TableRow key={`skeleton-row-${index}`}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  {emptyState ?? <p className="text-sm text-muted-foreground">No records found.</p>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
