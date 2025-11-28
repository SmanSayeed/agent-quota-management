import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const updatePoolSchema = z.object({
  dailyPurchaseLimit: z.coerce.number().min(0, 'Limit must be a positive number'),
  creditPrice: z.coerce.number().min(0.01, 'Credit price must be greater than 0'),
  quotaPrice: z.coerce.number().min(1, 'Quota price must be at least 1'),
});

type UpdatePoolInputs = z.infer<typeof updatePoolSchema>;

export default function SuperAdminDashboard() {
  const { availableQuota, setAvailableQuota } = usePoolStore();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePoolInputs>({
    resolver: zodResolver(updatePoolSchema),
  });

  useEffect(() => {
    fetchPoolData();
  }, []);

  const fetchPoolData = async () => {
    try {
      const { data } = await api.get('/admin/pool');
      setAvailableQuota(data.data.availableQuota);
      setValue('dailyPurchaseLimit', data.data.dailyPurchaseLimit);
      setValue('creditPrice', data.data.creditPrice || 1);
      setValue('quotaPrice', data.data.quotaPrice || 20);
    } catch (error) {
      console.error('Failed to fetch pool data', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: UpdatePoolInputs) => {
    try {
      await api.put('/admin/pool', formData);
      toast.success('Settings updated successfully');
      fetchPoolData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Pool Status">
          <div className="stat p-0">
            <div className="stat-title">Available Quota</div>
            <div className="stat-value text-primary">{availableQuota}</div>
            <div className="stat-desc">Global pool for all agents</div>
          </div>
        </Card>

        <Card title="Global Settings">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Daily Purchase Limit (for all agents)"
              type="number"
              error={errors.dailyPurchaseLimit?.message}
              {...register('dailyPurchaseLimit')}
            />

            <Input
              label="Credit Price (BDT per credit)"
              type="number"
              step="0.01"
              error={errors.creditPrice?.message}
              {...register('creditPrice')}
            />

            <Input
              label="Quota Price (credits per quota)"
              type="number"
              error={errors.quotaPrice?.message}
              {...register('quotaPrice')}
            />

            <div className="alert alert-info text-sm">
              <span>These settings affect all agents globally.</span>
            </div>

            <div className="card-actions justify-end">
              <Button type="submit" loading={isSubmitting}>
                Update Settings
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
