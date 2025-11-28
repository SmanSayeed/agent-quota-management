import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const creditRequestSchema = z.object({
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

type CreditRequestInputs = z.infer<typeof creditRequestSchema>;

export default function RequestCredit() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_banking'>('mobile_banking');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreditRequestInputs>({
    resolver: zodResolver(creditRequestSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/credit/request', data);
    },
    onSuccess: () => {
      toast.success('Credit request submitted successfully!');
      navigate('/agent/dashboard');
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const onSubmit = (data: CreditRequestInputs) => {
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

    uploadMutation.mutate(requestData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Request Credit</h1>
        <Button variant="ghost" onClick={() => navigate('/agent/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <Card title="Payment Details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          <Input
            label="Amount"
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
            <span>Please ensure all payment details are correct before submitting.</span>
          </div>

          <div className="card-actions justify-end mt-6">
            <Button
              type="submit"
              loading={uploadMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
