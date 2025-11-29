import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

// Schema for Step 1: Details
const detailsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  parentAgentId: z.string().optional(),
});

// Schema for Step 2: OTP
const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type DetailsFormInputs = z.infer<typeof detailsSchema>;
type OtpFormInputs = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState<DetailsFormInputs | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form for Step 1
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    formState: { errors: detailsErrors },
  } = useForm<DetailsFormInputs>({
    resolver: zodResolver(detailsSchema),
  });

  // Form for Step 2
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpFormInputs>({
    resolver: zodResolver(otpSchema),
  });

  const onDetailsSubmit = async (data: DetailsFormInputs) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        parentAgentId: data.parentAgentId || undefined,
      };
      
      await api.post('/auth/send-registration-otp', payload);
      setFormData(payload);
      setStep('otp');
      toast.success('OTP sent to your email! Please verify.');
    } catch (error: any) {
      console.error(error);
      // Error is handled by axios interceptor, but if needed we can show specific errors here
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormInputs) => {
    if (!formData) return;
    
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        otp: data.otp,
      };
      
      await api.post('/auth/verify-and-register', payload);
      toast.success('Registration successful! Please wait for approval.');
      navigate('/login');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData?.email) return;
    
    setIsLoading(true);
    try {
      await api.post('/auth/resend-otp', {
        email: formData.email,
        type: 'registration',
      });
      toast.success('OTP resent successfully!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <Card className="w-full max-w-md" title={step === 'details' ? "Register Account" : "Verify Email"}>
        {step === 'details' ? (
          <form onSubmit={handleSubmitDetails(onDetailsSubmit)} className="space-y-4 mt-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={detailsErrors.name?.message}
              {...registerDetails('name')}
            />

            <Input
              label="Phone Number"
              type="text"
              placeholder="01712345678"
              error={detailsErrors.phone?.message}
              {...registerDetails('phone')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              error={detailsErrors.email?.message}
              {...registerDetails('email')}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="******"
              error={detailsErrors.password?.message}
              {...registerDetails('password')}
            />

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Parent Agent ID (Optional)</span>
                <span className="label-text-alt text-gray-500">For Child Agents</span>
              </label>
              <input
                type="text"
                placeholder="Enter Parent Agent ID"
                className={`input input-bordered w-full ${detailsErrors.parentAgentId ? 'input-error' : ''}`}
                {...registerDetails('parentAgentId')}
              />
              {detailsErrors.parentAgentId && (
                <label className="label">
                  <span className="label-text-alt text-error">{detailsErrors.parentAgentId.message}</span>
                </label>
              )}
            </div>
            
            <div className="card-actions justify-end mt-6">
              <Button type="submit" loading={isLoading} className="w-full">
                Next: Verify Email
              </Button>
            </div>

            <div className="text-center mt-4 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="link link-primary">
                Login here
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-4 mt-4">
            <div className="alert alert-info text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>We sent a 6-digit code to <strong>{formData?.email}</strong></span>
            </div>

            <Input
              label="Enter OTP Code"
              type="text"
              placeholder="123456"
              className="text-center text-2xl tracking-widest"
              error={otpErrors.otp?.message}
              {...registerOtp('otp')}
            />
            
            <div className="card-actions flex-col gap-3 mt-6">
              <Button type="submit" loading={isLoading} className="w-full btn-primary">
                Verify & Register
              </Button>
              
              <div className="flex justify-between w-full text-sm">
                <button 
                  type="button" 
                  onClick={() => setStep('details')}
                  className="link link-hover text-gray-500"
                >
                  Back to Details
                </button>
                
                <button 
                  type="button" 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="link link-primary"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
