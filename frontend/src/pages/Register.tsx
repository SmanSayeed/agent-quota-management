import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  parentAgentId: z.string().optional(),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      // Filter out empty parentAgentId if it's an empty string
      const payload = {
        ...data,
        parentAgentId: data.parentAgentId || undefined
      };
      
      await api.post('/auth/register', payload);
      toast.success('Registration successful! Please wait for approval.');
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <Card className="w-full max-w-md" title="Register Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />

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

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Parent Agent ID (Optional)</span>
              <span className="label-text-alt text-gray-500">For Child Agents</span>
            </label>
            <input
              type="text"
              placeholder="Enter Parent Agent ID"
              className={`input input-bordered w-full ${errors.parentAgentId ? 'input-error' : ''}`}
              {...register('parentAgentId')}
            />
            {errors.parentAgentId && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.parentAgentId.message}</span>
              </label>
            )}
          </div>
          
          <div className="card-actions justify-end mt-6">
            <Button type="submit" loading={isSubmitting} className="w-full">
              Register
            </Button>
          </div>

          <div className="text-center mt-4 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary">
              Login here
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
