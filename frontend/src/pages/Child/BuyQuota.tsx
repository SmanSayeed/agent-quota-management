import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const quotaRequestSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1'),
  paymentMethod: z.enum(['bank_transfer', 'mobile_banking']),
  // Bank Transfer fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  // Mobile Banking fields
  provider: z.string().optional(),
  phoneNumber: z.string().optional(),
  // Common fields
  transactionId: z.string().min(1, 'Transaction ID is required'),
  transactionDate: z.string().min(1, 'Transaction Date is required'),
});

type QuotaRequestInputs = z.infer<typeof quotaRequestSchema>;

export default function BuyQuota() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_banking'>('mobile_banking');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuotaRequestInputs>({
    resolver: zodResolver(quotaRequestSchema),
  });

  const quotaRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/quota-request/request', { amount: data.amount });
    },
    onSuccess: () => {
      toast.success('Quota request submitted successfully to your parent agent!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['quotaRequests'] });
      navigate('/child/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to submit quota request';
      toast.error(message);
    },
  });

  const onSubmit = (data: QuotaRequestInputs) => {
    const paymentDetails: any = {
      transactionId: data.transactionId,
      transactionDate: data.transactionDate,
    };

    if (data.paymentMethod === 'bank_transfer') {
      paymentDetails.bankName = data.bankName;
      paymentDetails.accountNumber = data.accountNumber;
    } else {
      paymentDetails.provider = data.provider;
      paymentDetails.phoneNumber = data.phoneNumber;
    }

    const requestData = {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDetails,
    };

    quotaRequestMutation.mutate(requestData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Request Quota from Parent Agent</h1>
        <Button variant="ghost" onClick={() => navigate('/child/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <Card title="Payment Details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          <Input
            label="Quota Amount"
            type="number"
            error={errors.amount?.message}
            {...register('amount')}
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Payment Method</span>
            </label>
            <select
              className="select select-bordered w-full"
              {...register('paymentMethod')}
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
                  {...register('provider')}
                >
                  <option value="">Select Provider</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
                {errors.provider && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.provider.message}</span>
                  </label>
                )}
              </div>

              <Input
                label="Phone Number"
                placeholder="01XXXXXXXXX"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </>
          ) : (
            <>
              <Input
                label="Bank Name"
                placeholder="e.g., Dutch-Bangla Bank"
                error={errors.bankName?.message}
                {...register('bankName')}
              />

              <Input
                label="Account Number"
                error={errors.accountNumber?.message}
                {...register('accountNumber')}
              />
            </>
          )}

          <Input
            label="Transaction ID"
            error={errors.transactionId?.message}
            {...register('transactionId')}
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Transaction Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              {...register('transactionDate')}
            />
            {errors.transactionDate && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.transactionDate.message}</span>
              </label>
            )}
          </div>

          <div className="alert alert-info text-sm">
            <span>Your parent agent will review and approve your quota request after verifying the payment.</span>
          </div>

          <div className="card-actions justify-end mt-6">
            <Button
              type="submit"
              loading={quotaRequestMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
