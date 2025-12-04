import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data);
      toast.success('Logged in successfully');
    } catch (error) {
      // Error is handled by axios interceptor globally, but we can log it here
      console.error(error);
    }
  };




  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-3 sm:p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Agent Management System" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Agent Management System</h1>
        </div>
        
        <Card className="w-full" title="Login to Your Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          <Input
            label="Phone Number"
            type="text"
            placeholder="01712345678"
            error={errors.phone?.message}
            {...register('phone')}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="******"
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Test Credentials */}
          <div className="alert alert-info text-xs sm:text-sm p-3">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5 sm:w-6 sm:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-semibold">Quick Login (Test Users):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="primary"
                  onClick={() => { setValue('phone', '01700000000'); setValue('password', 'admin123'); }}
                  className="w-full text-xs"
                >
                  👑 Super Admin
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="secondary"
                  onClick={() => { setValue('phone', '01700000001'); setValue('password', 'password123'); }}
                  className="w-full text-xs"
                >
                  👤 Agent 1 (Seller)
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="secondary"
                  onClick={() => { setValue('phone', '01700000002'); setValue('password', 'password123'); }}
                  className="w-full text-xs"
                >
                  👤 Agent 2 (Buyer)
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost"
                  onClick={() => { setValue('phone', '01700000003'); setValue('password', 'password123'); }}
                  className="w-full text-xs border border-base-content/20"
                >
                  👶 Child Agent
                </Button>
              </div>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm link link-hover text-gray-500 p-1">
              Forgot Password?
            </Link>
          </div>
          
          <div className="card-actions justify-end mt-4 sm:mt-6">
            <Button type="submit" loading={isSubmitting} className="w-full">
              Login
            </Button>
          </div>

          <div className="text-center mt-4 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary p-1 font-medium">
              Register here
            </Link>
          </div>
        </form>
      </Card>
      </div>
    </div>
  );
}
