import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const buyQuotaSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type BuyQuotaInputs = z.infer<typeof buyQuotaSchema>;

interface BuyQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyQuotaModal({ isOpen, onClose }: BuyQuotaModalProps) {
  const { user, updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const [isBuying, setIsBuying] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuyQuotaInputs>({
    resolver: zodResolver(buyQuotaSchema),
  });

  const onSubmit = async (data: BuyQuotaInputs) => {
    try {
      setIsBuying(true);
      const endpoint =
        user?.todayPurchased === user?.dailyPurchaseLimit
          ? '/quota/buy-extra'
          : '/quota/buy-normal';

      await api.post(endpoint, data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      updateCreditBalance(meData.data.creditBalance);
      
      toast.success('Quota purchased successfully');
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Quota">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-base-200 p-3 rounded-lg text-center">
            <div className="text-xs opacity-70">Available Quota</div>
            <div className="text-xl font-bold text-primary">{user?.quotaBalance}</div>
          </div>
          <div className="bg-base-200 p-3 rounded-lg text-center">
            <div className="text-xs opacity-70">Credit Balance</div>
            <div className="text-xl font-bold text-secondary">{user?.creditBalance}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Quantity"
            type="number"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          
          <div className="alert alert-info text-xs">
            <span>Cost: 20 Credits per Quota</span>
          </div>

          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || isBuying}>
              {user?.todayPurchased === user?.dailyPurchaseLimit
                ? 'Buy Extra Quota'
                : 'Buy Normal Quota'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
