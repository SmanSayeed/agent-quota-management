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

  // Quick fill function for testing (only SuperAdmin is seeded)
  const fillSuperAdmin = () => {
    setValue('phone', '01700000000');
    setValue('password', 'password123');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <Card className="w-full max-w-md" title="Login to Agent Management">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
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

          {/* Test Credentials - Only SuperAdmin is seeded */}
          <div className="alert alert-info">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-semibold text-sm">Test SuperAdmin Login:</span>
              </div>
              <div className="flex gap-2 ml-8">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="primary"
                  outline
                  onClick={fillSuperAdmin}
                >
                  👑 Fill SuperAdmin Credentials
                </Button>
              </div>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm link link-hover text-gray-500">
              Forgot Password?
            </Link>
          </div>
          
          <div className="card-actions justify-end mt-6">
            <Button type="submit" loading={isSubmitting} className="w-full">
              Login
            </Button>
          </div>

          <div className="text-center mt-4 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary">
              Register here
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
