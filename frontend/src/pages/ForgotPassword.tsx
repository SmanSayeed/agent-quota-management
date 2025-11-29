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

// Schema for Step 1: Email
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for Step 2: OTP & New Password
const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormInputs = z.infer<typeof emailSchema>;
type ResetFormInputs = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Form for Step 1
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormInputs>({
    resolver: zodResolver(emailSchema),
  });

  // Form for Step 2
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetFormInputs>({
    resolver: zodResolver(resetSchema),
  });

  const onEmailSubmit = async (data: EmailFormInputs) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setEmail(data.email);
      setStep('reset');
      toast.success('If an account exists, an OTP has been sent.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetFormInputs) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      await api.post('/auth/resend-otp', {
        email,
        type: 'password-reset',
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
      <Card className="w-full max-w-md" title={step === 'email' ? "Forgot Password" : "Reset Password"}>
        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4 mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Enter your registered email address and we'll send you an OTP to reset your password.
            </p>

            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              error={emailErrors.email?.message}
              {...registerEmail('email')}
            />
            
            <div className="card-actions justify-end mt-6">
              <Button type="submit" loading={isLoading} className="w-full">
                Send OTP
              </Button>
            </div>

            <div className="text-center mt-4 text-sm">
              Remember your password?{' '}
              <Link to="/login" className="link link-primary">
                Login here
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4 mt-4">
            <div className="alert alert-info text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>We sent a 6-digit code to <strong>{email}</strong></span>
            </div>

            <Input
              label="Enter OTP Code"
              type="text"
              placeholder="123456"
              className="text-center text-2xl tracking-widest"
              error={resetErrors.otp?.message}
              {...registerReset('otp')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="******"
              error={resetErrors.newPassword?.message}
              {...registerReset('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="******"
              error={resetErrors.confirmPassword?.message}
              {...registerReset('confirmPassword')}
            />
            
            <div className="card-actions flex-col gap-3 mt-6">
              <Button type="submit" loading={isLoading} className="w-full btn-primary">
                Reset Password
              </Button>
              
              <div className="flex justify-between w-full text-sm">
                <button 
                  type="button" 
                  onClick={() => setStep('email')}
                  className="link link-hover text-gray-500"
                >
                  Back to Email
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
