import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePoolStore } from '../../store/poolStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LivePoolQuota from '../../components/ui/LivePoolQuota';
import BuyCreditModal from '../../components/modals/BuyCreditModal';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const { dailyPurchaseLimit, setPoolData } = usePoolStore();
  const [isBuyCreditOpen, setIsBuyCreditOpen] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Quota Overview - Matches image style */}
        <Card className="col-span-1 bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Quota Overview</h3>
              <p className="text-sm text-base-content/50 mt-1">Remaining Total Quota</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-base-content">{user?.quotaBalance?.toLocaleString()}</span>
              <span className="text-lg text-primary font-medium">units</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-base-300 rounded-full h-3 mt-2">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(((user?.quotaBalance || 0) / 10000) * 100, 100)}%` }} // Assuming 10k is a visual max for now
              ></div>
            </div>
          </div>
        </Card>

        {/* Financial Summary - Matches image style */}
        <Card className="col-span-1 bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-base-content/80">Financial Summary</h3>
                <p className="text-sm text-base-content/50 mt-1">Current Credit Balance</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-base-content">
                <span className="text-secondary mr-1">৳</span>
                {user?.creditBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-2">
              <Button 
                size="sm" 
                variant="primary" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white border-none"
                onClick={() => setIsBuyCreditOpen(true)}
              >
                Request Credit
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Global Pool */}
        <Card className="col-span-1 bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-base-content/80">Live Global Pool</h3>
            <div className="flex items-center justify-center py-4">
              <LivePoolQuota showLabel={false} className="scale-125" />
            </div>
            <p className="text-center text-sm text-base-content/50">Real-time availability</p>
          </div>
        </Card>

        {/* Daily Limit */}
        <Card className="col-span-1 bg-base-100 border border-base-content/5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-base-content/80">Daily Purchase Limit</h3>
              <p className="text-sm text-base-content/50 mt-1">Usage Today</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-base-content">
                {user?.todayPurchased} <span className="text-base-content/40 text-xl">/ {dailyPurchaseLimit}</span>
              </span>
            </div>

            <div className="w-full bg-base-300 rounded-full h-3 mt-2">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  (user?.todayPurchased || 0) >= (dailyPurchaseLimit || 1) ? 'bg-error' : 'bg-success'
                }`}
                style={{ width: `${Math.min(((user?.todayPurchased || 0) / (dailyPurchaseLimit || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="alert alert-info text-xs sm:text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Use the quick action buttons in the sidebar to Request Slips, Buy Credit, or Buy Quota.</span>
      </div>

      {/* Buy Credit Modal */}
      <BuyCreditModal isOpen={isBuyCreditOpen} onClose={() => setIsBuyCreditOpen(false)} />
    </div>
  );
}
