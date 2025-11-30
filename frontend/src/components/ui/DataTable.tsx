import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select';
  options?: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  filterConfigs?: FilterConfig[];
  filters?: React.ReactNode; // Keep for backward compatibility or custom complex filters
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  isLoading = false,
  filterConfigs,
  filters,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    debugTable: false,
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {filters && (
        <div className="bg-base-100 p-3 sm:p-4 rounded-lg shadow-sm border border-base-200">
          <div className="flex gap-2 flex-wrap items-center justify-end">{filters}</div>
        </div>
      )}

      {/* Mobile-optimized table wrapper with horizontal scroll indicators */}
      <div className="relative">
        <div className="overflow-x-auto rounded-lg shadow-sm scrollbar-thin">
          <table className="table w-full min-w-max">
            <thead className="bg-base-200/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const config = filterConfigs?.find((c) => c.id === header.id || c.id === header.column.id);
                    return (
                      <th 
                        key={header.id} 
                        className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-xs sm:text-sm uppercase tracking-wider text-base-content/70 align-top whitespace-nowrap"
                      >
                        <div className="flex flex-col gap-2">
                          <div>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </div>
                          {config && (
                            <div className="font-normal normal-case">
                              {config.type === 'select' ? (
                                <select
                                  className="select select-bordered select-xs w-full min-w-[120px] font-normal text-xs"
                                  value={config.value}
                                  onChange={(e) => config.onChange(e.target.value)}
                                >
                                  {config.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={config.placeholder || 'Filter...'}
                                  className="input input-bordered input-xs w-full min-w-[120px] font-normal text-xs"
                                  value={config.value}
                                  onChange={(e) => config.onChange(e.target.value)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-base-200/30 active:bg-base-200/50 transition-colors border-b border-base-200 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-base-content/50 text-sm">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile scroll hint */}
        <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-base-100 to-transparent pointer-events-none opacity-50"></div>
      </div>

      {/* Mobile-optimized pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-1 sm:px-2 gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-base-content/70 order-2 sm:order-1">
          Page <span className="font-medium text-base-content">{table.getState().pagination.pageIndex + 1}</span> of{' '}
          <span className="font-medium text-base-content">{table.getPageCount()}</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
          {/* Rows per page - more compact on mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-base-content/70 hidden md:inline">Rows:</span>
            <select 
              className="select select-bordered select-xs sm:select-sm w-16 sm:w-20 text-xs sm:text-sm"
              value={pagination.pageSize}
              onChange={e => {
                onPaginationChange({
                  pageIndex: 0,
                  pageSize: Number(e.target.value)
                })
              }}
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          {/* Pagination buttons - larger touch targets on mobile */}
          <div className="join">
            <button
              className="join-item btn btn-sm sm:btn-md min-h-[2.5rem] sm:min-h-[3rem]"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <span className="text-base sm:text-lg">«</span>
            </button>
            <button className="join-item btn btn-sm sm:btn-md pointer-events-none bg-base-100 min-h-[2.5rem] sm:min-h-[3rem] text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Page </span>{table.getState().pagination.pageIndex + 1}
            </button>
            <button
              className="join-item btn btn-sm sm:btn-md min-h-[2.5rem] sm:min-h-[3rem]"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <span className="text-base sm:text-lg">»</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
