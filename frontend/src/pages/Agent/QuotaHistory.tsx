import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';

interface QuotaTransaction {
  _id: string;
  type: 'normal' | 'extraPool' | 'agentToChild' | 'liveToPool';
  quantity: number;
  creditCost: number;
  agentQuotaBefore: number;
  agentQuotaAfter: number;
  childId?: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function QuotaHistory() {
  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['quotaHistory', pagination.pageIndex, pagination.pageSize, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        type: typeFilter,
      });
      const { data } = await api.get(`/quota/history?${params.toString()}`);
      return data;
    },
  });

  const transactions = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

  const columns = useMemo<ColumnDef<QuotaTransaction>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.type;
          let label: string = type;
          let className = 'badge badge-ghost';

          if (type === 'normal') {
            label = 'Purchase (Normal)';
            className = 'badge badge-info';
          } else if (type === 'extraPool') {
            label = 'Purchase (Extra)';
            className = 'badge badge-warning';
          } else if (type === 'agentToChild') {
            label = 'Transfer to Child';
            className = 'badge badge-primary';
          } else if (type === 'liveToPool') {
            label = 'Return to Pool';
            className = 'badge badge-secondary';
          }

          return <div className={className}>{label}</div>;
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => <span className="font-bold">{row.original.quantity}</span>,
      },
      {
        accessorKey: 'creditCost',
        header: 'Cost (Credits)',
        cell: ({ row }) => row.original.creditCost > 0 ? row.original.creditCost : '-',
      },
      {
        header: 'Balance After',
        cell: ({ row }) => row.original.agentQuotaAfter,
      },
      {
        header: 'Details',
        cell: ({ row }) => {
          if (row.original.type === 'agentToChild' && row.original.childId) {
            return (
              <div className="text-xs">
                To: {row.original.childId.name} ({row.original.childId.phone})
              </div>
            );
          }
          return '-';
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quota History</h1>

      <Card>
        <DataTable
          columns={columns}
          data={transactions}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          filterConfigs={[
            {
              id: 'type',
              label: 'Type',
              type: 'select',
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
              options: [
                { label: 'All Types', value: 'all' },
                { label: 'Purchase (Normal)', value: 'normal' },
                { label: 'Purchase (Extra)', value: 'extraPool' },
                { label: 'Transfer to Child', value: 'agentToChild' },
                { label: 'Return to Pool', value: 'liveToPool' },
              ],
            },
          ]}
        />
      </Card>
    </div>
  );
}
