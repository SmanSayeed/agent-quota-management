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
    <div className="space-y-4">
      {filters && (
        <div className="mb-4 bg-base-100 p-4 rounded-lg shadow-sm border border-base-200">
          <div className="flex gap-2 flex-wrap items-center justify-end">{filters}</div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="table w-full">
          <thead className="bg-base-200/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const config = filterConfigs?.find((c) => c.id === header.id || c.id === header.column.id);
                  return (
                    <th key={header.id} className="text-left py-4 px-4 font-bold text-sm uppercase tracking-wider text-base-content/70 align-top">
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
                                className="select select-bordered select-xs w-full max-w-xs font-normal"
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
                                className="input input-bordered input-xs w-full max-w-xs font-normal"
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
                  className="hover:bg-base-200/30 transition-colors border-b border-base-200 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
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
                <td colSpan={columns.length} className="h-32 text-center text-base-content/50">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
        <div className="text-sm text-base-content/70">
          Showing page <span className="font-medium text-base-content">{table.getState().pagination.pageIndex + 1}</span> of{' '}
          <span className="font-medium text-base-content">{table.getPageCount()}</span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-sm text-base-content/70 hidden sm:inline">Rows per page:</span>
           <select 
             className="select select-bordered select-xs w-20"
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

          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              «
            </button>
            <button className="join-item btn btn-sm pointer-events-none bg-base-100">
              Page {table.getState().pagination.pageIndex + 1}
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
