import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function PendingPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  
  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPurchases = async (newPageIndex: number, newPageSize: number) => {
    try {
      setLoading(true);
      const page = newPageIndex + 1;
      const { data } = await api.get(`/admin/purchases/pending?page=${page}&limit=${newPageSize}`);
      setPurchases(data.data);
      setPageCount(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

  const openApproveModal = (purchase: any) => {
    setSelectedPurchase(purchase);
    setShowApproveModal(true);
  };

  const openRejectModal = (purchase: any) => {
    setSelectedPurchase(purchase);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPurchase) return;
    
    try {
      await api.post(`/admin/purchases/${selectedPurchase._id}/approve`);
      toast.success('Purchase approved successfully');
      setShowApproveModal(false);
      setSelectedPurchase(null);
      fetchPurchases(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve purchase');
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedPurchase) return;
    
    try {
      await api.post(`/admin/purchases/${selectedPurchase._id}/reject`, { reason: rejectionReason });
      toast.success('Purchase rejected successfully');
      setShowRejectModal(false);
      setSelectedPurchase(null);
      setRejectionReason('');
      fetchPurchases(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject purchase');
    }
  };

  const columns = [
    {
      accessorKey: 'buyer',
      header: 'Buyer',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.buyerId?.name}</div>
          <div className="text-xs text-gray-500">{row.original.buyerId?.phone}</div>
          <div className="text-xs text-info">Credits: {row.original.buyerId?.creditBalance}</div>
        </div>
      ),
    },
    {
      accessorKey: 'seller',
      header: 'Seller',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.sellerId?.name}</div>
          <div className="text-xs text-gray-500">{row.original.sellerId?.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }: any) => <span className="font-bold">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'pricePerQuota',
      header: 'Price/Quota',
      cell: ({ row }: any) => `${row.original.pricePerQuota} credits`,
    },
    {
      accessorKey: 'totalPrice',
      header: 'Total Price',
      cell: ({ row }: any) => (
        <span className="font-bold text-secondary">{row.original.totalPrice} credits</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested',
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="success"
            onClick={() => openApproveModal(row.original)}
          >
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="error"
            onClick={() => openRejectModal(row.original)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pending Marketplace Purchases</h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Pending Purchases">
          <div className="stat p-0">
            <div className="stat-value text-warning">{purchases.length}</div>
            <div className="stat-desc">Awaiting approval</div>
          </div>
        </Card>
      </div>

      <Card title="Purchase Requests">
        {purchases.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending purchase requests</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={purchases}
            pageCount={pageCount}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={setPagination}
            isLoading={loading}
          />
        )}
      </Card>

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedPurchase(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Purchase"
        message="Are you sure you want to approve this purchase?"
        confirmText="Approve"
      >
        {selectedPurchase && (
          <div className="space-y-2 text-sm">
            <div className="alert alert-warning">
              <span>⚠️ Credits will be transferred immediately upon approval</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Buyer:</span>
                <div className="font-bold">{selectedPurchase.buyerId?.name}</div>
                <div className="text-xs">Balance: {selectedPurchase.buyerId?.creditBalance} credits</div>
              </div>
              <div>
                <span className="text-gray-500">Seller:</span>
                <div className="font-bold">{selectedPurchase.sellerId?.name}</div>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="font-bold ml-2">{selectedPurchase.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Cost:</span>
              <span className="font-bold ml-2">{selectedPurchase.totalPrice} credits</span>
            </div>
          </div>
        )}
      </ConfirmModal>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedPurchase(null);
          setRejectionReason('');
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Purchase"
        message="Are you sure you want to reject this purchase?"
        confirmText="Reject"
      >
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Buyer:</span>
                <div className="font-bold">{selectedPurchase.buyerId?.name}</div>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <div className="font-bold">{selectedPurchase.totalPrice} credits</div>
              </div>
            </div>
            <div>
              <label className="label">
                <span className="label-text">Rejection Reason (Optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="alert alert-info">
              <span>Quota will be returned to the seller</span>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
