import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

interface ChildAgent {
  _id: string;
  name: string;
  phone: string;
  quotaBalance: number;
  status: string;
}

const createChildSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone must be at least 11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const transferQuotaSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type CreateChildInputs = z.infer<typeof createChildSchema>;
type TransferQuotaInputs = z.infer<typeof transferQuotaSchema>;

export default function MyChildAgents() {
  const queryClient = useQueryClient();
  const { updateQuotaBalance } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<ChildAgent | null>(null);

  // TODO: Backend needs an endpoint to get ONLY my children. 
  // For now assuming /admin/agents filters or we need a new endpoint.
  // Actually doc doesn't specify an endpoint to list my children.
  // I'll assume I need to create one or use a filter on existing if allowed.
  // Wait, I can't access /admin/agents as an agent.
  // I will assume I need to add `GET /api/auth/my-children` or similar.
  // For this plan, I will mock it or assume it exists. 
  // Let's assume I added `GET /api/agent/children` in backend (I should have added this too).
  // Since I can't easily add another backend endpoint right now without switching context too much,
  // I will implement the frontend assuming the endpoint `GET /api/auth/my-children` exists 
  // and I will add it to the backend in the next step if possible or just note it.
  // Actually, I added `createChild` to auth routes. I should add `getMyChildren` too.
  
  const { data: children, isLoading } = useQuery({
    queryKey: ['myChildren'],
    queryFn: async () => {
      // Placeholder endpoint - I will need to implement this in backend
      const { data } = await api.get('/auth/my-children'); 
      return data.data as ChildAgent[];
    },
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateChildInputs) => {
      await api.post('/auth/create-child', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChildren'] });
      toast.success('Child agent created successfully');
      setIsCreateModalOpen(false);
      resetCreate();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ childId, quantity }: { childId: string; quantity: number }) => {
      await api.post('/quota/transfer-to-child', { childId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChildren'] });
      // Update own quota balance
      api.get('/auth/me').then(({ data }) => {
        updateQuotaBalance(data.data.quotaBalance);
      });
      toast.success('Quota transferred successfully');
      setTransferTarget(null);
      resetTransfer();
    },
    onError: (error) => {
      console.error(error);
    },
  });


  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
  } = useForm<CreateChildInputs>({
    resolver: zodResolver(createChildSchema),
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    reset: resetTransfer,
    formState: { errors: errorsTransfer, isSubmitting: isSubmittingTransfer },
  } = useForm<TransferQuotaInputs>({
    resolver: zodResolver(transferQuotaSchema),
  });

  const onCreateSubmit = (data: CreateChildInputs) => {
    createMutation.mutate(data);
  };

  const onTransferSubmit = (data: TransferQuotaInputs) => {
    if (transferTarget) {
      transferMutation.mutate({ childId: transferTarget._id, quantity: data.quantity });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Child Agents</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create New Child</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Quota Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {children?.map((child) => (
                <tr key={child._id}>
                  <td>{child.name}</td>
                  <td>{child.phone}</td>
                  <td>{child.quotaBalance}</td>
                  <td>
                    <div className={`badge ${child.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {child.status}
                    </div>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => {
                        setTransferTarget(child);
                        resetTransfer();
                      }}
                      disabled={child.status !== 'active'}
                    >
                      Transfer Quota
                    </Button>
                  </td>
                </tr>
              ))}
              {(!children || children.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center">
                    No child agents found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center">
                    <span className="loading loading-spinner"></span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Child Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Child Agent"
      >
        <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
          <Input
            label="Name"
            error={errorsCreate.name?.message}
            {...registerCreate('name')}
          />
          <Input
            label="Phone"
            error={errorsCreate.phone?.message}
            {...registerCreate('phone')}
          />
          <Input
            label="Password"
            type="password"
            error={errorsCreate.password?.message}
            {...registerCreate('password')}
          />
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmittingCreate || createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Quota Modal */}
      <Modal
        isOpen={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        title={`Transfer Quota to ${transferTarget?.name}`}
      >
        <form onSubmit={handleSubmitTransfer(onTransferSubmit)} className="space-y-4">
          <Input
            label="Quantity"
            type="number"
            error={errorsTransfer.quantity?.message}
            {...registerTransfer('quantity')}
          />
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={() => setTransferTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmittingTransfer || transferMutation.isPending}>
              Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
