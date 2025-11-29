import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';

interface QuotaTransaction {
  _id: string;
  type: 'normal' | 'extraPool' | 'agentToChild' | 'liveToPool';
  quantity: number;
  creditCost: number;
  agentQuotaBefore: number;
  agentQuotaAfter: number;
  agentCreditBefore?: number;
  agentCreditAfter?: number;
  childId?: {
    _id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
}

export default function QuotaHistory() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['quotaHistory'],
    queryFn: async () => {
      const { data } = await api.get('/quota/history');
      return data.data as QuotaTransaction[];
    },
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'normal':
        return <span className="badge badge-success">Purchase (Normal)</span>;
      case 'extraPool':
        return <span className="badge badge-warning">Purchase (Extra)</span>;
      case 'agentToChild':
        return <span className="badge badge-info">Transfer to Child</span>;
      case 'liveToPool':
        return <span className="badge badge-error">Return to Pool</span>;
      default:
        return <span className="badge badge-ghost">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quota Transaction History</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Cost (Credit)</th>
                <th>Balance After</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((tx) => (
                <tr key={tx._id}>
                  <td>{format(new Date(tx.createdAt), 'PPpp')}</td>
                  <td>{getTypeLabel(tx.type)}</td>
                  <td className={tx.type === 'agentToChild' || tx.type === 'liveToPool' ? 'text-error' : 'text-success'}>
                    {tx.type === 'agentToChild' || tx.type === 'liveToPool' ? '-' : '+'}{tx.quantity}
                  </td>
                  <td>{tx.creditCost > 0 ? tx.creditCost : '-'}</td>
                  <td>{tx.agentQuotaAfter}</td>
                  <td>
                    {tx.type === 'agentToChild' && tx.childId && (
                      <span className="text-xs">To: {tx.childId.name} ({tx.childId.phone})</span>
                    )}
                    {tx.type === 'liveToPool' && (
                      <span className="text-xs">Returned to Global Pool</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No transactions found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <span className="loading loading-spinner"></span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
