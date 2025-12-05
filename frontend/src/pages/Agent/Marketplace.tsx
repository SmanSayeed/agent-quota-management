import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../hooks/useSocket';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const navigate = useNavigate();
  const { user, updateQuotaBalance, updateCreditBalance } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalMarketQuota, setTotalMarketQuota] = useState(0);
  
  // Modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

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

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/quota/stats');
      setTotalMarketQuota(data.data.totalQuota);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  React.useEffect(() => {
    fetchListings(pageIndex, pageSize);
    fetchStats();

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

    const handleStatsUpdated = (data: { totalQuotaAvailable: number }) => {
      setTotalMarketQuota(data.totalQuotaAvailable);
    };

    socket.on('listing-created', handleListingCreated);
    socket.on('listing-purchased', handleListingPurchased);
    socket.on('listing-cancelled', handleListingCancelled);
    socket.on('listing-available', handleListingAvailable);
    socket.on('stats-updated', handleStatsUpdated);

    return () => {
      socket.off('listing-created', handleListingCreated);
      socket.off('listing-purchased', handleListingPurchased);
      socket.off('listing-cancelled', handleListingCancelled);
      socket.off('listing-available', handleListingAvailable);
      socket.off('stats-updated', handleStatsUpdated);
    };
  }, [pageIndex, pageSize]);

  const openPurchaseModal = (listing: any) => {
    setSelectedListing(listing);
    setPurchaseQuantity(listing.quantity); // Default to max
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedListing) return;

    const totalCost = purchaseQuantity * selectedListing.pricePerQuota;
    
    if (purchaseQuantity > selectedListing.quantity) {
      toast.error(`Only ${selectedListing.quantity} available`);
      return;
    }

    try {
      await api.post(`/quota/purchase/${selectedListing._id}`, { quantity: purchaseQuantity });
      toast.success('Purchase request submitted! Awaiting admin approval.');
      setShowPurchaseModal(false);
      setSelectedListing(null);
      fetchListings(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purchase');
    }
  };

  const [recalculating, setRecalculating] = useState(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);

  const handleRecalculateConfirm = async () => {
    try {
      setRecalculating(true);
      const { data } = await api.post('/quota/stats/recalculate');
      setTotalMarketQuota(data.data.totalQuota);
      toast.success('Stats recalculated successfully');
      setShowRecalculateModal(false);
    } catch (error: any) {
      toast.error('Failed to recalculate stats');
      console.error(error);
    } finally {
      setRecalculating(false);
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
      header: 'Available',
      cell: ({ row }: any) => <span className="font-bold text-primary">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'pricePerQuota',
      header: 'Price/Quota',
      cell: ({ row }: any) => `${row.original.pricePerQuota} credits`,
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
        const isSeller = row.original.sellerId?._id === user?._id;
        
        if (isSuperAdmin) {
          return <span className="text-sm text-gray-500 italic">Observer mode</span>;
        }
        
        if (isSeller) {
          return <span className="text-xs text-gray-500">Your Listing</span>;
        }
        
        const canAfford = (user?.creditBalance || 0) >= row.original.pricePerQuota;
        
        return (
          <Button 
            size="sm" 
            onClick={() => openPurchaseModal(row.original)}
            disabled={!canAfford}
          >
            {canAfford ? 'Buy' : 'Low Credits'}
          </Button>
        );
      },
    },
  ];

  const totalCost = selectedListing ? purchaseQuantity * selectedListing.pricePerQuota : 0;
  const canAfford = user?.creditBalance && user.creditBalance >= totalCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quota Marketplace</h1>
        <div className="flex gap-2">
          {user?.role !== 'superadmin' && (
            <Button variant="ghost" onClick={() => navigate('/agent/list-quota')}>
              List Quota for Sale
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Market Quota">
          <div className="stat p-0">
            <div className="stat-value">{totalMarketQuota}</div>
            <div className="stat-desc mb-2">Available to buy</div>
            
            {user?.role === 'superadmin' && (
              <button 
                onClick={() => setShowRecalculateModal(true)}
                disabled={recalculating}
                className="btn btn-warning btn-outline btn-xs gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${recalculating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {recalculating ? 'Fixing...' : 'Recalculate'}
              </button>
            )}
          </div>
        </Card>

        {user?.role !== 'superadmin' && (
          <>
            <Card title="My Quota">
              <div className="stat p-0">
                <div className="stat-value">{user?.quotaBalance}</div>
                <div className="stat-desc">Available</div>
              </div>
            </Card>

            <Card title="My Credits">
              <div className="stat p-0">
                <div className="stat-value">{user?.creditBalance}</div>
                <div className="stat-desc">Purchasing power</div>
              </div>
            </Card>

            <Card title="Active Listings">
              <div className="stat p-0">
                <div className="stat-value">{listings.length}</div>
                <div className="stat-desc">In marketplace</div>
              </div>
            </Card>
          </>
        )}
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

      {/* Purchase Modal */}
      <ConfirmModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedListing(null);
        }}
        onConfirm={handlePurchaseConfirm}
        title="Purchase Quota"
        message={selectedListing ? `Buying from: ${selectedListing.sellerId?.name}` : ''}
        confirmText={canAfford ? `Confirm Purchase (${totalCost} credits)` : 'Insufficient Credits'}
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Available:</span>
                <span className="font-bold ml-2">{selectedListing.quantity}</span>
              </div>
              <div>
                <span className="text-gray-500">Price/Quota:</span>
                <span className="font-bold ml-2">{selectedListing.pricePerQuota} credits</span>
              </div>
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Quantity to Purchase</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedListing.quantity}
                value={purchaseQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setPurchaseQuantity(Math.min(Math.max(1, val), selectedListing.quantity));
                }}
                className="input input-bordered w-full"
              />
            </div>

            <div className="alert alert-info">
              <div className="flex-1">
                <div className="text-sm">
                  <div>Total Cost: <span className="font-bold">{totalCost} credits</span></div>
                  <div>Your Balance: <span className="font-bold">{user?.creditBalance} credits</span></div>
                  <div>After Purchase: <span className="font-bold">{(user?.creditBalance || 0) - totalCost} credits</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>

      {/* Recalculate Stats Modal */}
      <ConfirmModal
        isOpen={showRecalculateModal}
        onClose={() => setShowRecalculateModal(false)}
        onConfirm={handleRecalculateConfirm}
        title="Recalculate Marketplace Stats"
        message="Are you sure you want to recalculate the total available quota? This will scan all active listings to ensure the counter is accurate."
        confirmText={recalculating ? "Recalculating..." : "Yes, Recalculate"}
        cancelText="Cancel"
      >
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>This action is safe but should only be used if you suspect the counter is incorrect.</span>
        </div>
      </ConfirmModal>
    </div>
  );
}
