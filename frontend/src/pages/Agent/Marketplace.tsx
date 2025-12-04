import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../hooks/useSocket';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const navigate = useNavigate();
  const { user, updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const fetchListings = async (newPageIndex: number, newPageSize: number) => {
    try {
      setLoading(true);
      const page = newPageIndex + 1;
      const { data } = await api.get(`/quota/marketplace?page=${page}&limit=${newPageSize}`);
      setListings(data.data);
      setPageCount(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(pageIndex, pageSize);

    // Connect and join marketplace room for real-time updates
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join-marketplace-room');

    // Listen for real-time marketplace events
    const handleListingCreated = () => {
      console.log('New listing created, refreshing...');
      fetchListings(pageIndex, pageSize);
      toast.success('New listing available!');
    };

    const handleListingPurchased = () => {
      console.log('Listing purchased, refreshing...');
      fetchListings(pageIndex, pageSize);
    };

    const handleListingCancelled = () => {
      console.log('Listing cancelled, refreshing...');
      fetchListings(pageIndex, pageSize);
    };

    const handleListingAvailable = () => {
      console.log('Listing available again, refreshing...');
      fetchListings(pageIndex, pageSize);
      toast('Listing is now available again', { icon: '✅' });
    };

    socket.on('listing-created', handleListingCreated);
    socket.on('listing-purchased', handleListingPurchased);
    socket.on('listing-cancelled', handleListingCancelled);
    socket.on('listing-available', handleListingAvailable);

    return () => {
      socket.off('listing-created', handleListingCreated);
      socket.off('listing-purchased', handleListingPurchased);
      socket.off('listing-cancelled', handleListingCancelled);
      socket.off('listing-available', handleListingAvailable);
    };
  }, [pageIndex, pageSize]);

  const handlePurchase = async (listingId: string) => {
    if (!confirm('Are you sure you want to purchase this quota? The transaction will require admin approval.')) return;
    
    try {
      await api.post(`/quota/purchase/${listingId}`);
      toast.success('Purchase request submitted! Awaiting admin approval.');
      fetchListings(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purchase');
    }
  };

  const columns = [
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
      cell: ({ row }: any) => <span className="font-bold text-primary">{row.original.quantity}</span>,
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
      header: 'Listed',
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const isSuperAdmin = user?.role === 'superadmin';
        
        // Super admin can only observe
        if (isSuperAdmin) {
          return <span className="text-sm text-gray-500 italic">Observer mode</span>;
        }
        
        return (
          row.original.sellerId?._id !== user?._id ? (
            <Button 
              size="sm" 
              onClick={() => handlePurchase(row.original._id)}
              disabled={user?.creditBalance! < row.original.totalPrice}
            >
              {user?.creditBalance! < row.original.totalPrice ? 'Insufficient Credits' : 'Purchase'}
            </Button>
          ) : (
            <span className="text-xs text-gray-500">Your Listing</span>
          )
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quota Marketplace</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/agent/list-quota')}>
            List Quota for Sale
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="My Quota">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available</div>
          </div>
        </Card>

        <Card title="My Credits">
          <div className="stat p-0">
            <div className="stat-value text-secondary">{user?.creditBalance}</div>
            <div className="stat-desc">Purchasing power</div>
          </div>
        </Card>

        <Card title="Active Listings">
          <div className="stat p-0">
            <div className="stat-value">{listings.length}</div>
            <div className="stat-desc">In marketplace</div>
          </div>
        </Card>
      </div>

      <Card title="Available Quotas">
        {listings.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            <p>No quotas available in the marketplace</p>
            <p className="text-sm mt-2">Check back later or list your own quota for sale</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={listings}
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
