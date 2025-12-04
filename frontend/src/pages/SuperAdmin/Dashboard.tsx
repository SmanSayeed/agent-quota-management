import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Super Admin Dashboard</h1>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          Create Superadmin
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Quota Allocation Info */}
        <Card className="bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Daily Quota Allocation</h3>
              <p className="text-sm text-base-content/50 mt-1">Free quota given to all agents daily</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-success">100</span>
              <span className="text-lg text-base-content/60 font-medium">quota/day</span>
            </div>

            <div className="alert alert-info text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Resets automatically when triggered</span>
            </div>
          </div>
        </Card>

        {/* Global Settings */}

        <Card className="bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Global Settings</h3>
              <p className="text-sm text-base-content/50 mt-1">System-wide configuration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 bg-base-200/30 rounded-xl border border-base-content/5 space-y-4">
              <Input
                label="Daily Purchase Limit"
                type="number"
                error={errors.dailyPurchaseLimit?.message}
                {...register('dailyPurchaseLimit')}
                className="bg-base-100"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Credit Price (BDT)"
                  type="number"
                  step="0.01"
                  error={errors.creditPrice?.message}
                  {...register('creditPrice')}
                  className="bg-base-100"
                />

                <Input
                  label="Quota Price (Credits)"
                  type="number"
                  error={errors.quotaPrice?.message}
                  {...register('quotaPrice')}
                  className="bg-base-100"
                />
              </div>
            </div>

            <div className="alert alert-info text-xs sm:text-sm bg-info/10 text-info border-info/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>These settings affect all agents globally.</span>
            </div>

            <div className="card-actions justify-end pt-2">
              <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto btn-primary">
                Update Settings
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Create Superadmin Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md w-[95%] sm:w-full">
            <h3 className="font-bold text-lg mb-4">Create New Superadmin</h3>
            <form onSubmit={handleSubmitSuperadmin(onCreateSuperadmin)} className="space-y-3 sm:space-y-4">
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

              <div className="alert alert-warning text-xs sm:text-sm">
                <span>The new superadmin will have full system control.</span>
              </div>

              <div className="modal-action flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetSuperadmin();
                  }}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmittingSuperadmin} className="w-full sm:w-auto order-1 sm:order-2">
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
