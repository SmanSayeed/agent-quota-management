import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
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
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['quotaRequests', pagination.pageIndex, pagination.pageSize, statusFilter, paymentMethodFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
      });
      const { data } = await api.get(`/quota-request?${params.toString()}`);
      return data;
    },
  });

  const quotaRequests = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

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
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/quota-request/reject/${id}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotaRequests'] });
      toast.success('Quota request rejected');
      handleCloseRejectModal();
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

  const handleRejectClick = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    handleCloseModal(); // Close the details modal first
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

  const columns = useMemo<ColumnDef<QuotaRequest>[]>(
    () => [
      {
        header: 'Child Agent',
        cell: ({ row }) => row.original.childId?.name || 'Unknown',
      },
      {
        header: 'Phone',
        cell: ({ row }) => row.original.childId?.phone || 'N/A',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <span className="font-bold">{row.original.amount}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
        cell: ({ row }) => (
          <div className="badge badge-outline">
            {row.original.paymentMethod === 'mobile_banking' ? 'Mobile Banking' : 'Bank Transfer'}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div
            className={`badge ${
              row.original.status === 'approved'
                ? 'badge-success'
                : row.original.status === 'pending'
                ? 'badge-warning'
                : 'badge-error'
            }`}
          >
            {row.original.status}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button size="sm" onClick={() => handleViewDetails(row.original)}>
            View Details
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quota Requests from Child Agents</h1>

      <Card>
        <DataTable
          columns={columns}
          data={quotaRequests}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          filterConfigs={[
            {
              id: 'status',
              label: 'Status',
              type: 'select',
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
              options: [
                { label: 'All Status', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ],
            },
            {
              id: 'paymentMethod',
              label: 'Payment Method',
              type: 'select',
              value: paymentMethodFilter,
              onChange: (value) => {
                setPaymentMethodFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
              options: [
                { label: 'All Methods', value: 'all' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
                { label: 'Mobile Banking', value: 'mobile_banking' },
              ],
            },
          ]}
        />
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
                onClick={() => handleRejectClick(selectedRequest._id)}
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

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={!!rejectId}
        onClose={handleCloseRejectModal}
        title="Reject Quota Request"
      >
        <div className="space-y-4">
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Please provide a reason for rejection. The child agent will be notified.</span>
          </div>
          
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
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
