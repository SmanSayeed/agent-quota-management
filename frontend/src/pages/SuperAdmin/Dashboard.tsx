import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LivePoolQuota from '../../components/ui/LivePoolQuota';
import toast from 'react-hot-toast';

const updateSettingsSchema = z.object({
  dailyPurchaseLimit: z.coerce.number().min(0, 'Limit must be a positive number'),
  creditPrice: z.coerce.number().min(0.01, 'Credit price must be greater than 0'),
  quotaPrice: z.coerce.number().min(1, 'Quota price must be at least 1'),
});

const createSuperadminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(11, 'Phone must be at least 11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type UpdateSettingsInputs = z.infer<typeof updateSettingsSchema>;
type CreateSuperadminInputs = z.infer<typeof createSuperadminSchema>;

export default function SuperAdminDashboard() {
  const { setAvailableQuota } = usePoolStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSettingsInputs>({
    resolver: zodResolver(updateSettingsSchema),
  });

  const {
    register: registerSuperadmin,
    handleSubmit: handleSubmitSuperadmin,
    reset: resetSuperadmin,
    formState: { errors: superadminErrors, isSubmitting: isSubmittingSuperadmin },
  } = useForm<CreateSuperadminInputs>({
    resolver: zodResolver(createSuperadminSchema),
  });

  useEffect(() => {
    fetchPoolData();
  }, []);

  const fetchPoolData = async () => {
    try {
      // Fetch pool for quota
      const poolResponse = await api.get('/quota/pool');
      setAvailableQuota(poolResponse.data.data.availableQuota);
      
      // Fetch settings for prices and limits
      const settingsResponse = await api.get('/admin/settings');
      setValue('dailyPurchaseLimit', settingsResponse.data.data.dailyPurchaseLimit);
      setValue('creditPrice', settingsResponse.data.data.creditPrice || 1);
      setValue('quotaPrice', settingsResponse.data.data.quotaPrice || 20);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: UpdateSettingsInputs) => {
    try {
      await api.put('/admin/settings', formData);
      toast.success('Settings updated successfully');
      fetchPoolData();
    } catch (error) {
      console.error(error);
    }
  };

  const onCreateSuperadmin = async (formData: CreateSuperadminInputs) => {
    try {
      await api.post('/admin/create-superadmin', formData);
      toast.success('Superadmin created successfully');
      setShowCreateModal(false);
      resetSuperadmin();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create superadmin';
      toast.error(message);
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Superadmin
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Live Pool Status">
          <div className="flex items-center justify-center p-6">
            <LivePoolQuota showLabel={false} />
          </div>
          <div className="text-center mt-2">
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

      {/* Create Superadmin Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Superadmin</h3>
            <form onSubmit={handleSubmitSuperadmin(onCreateSuperadmin)} className="space-y-4">
              <Input
                label="Name"
                error={superadminErrors.name?.message}
                {...registerSuperadmin('name')}
              />
              <Input
                label="Phone"
                error={superadminErrors.phone?.message}
                {...registerSuperadmin('phone')}
              />
              <Input
                label="Password"
                type="password"
                error={superadminErrors.password?.message}
                {...registerSuperadmin('password')}
              />

              <div className="alert alert-warning text-sm">
                <span>The new superadmin will have full system control.</span>
              </div>

              <div className="modal-action">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetSuperadmin();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmittingSuperadmin}>
                  Create Superadmin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
