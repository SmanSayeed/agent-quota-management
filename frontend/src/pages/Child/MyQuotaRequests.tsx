import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';

interface QuotaRequest {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  paymentDetails: {
    transactionId: string;
    transactionDate: string;
    bankName?: string;
    accountNumber?: string;
    provider?: string;
    phoneNumber?: string;
  };
  createdAt: string;
}

export default function MyQuotaRequests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['myQuotaRequests'],
    queryFn: async () => {
      const { data } = await api.get('/quota-request/my-requests');
      return data.data as QuotaRequest[];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <div className="badge badge-success">Approved</div>;
      case 'rejected':
        return <div className="badge badge-error">Rejected</div>;
      default:
        return <div className="badge badge-warning">Pending</div>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Quota Requests</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((req) => (
                <tr key={req._id}>
                  <td>{format(new Date(req.createdAt), 'PPpp')}</td>
                  <td>{req.amount}</td>
                  <td className="capitalize">{req.paymentMethod?.replace('_', ' ') || 'N/A'}</td>
                  <td>{req.paymentDetails?.transactionId || 'N/A'}</td>
                  <td>{getStatusBadge(req.status)}</td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No requests found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
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
