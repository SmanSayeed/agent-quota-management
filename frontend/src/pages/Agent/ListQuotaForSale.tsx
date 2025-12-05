import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const listingSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  pricePerQuota: z.coerce.number().min(1, 'Price must be at least 1 credit'),
});

type ListingInputs = z.infer<typeof listingSchema>;

export default function ListQuotaForSale() {
  const navigate = useNavigate();
  const { user, updateQuotaBalance } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingInputs>({
    resolver: zodResolver(listingSchema),
  });

  const quantity = watch('quantity');
  const pricePerQuota = watch('pricePerQuota');
  const totalPrice = (quantity || 0) * (pricePerQuota || 0);

  const fetchListings = async (newPageIndex: number, newPageSize: number) => {
    try {
      setLoading(true);
      const page = newPageIndex + 1; // API uses 1-indexed pages
      const { data } = await api.get(`/quota/my-listings?page=${page}&limit=${newPageSize}`);
      setListings(data.data);
      setPageCount(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchListings(pageIndex, pageSize);
  }, [pageIndex, pageSize]);

  const onSubmit = async (data: ListingInputs) => {
    try {
      await api.post('/quota/listing', data);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      
      toast.success('Listing created successfully');
      reset();
      fetchListings(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create listing');
    }
  };

  const openCancelModal = (id: string) => {
    setSelectedListingId(id);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedListingId) return;
    
    try {
      await api.delete(`/quota/listing/${selectedListingId}`);
      
      const { data: meData } = await api.get('/auth/me');
      updateQuotaBalance(meData.data.quotaBalance);
      
      toast.success('Listing cancelled successfully');
      setShowCancelModal(false);
      setSelectedListingId(null);
      fetchListings(pageIndex, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel listing');
    }
  };

  const columns = [
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'pricePerQuota',
      header: 'Price/Quota',
      cell: ({ row }: any) => `${row.original.pricePerQuota} credits`,
    },
    {
      accessorKey: 'totalPrice',
      header: 'Total Price',
      cell: ({ row }: any) => `${row.original.totalPrice} credits`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={`badge ${
          row.original.status === 'active' ? 'badge-success' :
          row.original.status === 'sold' ? 'badge-info' :
          'badge-ghost'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        row.original.status === 'active' ? (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => openCancelModal(row.original._id)}
          >
            Cancel
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">List Quota for Sale</h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="My Quota Balance">
          <div className="stat p-0">
            <div className="stat-value text-primary">{user?.quotaBalance}</div>
            <div className="stat-desc">Available to list</div>
          </div>
        </Card>

        <Card title="Credit Balance">
          <div className="stat p-0">
            <div className="stat-value text-secondary">{user?.creditBalance}</div>
            <div className="stat-desc">Your credits</div>
          </div>
        </Card>
      </div>

      <Card title="Create New Listing">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            
            <Input
              label="Price per Quota (credits)"
              type="number"
              error={errors.pricePerQuota?.message}
              {...register('pricePerQuota')}
            />
          </div>

          {quantity > 0 && pricePerQuota > 0 && (
            <div className="alert alert-info">
              <span>
                Total Price: <strong>{totalPrice} credits</strong>
              </span>
            </div>
          )}

          <div className="card-actions justify-end">
            <Button type="submit" loading={isSubmitting}>
              Create Listing
            </Button>
          </div>
        </form>
      </Card>

      <Card title="My Listings">
        <DataTable
          columns={columns}
          data={listings}
          pageCount={pageCount}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={setPagination}
          isLoading={loading}
        />
      </Card>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedListingId(null);
        }}
        onConfirm={handleCancelConfirm}
        title="Cancel Listing"
        message="Are you sure you want to cancel this listing? The quota will be returned to your balance."
        confirmText="Yes, Cancel Listing"
      />
    </div>
  );
}
