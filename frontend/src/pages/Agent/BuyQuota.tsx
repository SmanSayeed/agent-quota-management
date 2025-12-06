import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const buyQuotaSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type BuyQuotaInputs = z.infer<typeof buyQuotaSchema>;

export default function BuyQuota() {
  const navigate = useNavigate();
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
      // The backend now handles the logic for normal vs extra quota automatically
      const endpoint = '/quota/buy';

      await api.post(endpoint, data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      updateCreditBalance(meData.data.creditBalance);
      
      toast.success('Quota purchased successfully');
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Buy Quota</h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available to use</div>
          </div>
        </Card>

        <Card title="Credit Balance">
          <div className="stat p-0">
            <div className="stat-value text-secondary">{user?.creditBalance}</div>
          </div>
        </Card>
      </div>

      <Card title="Purchase Quota">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <Input
            label="Quantity"
            type="number"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          
          <div className="alert alert-info text-sm">
            <span>Cost: 20 Credits per Quota</span>
          </div>

          <div className="card-actions justify-end">
            <Button type="submit" loading={isSubmitting || isBuying}>
              Buy Quota
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
