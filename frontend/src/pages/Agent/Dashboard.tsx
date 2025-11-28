import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const { availableQuota, dailyPurchaseLimit, setPoolData } = usePoolStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pool quota
        const poolResponse = await api.get('/quota/pool');
        // Fetch settings
        const settingsResponse = await api.get('/settings');
        
        setPoolData({
          availableQuota: poolResponse.data.data.availableQuota,
          creditPrice: settingsResponse.data.data.creditPrice,
          quotaPrice: settingsResponse.data.data.quotaPrice,
          dailyPurchaseLimit: settingsResponse.data.data.dailyPurchaseLimit,
        });
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    fetchData();
  }, [setPoolData]);

  const copyAgentId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      toast.success('Agent ID copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <div className="flex items-center gap-2 bg-base-200 p-2 rounded-lg">
          <span className="text-sm font-medium opacity-70">Agent ID:</span>
          <code className="font-mono bg-base-300 px-2 py-1 rounded text-sm">{user?._id}</code>
          <Button size="sm" variant="ghost" onClick={copyAgentId} title="Copy Agent ID">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available to use</div>
          </div>
        </Card>

        <Card title="Global Pool">
          <div className="stat p-0">
            <div className="stat-value text-accent">{availableQuota}</div>
            <div className="stat-desc">Available in pool</div>
          </div>
        </Card>

        <Card title="Credit Balance">
          <div className="stat p-0">
            <div className="stat-value text-secondary">{user?.creditBalance}</div>
            <div className="stat-desc">Credits available</div>
          </div>
        </Card>

        <Card title="Daily Limit">
          <div className="stat p-0">
            <div className="stat-value">
              {user?.todayPurchased} / {dailyPurchaseLimit}
            </div>
            <div className="stat-desc">Purchased Today</div>
          </div>
        </Card>
      </div>
      
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Use the quick action buttons in the sidebar to Request Slips, Buy Credit, or Buy Quota.</span>
      </div>
    </div>
  );
}
