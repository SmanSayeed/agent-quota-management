import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

interface Agent {
  _id: string;
  name: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'disabled';
  creditBalance: number;
  quotaBalance: number;
}

const updateAgentSchema = z.object({
  status: z.enum(['pending', 'active', 'disabled']),
});

type UpdateAgentInputs = z.infer<typeof updateAgentSchema>;

export default function Agents() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['agents', pagination.pageIndex, pagination.pageSize, statusFilter, nameFilter, phoneFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
        name: nameFilter,
        phone: phoneFilter,
      });
      const { data } = await api.get(`/admin/agents?${params.toString()}`);
      return data;
    },
  });

  const agents = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAgentInputs>({
    resolver: zodResolver(updateAgentSchema),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAgentInputs) => {
      if (!selectedAgent) return;
      await api.put(`/admin/agents/${selectedAgent._id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    reset({
      status: agent.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };

  const onSubmit = (data: UpdateAgentInputs) => {
    updateMutation.mutate(data);
  };

  const columns = useMemo<ColumnDef<Agent>[]>(
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
        accessorKey: 'creditBalance',
        header: 'Credits',
      },
      {
        accessorKey: 'quotaBalance',
        header: 'Quota',
      },

      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Agents Management</h1>

      <Card>
        <DataTable
          columns={columns}
          data={agents}
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Edit Agent: ${selectedAgent?.name}`}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>
            {errors.status && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.status.message}</span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
