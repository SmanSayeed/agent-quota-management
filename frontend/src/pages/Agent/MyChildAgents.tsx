import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

interface ChildAgent {
  _id: string;
  name: string;
  phone: string;
  status: 'pending' | 'active' | 'disabled';
  quotaBalance: number;
  createdAt: string;
}

export default function MyChildAgents() {
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<ChildAgent | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');

  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['myChildren', pagination.pageIndex, pagination.pageSize, statusFilter, nameFilter, phoneFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
        name: nameFilter,
        phone: phoneFilter,
      });
      const { data } = await api.get(`/auth/my-children?${params.toString()}`);
      return data;
    },
  });

  const children = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

  const transferMutation = useMutation({
    mutationFn: async ({ childId, quantity }: { childId: string; quantity: number }) => {
      await api.post('/quota/transfer-to-child', { childId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChildren'] });
      queryClient.invalidateQueries({ queryKey: ['me'] }); // Update my balance
      toast.success('Quota transferred successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to transfer quota';
      toast.error(message);
    },
  });

  const handleTransferClick = (child: ChildAgent) => {
    setSelectedChild(child);
    setTransferAmount('');
  };

  const handleCloseModal = () => {
    setSelectedChild(null);
    setTransferAmount('');
  };

  const handleTransfer = () => {
    if (!selectedChild) return;
    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    transferMutation.mutate({ childId: selectedChild._id, quantity: amount });
  };

  const columns = useMemo<ColumnDef<ChildAgent>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-bold">{row.original.name}</div>,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div
            className={`badge ${
              row.original.status === 'active'
                ? 'badge-success'
                : row.original.status === 'pending'
                ? 'badge-warning'
                : 'badge-error'
            }`}
          >
            {row.original.status}
          </div>
        ),
      },
      {
        accessorKey: 'quotaBalance',
        header: 'Quota Balance',
        cell: ({ row }) => <span className="font-mono">{row.original.quotaBalance}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleTransferClick(row.original)}
            disabled={row.original.status !== 'active'}
          >
            Transfer Quota
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Child Agents</h1>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={children}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          filterConfigs={[
            {
              id: 'name',
              label: 'Name',
              type: 'text',
              value: nameFilter,
              onChange: (value) => {
                setNameFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
            },
            {
              id: 'phone',
              label: 'Phone',
              type: 'text',
              value: phoneFilter,
              onChange: (value) => {
                setPhoneFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
            },
            {
              id: 'status',
              label: 'Status',
              type: 'select',
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
              options: [
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Pending', value: 'pending' },
                { label: 'Disabled', value: 'disabled' },
              ],
            },
          ]}
        />
      </Card>

      {/* Transfer Modal */}
      <Modal
        isOpen={!!selectedChild}
        onClose={handleCloseModal}
        title={`Transfer Quota to ${selectedChild?.name}`}
      >
        <div className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Amount to Transfer</span>
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              className="input input-bordered w-full"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              min="1"
            />
          </div>

          <div className="modal-action">
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTransfer}
              loading={transferMutation.isPending}
            >
              Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
