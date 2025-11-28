import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

interface PaymentDetails {
  transactionId: string;
  transactionDate: string;
  bankName?: string;
  accountNumber?: string;
  provider?: string;
  phoneNumber?: string;
}

interface QuotaRequest {
  _id: string;
  childId: {
    _id: string;
    name: string;
    phone: string;
  };
  amount: number;
  paymentMethod: 'bank_transfer' | 'mobile_banking';
  paymentDetails: PaymentDetails;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AgentQuotaRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<QuotaRequest | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<string>('');

  const { data: quotaRequests, isLoading } = useQuery({
    queryKey: ['quotaRequests'],
    queryFn: async () => {
      const { data } = await api.get('/quota-request');
      return data.data as QuotaRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      await api.put(`/quota-request/approve/${id}`, { approvedAmount: amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotaRequests'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Quota request approved successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to approve request';
      toast.error(message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/quota-request/reject/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotaRequests'] });
      toast.success('Quota request rejected');
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to reject request';
      toast.error(message);
    },
  });

  const handleViewDetails = (request: QuotaRequest) => {
    setSelectedRequest(request);
    setApprovedAmount(request.amount.toString());
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setApprovedAmount('');
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    const amount = parseInt(approvedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    approveMutation.mutate({ id: selectedRequest._id, amount });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const pendingRequests = quotaRequests?.filter(r => r.status === 'pending') || [];
  const processedRequests = quotaRequests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quota Requests from Child Agents</h1>

      <Card title="Pending Requests">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Child Agent</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.childId?.name || 'Unknown'}</td>
                  <td>{request.childId?.phone || 'N/A'}</td>
                  <td className="font-bold">{request.amount}</td>
                  <td>
                    <div className="badge badge-outline">
                      {request.paymentMethod === 'mobile_banking' ? 'Mobile Banking' : 'Bank Transfer'}
                    </div>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    No pending quota requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Request History">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Child Agent</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {processedRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.childId?.name || 'Unknown'}</td>
                  <td>{request.childId?.phone || 'N/A'}</td>
                  <td>{request.amount}</td>
                  <td>
                    <div
                      className={`badge ${
                        request.status === 'approved' ? 'badge-success' : 'badge-error'
                      }`}
                    >
                      {request.status}
                    </div>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {processedRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    No request history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={handleCloseModal}
        title="Review Quota Request"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>Review the payment details before approving or rejecting the request.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Child Agent</p>
                <p className="font-bold">{selectedRequest.childId?.name}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Phone</p>
                <p className="font-bold">{selectedRequest.childId?.phone}</p>
              </div>
            </div>

            <div className="divider">Payment Details</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Requested Quota</p>
                <p className="font-bold text-lg">{selectedRequest.amount}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Payment Method</p>
                <p className="font-bold">
                  {selectedRequest.paymentMethod === 'mobile_banking' ? 'Mobile Banking' : 'Bank Transfer'}
                </p>
              </div>
            </div>

            {selectedRequest.paymentMethod === 'mobile_banking' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Provider</p>
                  <p className="font-bold">{selectedRequest.paymentDetails?.provider || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Phone Number</p>
                  <p className="font-bold">{selectedRequest.paymentDetails?.phoneNumber || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Bank Name</p>
                  <p className="font-bold">{selectedRequest.paymentDetails?.bankName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Account Number</p>
                  <p className="font-bold">{selectedRequest.paymentDetails?.accountNumber || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Transaction ID</p>
                <p className="font-bold">{selectedRequest.paymentDetails?.transactionId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Transaction Date</p>
                <p className="font-bold">{selectedRequest.paymentDetails?.transactionDate || 'N/A'}</p>
              </div>
            </div>

            <div className="divider">Approval</div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Approved Quota Amount</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                min="1"
              />
              <label className="label">
                <span className="label-text-alt text-warning">You can adjust the amount if needed.</span>
              </label>
            </div>

            <div className="modal-action">
              <Button variant="ghost" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={() => rejectMutation.mutate(selectedRequest._id)}
                loading={rejectMutation.isPending}
              >
                Reject
              </Button>
              <Button
                variant="success"
                onClick={handleApprove}
                loading={approveMutation.isPending}
              >
                Approve {approvedAmount} Quota
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
