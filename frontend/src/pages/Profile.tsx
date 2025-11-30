import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

// Schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

// Schema for password change - Step 1: Send OTP
const requestOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for password change - Step 2: Verify OTP and set new password
const changePasswordSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormInputs = z.infer<typeof profileSchema>;
type RequestOTPInputs = z.infer<typeof requestOTPSchema>;
type ChangePasswordInputs = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, checkAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'request' | 'verify'>('request');
  const [passwordEmail, setPasswordEmail] = useState('');

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    },
  });

  // Request OTP form
  const {
    register: registerOTP,
    handleSubmit: handleSubmitOTP,
    formState: { errors: otpErrors },
    setValue: setOTPValue,
  } = useForm<RequestOTPInputs>({
    resolver: zodResolver(requestOTPSchema),
  });

  // Change password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordInputs>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        phone: user.phone,
        email: user.email || '',
      });
      setOTPValue('email', user.email || '');
      setPasswordEmail(user.email || '');
    }
  }, [user, resetProfile, setOTPValue]);

  const onProfileSubmit = async (data: ProfileFormInputs) => {
    setIsLoading(true);
    try {
      await api.put('/auth/profile', data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      checkAuth(); // Refresh user data
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onRequestOTP = async (data: RequestOTPInputs) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setPasswordEmail(data.email);
      setPasswordStep('verify');
      toast.success('OTP sent to your email');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordInputs) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: passwordEmail,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordSection(false);
      setPasswordStep('request');
      resetPassword();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!passwordEmail) return;
    
    setIsLoading(true);
    try {
      await api.post('/auth/resend-otp', {
        email: passwordEmail,
        type: 'password-reset',
      });
      toast.success('OTP resent successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      resetProfile({
        name: user.name,
        phone: user.phone,
        email: user.email || '',
      });
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordSection(false);
    setPasswordStep('request');
    resetPassword();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-base-content/70 mt-1">Manage your account information</p>
        </div>
      </div>

      {/* Profile Information Card */}
      <Card title="Personal Information">
        <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4 mt-4">
          {/* User Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-20 h-20">
                <span className="text-3xl">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-sm text-base-content/70 capitalize">{user?.role}</p>
              <div className="badge badge-sm mt-1" data-status={user?.status}>
                {user?.status}
              </div>
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            disabled={!isEditing}
            error={profileErrors.name?.message}
            {...registerProfile('name')}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="01XXXXXXXXX"
            disabled={!isEditing}
            error={profileErrors.phone?.message}
            {...registerProfile('phone')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            disabled={!isEditing}
            error={profileErrors.email?.message}
            {...registerProfile('email')}
          />

          {/* Account Status Info */}
          {!isEditing && (
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <div className="text-sm">
                  <strong>Account Status:</strong> {user?.status}
                  {user?.emailVerified && <span className="ml-2 badge badge-success badge-sm">Email Verified</span>}
                  {!user?.emailVerified && <span className="ml-2 badge badge-warning badge-sm">Email Not Verified</span>}
                </div>
                {user?.parentId && (
                  <div className="text-xs mt-1 opacity-80">
                    This is a child agent account
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {!isEditing ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  loading={isLoading}
                  className="btn-primary"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-ghost"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </Card>

      {/* Password Management Card */}
      <Card title="Security">
        {!showPasswordSection ? (
          <div className="mt-4">
            <p className="text-sm text-base-content/70 mb-4">
              Change your password to keep your account secure. A verification code will be sent to your registered email: <strong>{user?.email || 'No email set'}</strong>
            </p>
            <Button
              type="button"
              onClick={async () => {
                if (!user?.email) {
                  toast.error('Please add an email to your profile before changing password');
                  return;
                }
                setIsLoading(true);
                try {
                  await api.post('/auth/forgot-password', { email: user.email });
                  setPasswordEmail(user.email);
                  setPasswordStep('verify');
                  setShowPasswordSection(true);
                  toast.success('OTP sent to your email');
                } catch (error: any) {
                  console.error(error);
                  toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="btn-secondary"
              loading={isLoading}
              disabled={!user?.email}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Change Password
            </Button>
            {!user?.email && (
              <p className="text-xs text-error mt-2">Please add an email address to your profile first</p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">
                  We sent a 6-digit code to <strong>{user?.email}</strong>
                </span>
              </div>

              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                error={passwordErrors.otp?.message}
                {...registerPassword('otp')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button type="submit" loading={isLoading} className="btn-primary flex-1">
                    Change Password
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    className="btn-ghost"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="flex justify-end text-sm">
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="link link-primary"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Account Balances - Only for Agent and Child */}
      {(user?.role === 'agent' || user?.role === 'child') && (
        <Card title="Account Balances">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="stat bg-base-200 rounded-lg shadow-sm">
              <div className="stat-title">Credit Balance</div>
              <div className="stat-value text-primary">{user?.creditBalance || 0}</div>
              <div className="stat-desc">Available credits</div>
            </div>
            
            <div className="stat bg-base-200 rounded-lg shadow-sm">
              <div className="stat-title">Quota Balance</div>
              <div className="stat-value text-secondary">{user?.quotaBalance || 0}</div>
              <div className="stat-desc">
                Today purchased: {user?.todayPurchased || 0}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
