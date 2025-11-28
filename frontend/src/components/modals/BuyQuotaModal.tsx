import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const buyQuotaSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const quotaRequestSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.enum(['bank_transfer', 'mobile_banking']),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  provider: z.string().optional(),
  phoneNumber: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  transactionDate: z.string().min(1, 'Transaction Date is required'),
});

type BuyQuotaInputs = z.infer<typeof buyQuotaSchema>;
type QuotaRequestInputs = z.infer<typeof quotaRequestSchema>;

interface BuyQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyQuotaModal({ isOpen, onClose }: BuyQuotaModalProps) {
  const queryClient = useQueryClient();
  const { user, updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const [isBuying, setIsBuying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_banking'>('mobile_banking');

  const isChild = user?.role === 'child';

  // Form for agents buying quota
  const agentForm = useForm<BuyQuotaInputs>({
    resolver: zodResolver(buyQuotaSchema),
  });

  // Form for children requesting quota
  const childForm = useForm<QuotaRequestInputs>({
    resolver: zodResolver(quotaRequestSchema),
  });

  const quotaRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/quota-request/request', { amount: data.amount });
    },
    onSuccess: () => {
      toast.success('Quota request submitted successfully to your parent agent!');
      childForm.reset();
      queryClient.invalidateQueries({ queryKey: ['quotaRequests'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to submit quota request';
      toast.error(message);
    },
  });

  const onAgentSubmit = async (data: BuyQuotaInputs) => {
    try {
      setIsBuying(true);
      await api.post('/quota/buy', data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      updateCreditBalance(meData.data.creditBalance);
      
      toast.success('Quota purchased successfully');
      agentForm.reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to purchase quota');
    } finally {
      setIsBuying(false);
    }
  };

  const onChildSubmit = (data: QuotaRequestInputs) => {
    quotaRequestMutation.mutate(data);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isChild ? 'Request Quota from Parent Agent' : 'Buy Quota'}
      className={isChild ? 'w-11/12 max-w-2xl' : ''}
    >
      <div className="space-y-4">
        {/* Agent Form - Simple Quota Purchase */}
        {!isChild && (
          <>
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

            <form onSubmit={agentForm.handleSubmit(onAgentSubmit)} className="space-y-4">
              <Input
                label="Quantity"
                type="number"
                error={agentForm.formState.errors.quantity?.message}
                {...agentForm.register('quantity')}
              />
              
              <div className="alert alert-info text-xs">
                <span>Cost: 20 Credits per Quota</span>
              </div>

              <div className="modal-action">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={agentForm.formState.isSubmitting || isBuying}>
                  Buy Quota
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Child Form - Detailed Payment Request */}
        {isChild && (
          <form onSubmit={childForm.handleSubmit(onChildSubmit)} className="space-y-4">
            <Input
              label="Quota Amount"
              type="number"
              error={childForm.formState.errors.amount?.message}
              {...childForm.register('amount')}
            />

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Payment Method</span>
              </label>
              <select
                className="select select-bordered w-full"
                {...childForm.register('paymentMethod')}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer' | 'mobile_banking')}
              >
                <option value="mobile_banking">Mobile Banking</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === 'mobile_banking' ? (
              <>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Provider</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    {...childForm.register('provider')}
                  >
                    <option value="">Select Provider</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                  {childForm.formState.errors.provider && (
                    <label className="label">
                      <span className="label-text-alt text-error">{childForm.formState.errors.provider.message}</span>
                    </label>
                  )}
                </div>

                <Input
                  label="Phone Number"
                  placeholder="01XXXXXXXXX"
                  error={childForm.formState.errors.phoneNumber?.message}
                  {...childForm.register('phoneNumber')}
                />
              </>
            ) : (
              <>
                <Input
                  label="Bank Name"
                  placeholder="e.g., Dutch-Bangla Bank"
                  error={childForm.formState.errors.bankName?.message}
                  {...childForm.register('bankName')}
                />

                <Input
                  label="Account Number"
                  error={childForm.formState.errors.accountNumber?.message}
                  {...childForm.register('accountNumber')}
                />
              </>
            )}

            <Input
              label="Transaction ID"
              error={childForm.formState.errors.transactionId?.message}
              {...childForm.register('transactionId')}
            />

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Transaction Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                {...childForm.register('transactionDate')}
              />
              {childForm.formState.errors.transactionDate && (
                <label className="label">
                  <span className="label-text-alt text-error">{childForm.formState.errors.transactionDate.message}</span>
                </label>
              )}
            </div>

            <div className="alert alert-info text-sm">
              <span>Your parent agent will review and approve your quota request after verifying the payment.</span>
            </div>

            <div className="modal-action">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={quotaRequestMutation.isPending}>
                Submit Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
