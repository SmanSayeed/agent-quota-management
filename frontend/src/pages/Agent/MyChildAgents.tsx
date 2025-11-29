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

const transferQuotaSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type TransferQuotaInputs = z.infer<typeof transferQuotaSchema>;

export default function MyChildAgents() {
  const queryClient = useQueryClient();
  const { user, updateQuotaBalance } = useAuthStore();
  const [transferTarget, setTransferTarget] = useState<ChildAgent | null>(null);

  const { data: children, isLoading } = useQuery({
    queryKey: ['myChildren'],
    queryFn: async () => {
      const { data } = await api.get('/auth/my-children'); 
      return data.data as ChildAgent[];
    },
    retry: false,
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
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    reset: resetTransfer,
    formState: { errors: errorsTransfer, isSubmitting: isSubmittingTransfer },
  } = useForm<TransferQuotaInputs>({
    resolver: zodResolver(transferQuotaSchema),
  });

  const onTransferSubmit = (data: TransferQuotaInputs) => {
    if (transferTarget) {
      transferMutation.mutate({ childId: transferTarget._id, quantity: data.quantity });
    }
  };

  const copyParentId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      toast.success('Parent ID copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">My Child Agents</h1>
        
        <div className="bg-base-200 p-4 rounded-lg flex flex-col gap-2 w-full md:w-auto">
          <span className="text-sm font-semibold text-gray-500">Your Parent Agent ID</span>
          <div className="flex items-center gap-2">
            <code className="bg-base-100 px-3 py-2 rounded border border-base-300 font-mono text-lg">
              {user?._id}
            </code>
            <Button size="sm" variant="ghost" onClick={copyParentId}>
              Copy
            </Button>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Share this ID with your child agents. They need to enter it during registration.
          </p>
        </div>
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
