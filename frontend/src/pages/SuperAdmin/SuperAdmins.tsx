import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

interface SuperAdmin {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status: 'active' | 'disabled';
}

const createSuperAdminSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateSuperAdminSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  status: z.enum(['active', 'disabled']),
});

type CreateSuperAdminInputs = z.infer<typeof createSuperAdminSchema>;
type UpdateSuperAdminInputs = z.infer<typeof updateSuperAdminSchema>;

export default function SuperAdmins() {
  const queryClient = useQueryClient();
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchFilter, setSearchFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['super-admins', pagination.pageIndex, pagination.pageSize, searchFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: searchFilter,
      });
      const { data } = await api.get(`/admin/super-admins?${params.toString()}`);
      return data;
    },
  });

  const superAdmins = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

  // Create Form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateSuperAdminInputs>({
    resolver: zodResolver(createSuperAdminSchema),
  });

  // Edit Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
  } = useForm<UpdateSuperAdminInputs>({
    resolver: zodResolver(updateSuperAdminSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateSuperAdminInputs) => {
      await api.post('/admin/create-superadmin', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      toast.success('Super Admin created successfully');
      handleCloseCreateModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create super admin');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSuperAdminInputs) => {
      if (!selectedAdmin) return;
      // Remove password if empty
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      
      await api.put(`/admin/super-admins/${selectedAdmin._id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      toast.success('Super Admin updated successfully');
      handleCloseEditModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update super admin');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAdmin) return;
      await api.delete(`/admin/super-admins/${selectedAdmin._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      toast.success('Super Admin deleted successfully');
      handleCloseDeleteModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete super admin');
    },
  });

  // Handlers
  const handleCreate = () => {
    resetCreate();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreate();
  };

  const onCreateSubmit = (data: CreateSuperAdminInputs) => {
    createMutation.mutate(data);
  };

  const handleEdit = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    resetEdit({
      name: admin.name,
      phone: admin.phone,
      email: admin.email || '',
      status: admin.status,
      password: '', // Don't fill password
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAdmin(null);
    resetEdit();
  };

  const onEditSubmit = (data: UpdateSuperAdminInputs) => {
    updateMutation.mutate(data);
  };

  const handleDelete = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAdmin(null);
  };

  const onDeleteConfirm = () => {
    deleteMutation.mutate();
  };

  const columns = useMemo<ColumnDef<SuperAdmin>[]>(
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
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email || '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div
            className={`badge ${
              row.original.status === 'active'
                ? 'badge-success'
                : 'badge-error'
            }`}
          >
            {row.original.status}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="text-error" onClick={() => handleDelete(row.original)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Super Admins</h1>
        <Button onClick={handleCreate}>Create Super Admin</Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={superAdmins}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          filterConfigs={[
            {
              id: 'search',
              label: 'Search',
              type: 'text',
              value: searchFilter,
              onChange: (value) => {
                setSearchFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
              placeholder: 'Search by name, phone, email...',
            },
          ]}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Create New Super Admin"
      >
        <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
          <Input
            label="Name"
            error={createErrors.name?.message}
            {...registerCreate('name')}
          />
          <Input
            label="Phone"
            error={createErrors.phone?.message}
            {...registerCreate('phone')}
          />
          <Input
            label="Email"
            type="email"
            error={createErrors.email?.message}
            {...registerCreate('email')}
          />
          <Input
            label="Password"
            type="password"
            error={createErrors.password?.message}
            {...registerCreate('password')}
          />

          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={handleCloseCreateModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit Super Admin: ${selectedAdmin?.name}`}
      >
        <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
          <Input
            label="Name"
            error={editErrors.name?.message}
            {...registerEdit('name')}
          />
          <Input
            label="Phone"
            error={editErrors.phone?.message}
            {...registerEdit('phone')}
          />
          <Input
            label="Email"
            type="email"
            error={editErrors.email?.message}
            {...registerEdit('email')}
          />
          <Input
            label="New Password (Optional)"
            type="password"
            placeholder="Leave empty to keep current"
            error={editErrors.password?.message}
            {...registerEdit('password')}
          />
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              {...registerEdit('status')}
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            {editErrors.status && (
              <label className="label">
                <span className="label-text-alt text-error">{editErrors.status.message}</span>
              </label>
            )}
          </div>

          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isEditing || updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Super Admin"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>?</p>
          <p className="text-error text-sm">This action cannot be undone.</p>
          
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={handleCloseDeleteModal}>
              Cancel
            </Button>
            <Button 
              type="button" 
              className="btn-error text-white" 
              onClick={onDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
