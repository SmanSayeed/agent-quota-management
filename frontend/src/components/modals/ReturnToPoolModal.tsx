import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const returnToPoolSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type ReturnToPoolInputs = z.infer<typeof returnToPoolSchema>;

interface ReturnToPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnToPoolModal({ isOpen, onClose }: ReturnToPoolModalProps) {
  const { user, updateQuotaBalance } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReturnToPoolInputs>({
    resolver: zodResolver(returnToPoolSchema),
  });

  const onSubmit = async (data: ReturnToPoolInputs) => {
    try {
      if (data.quantity > (user?.quotaBalance || 0)) {
        toast.error('Cannot return more quota than you have');
        return;
      }

      await api.post('/quota/live-to-pool', data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      
      toast.success('Quota returned to global pool successfully');
      reset();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to return quota';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Return Quota to Pool</h3>
        
        <div className="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm"><strong>Important:</strong> No credit refund. This action is irreversible.</span>
        </div>

        <div className="mb-4 p-3 bg-base-200 rounded-lg">
          <div className="text-sm opacity-70">Your Quota Balance</div>
          <div className="text-2xl font-bold text-primary">{user?.quotaBalance}</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Quantity to Return"
            type="number"
            placeholder="Enter quantity"
            error={errors.quantity?.message}
            {...register('quantity')}
          />

          <div className="modal-action">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Return to Pool
            </Button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
