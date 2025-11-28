import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

interface PaymentDetails {
  transactionId: string;
  transactionDate: string;
  bankName?: string;
  accountNumber?: string;
  provider?: string;
  phoneNumber?: string;
}

interface CreditRequest {
  _id: string;
  agentId: {
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

export default function CreditRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['creditRequests'],
    queryFn: async () => {
      const { data } = await api.get('/credit');
      return data.data as CreditRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      await api.put(`/credit/${id}/approve`, { approvedAmount: amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditRequests'] });
      toast.success('Credit request approved');
      handleCloseApproveModal();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/credit/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditRequests'] });
      toast.success('Credit request rejected');
      handleCloseRejectModal();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleApproveClick = (request: CreditRequest) => {
    setSelectedRequest(request);
    setApproveAmount(request.amount.toString());
  };

  const handleCloseApproveModal = () => {
    setSelectedRequest(null);
    setApproveAmount('');
  };

  const confirmApprove = () => {
    if (selectedRequest && approveAmount) {
      const amount = parseFloat(approveAmount);
      if (amount <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }
      approveMutation.mutate({ id: selectedRequest._id, amount });
    } else {
      toast.error('Please enter an amount');
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectId(id);
    setRejectReason('');
  };

  const handleCloseRejectModal = () => {
    setRejectId(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (rejectId && rejectReason.trim()) {
      rejectMutation.mutate({ id: rejectId, reason: rejectReason });
    } else {
      toast.error('Please provide a rejection reason');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Credit Requests</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Requested Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((req) => (
                <tr key={req._id}>
                  <td>
                    <div>
                      <div className="font-bold">{req.agentId?.name || 'Unknown'}</div>
                      <div className="text-sm opacity-50">{req.agentId?.phone}</div>
                    </div>
                  </td>
                  <td>{req.amount} BDT</td>
                  <td>
                    <div className="badge badge-outline">
                      {req.paymentMethod === 'mobile_banking' ? 'Mobile Banking' : 'Bank Transfer'}
                    </div>
                  </td>
                  <td>
                    <div
                      className={`badge ${
                        req.status === 'approved'
                          ? 'badge-success'
                          : req.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {req.status}
                    </div>
                  </td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproveClick(req)}
                        >
                          Review & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleRejectClick(req._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    No credit requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approve Modal with Payment Details */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={handleCloseApproveModal}
        title="Review Credit Request"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>Review the payment details and enter the credit amount to approve.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Agent</p>
                <p className="font-bold">{selectedRequest.agentId?.name}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Phone</p>
                <p className="font-bold">{selectedRequest.agentId?.phone}</p>
              </div>
            </div>

            <div className="divider">Payment Details</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Requested Amount</p>
                <p className="font-bold text-lg">{selectedRequest.amount} BDT</p>
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
                  <p className="font-bold">{selectedRequest.paymentDetails.provider}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Phone Number</p>
                  <p className="font-bold">{selectedRequest.paymentDetails.phoneNumber}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Bank Name</p>
                  <p className="font-bold">{selectedRequest.paymentDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Account Number</p>
                  <p className="font-bold">{selectedRequest.paymentDetails.accountNumber}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Transaction ID</p>
                <p className="font-bold">{selectedRequest.paymentDetails.transactionId}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Transaction Date</p>
                <p className="font-bold">{selectedRequest.paymentDetails.transactionDate}</p>
              </div>
            </div>

            <div className="divider">Approval</div>

            <Input
              label="Credit Amount to Approve (BDT)"
              type="number"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="Enter amount"
            />

            <div className="alert alert-warning">
              <span>You can approve less credit than requested if the payment is insufficient.</span>
            </div>

            <div className="modal-action">
              <Button variant="ghost" onClick={handleCloseApproveModal}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={confirmApprove}
                loading={approveMutation.isPending}
              >
                Approve {approveAmount} BDT
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectId}
        onClose={handleCloseRejectModal}
        title="Reject Credit Request"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Insufficient payment proof"
          />
          <div className="modal-action">
            <Button variant="ghost" onClick={handleCloseRejectModal}>
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={confirmReject}
              loading={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
