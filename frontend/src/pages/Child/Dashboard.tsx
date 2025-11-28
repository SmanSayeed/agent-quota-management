import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ChildDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Child Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available to use</div>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-4">
            <p>You can upload passports using your available quota.</p>
            <Button onClick={() => navigate('/child/upload-passport')}>
              Upload New Passport
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
