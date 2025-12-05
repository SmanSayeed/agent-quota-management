import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { socket } from '../../hooks/useSocket';

const updateSettingsSchema = z.object({
  dailyFreeQuota: z.coerce.number().min(0, 'Quota must be a positive number'),
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
  const [totalMarketQuota, setTotalMarketQuota] = useState(0);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    fetchStats();

    if (!socket.connected) socket.connect();
    socket.emit('join-marketplace-room');

    const handleStatsUpdated = (data: { totalQuotaAvailable: number }) => {
      setTotalMarketQuota(data.totalQuotaAvailable);
    };

    socket.on('stats-updated', handleStatsUpdated);
    return () => {
      socket.off('stats-updated', handleStatsUpdated);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/quota/stats');
      setTotalMarketQuota(data.data.totalQuota);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRecalculateConfirm = async () => {
    try {
      setRecalculating(true);
      const { data } = await api.post('/quota/stats/recalculate');
      setTotalMarketQuota(data.data.totalQuota);
      toast.success('Stats recalculated successfully');
      setShowRecalculateModal(false);
    } catch (error: any) {
      toast.error('Failed to recalculate stats');
    } finally {
      setRecalculating(false);
    }
  };

  const fetchPoolData = async () => {
    try {

      // Fetch settings for prices and limits
      const settingsResponse = await api.get('/admin/settings');
      setValue('dailyFreeQuota', settingsResponse.data.data.dailyFreeQuota || 100);
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
        {/* Total Market Quota Card */}
        <Card className="bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-base-content/80">Total Market Quota</h3>
                <p className="text-sm text-base-content/50 mt-1">Available to buy in marketplace</p>
              </div>
              <button 
                onClick={() => setShowRecalculateModal(true)}
                disabled={recalculating}
                className="btn btn-warning btn-outline btn-xs gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${recalculating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {recalculating ? 'Fixing...' : 'Recalculate'}
              </button>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{totalMarketQuota.toLocaleString()}</span>
              <span className="text-lg text-base-content/60 font-medium">quota</span>
            </div>

            <div className="alert alert-success text-xs bg-success/10 text-base-content border-success/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-medium">Live updates active</span>
            </div>
          </div>
        </Card>

        {/* Daily Quota Allocation Info */}
        <Card className="bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Daily Quota Allocation</h3>
              <p className="text-sm text-base-content/50 mt-1">Free quota given to all agents daily</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-success">{watch('dailyFreeQuota') || 100}</span>
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

        <Card className="bg-base-100 border border-base-content/5 shadow-lg md:col-span-2">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Global Settings</h3>
              <p className="text-sm text-base-content/50 mt-1">System-wide configuration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 bg-base-200/30 rounded-xl border border-base-content/5 space-y-4">
              <Input
                label="Daily Free Quota"
                type="number"
                error={errors.dailyFreeQuota?.message}
                {...register('dailyFreeQuota')}
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

      {/* Recalculate Stats Modal */}
      <ConfirmModal
        isOpen={showRecalculateModal}
        onClose={() => setShowRecalculateModal(false)}
        onConfirm={handleRecalculateConfirm}
        title="Recalculate Marketplace Stats"
        message="Are you sure you want to recalculate the total available quota? This will scan all active listings to ensure the counter is accurate."
        confirmText={recalculating ? "Recalculating..." : "Yes, Recalculate"}
        cancelText="Cancel"
      >
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>This action is safe but should only be used if you suspect the counter is incorrect.</span>
        </div>
      </ConfirmModal>
    </div>
  );
}
