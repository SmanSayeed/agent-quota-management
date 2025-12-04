import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

export default function PendingPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

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

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this purchase? Credits will be transferred immediately.')) return;
    
    try {
      await api.post(`/admin/purchases/${id}/approve`);
      toast.success('Purchase approved successfully');
      fetchPurchases(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve purchase');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      await api.post(`/admin/purchases/${id}/reject`, { reason });
      toast.success('Purchase rejected successfully');
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
            onClick={() => handleApprove(row.original._id)}
          >
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="error"
            onClick={() => handleReject(row.original._id)}
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
    </div>
  );
}
