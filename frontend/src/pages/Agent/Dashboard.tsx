import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LivePoolQuota from '../../components/ui/LivePoolQuota';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const { dailyPurchaseLimit, setPoolData } = usePoolStore();

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Agent Dashboard</h1>
        <div className="flex items-center gap-2 bg-base-200 p-2 sm:p-2 rounded-lg flex-wrap">
          <span className="text-xs sm:text-sm font-medium opacity-70">Agent ID:</span>
          <code className="font-mono bg-base-300 px-2 py-1 rounded text-xs sm:text-sm break-all">{user?._id}</code>
          <Button size="sm" variant="ghost" onClick={copyAgentId} title="Copy Agent ID" className="ml-auto sm:ml-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary text-2xl sm:text-3xl">{user?.quotaBalance}</div>
            <div className="stat-desc text-xs sm:text-sm">Available to use</div>
          </div>
        </Card>

        <Card title="Live Global Pool">
          <div className="flex items-center justify-center p-2 sm:p-4">
            <LivePoolQuota showLabel={false} />
          </div>
        </Card>

        <Card title="Credit Balance">
          <div className="stat p-0">
            <div className="stat-value text-secondary text-2xl sm:text-3xl">{user?.creditBalance}</div>
            <div className="stat-desc text-xs sm:text-sm">Credits available</div>
          </div>
        </Card>

        <Card title="Daily Limit">
          <div className="stat p-0">
            <div className="stat-value text-xl sm:text-2xl md:text-3xl">
              {user?.todayPurchased} / {dailyPurchaseLimit}
            </div>
            <div className="stat-desc text-xs sm:text-sm">Purchased Today</div>
          </div>
        </Card>
      </div>
      
      <div className="alert alert-info text-xs sm:text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Use the quick action buttons in the sidebar to Request Slips, Buy Credit, or Buy Quota.</span>
      </div>
    </div>
  );
}
