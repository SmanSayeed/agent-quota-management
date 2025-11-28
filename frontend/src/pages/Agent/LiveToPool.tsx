import { useState, useEffect } from 'react';
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

const liveToPoolSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type LiveToPoolInputs = z.infer<typeof liveToPoolSchema>;

export default function LiveToPool() {
  const navigate = useNavigate();
  const { user, updateQuotaBalance } = useAuthStore();
  const { availableQuota } = usePoolStore();
  const [isReturning, setIsReturning] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LiveToPoolInputs>({
    resolver: zodResolver(liveToPoolSchema),
  });

  // Fetch pool data when component loads
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const { data } = await api.get('/quota/pool');
        usePoolStore.getState().setPoolData({ availableQuota: data.data.availableQuota });
      } catch (error) {
        console.error('Failed to fetch pool data', error);
      }
    };
    fetchPoolData();
  }, []);

  const onSubmit = async (data: LiveToPoolInputs) => {
    try {
      setIsReturning(true);
      
      if (data.quantity > (user?.quotaBalance || 0)) {
        toast.error('Cannot return more quota than you have');
        return;
      }

      await api.post('/quota/live-to-pool', data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      
      toast.success('Quota returned to global pool successfully');
      reset();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to return quota';
      toast.error(message);
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Return Quota to Pool</h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available to return</div>
          </div>
        </Card>

        <Card title="Global Pool">
          <div className="stat p-0">
            <div className="stat-value text-accent">{availableQuota}</div>
            <div className="stat-desc">Current pool quota</div>
          </div>
        </Card>
      </div>

      <Card title="Return Unused Quota">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <Input
            label="Quantity to Return"
            type="number"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          
          <div className="alert alert-warning text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span><strong>Important:</strong> No credit refund when returning quota to the pool. This action is irreversible.</span>
          </div>

          <div className="card-actions justify-end">
            <Button type="submit" loading={isSubmitting || isReturning}>
              Return to Pool
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
