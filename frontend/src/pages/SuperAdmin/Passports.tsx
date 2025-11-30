import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

interface Passport {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
  };
  imagePath: string;
  ocrData: {
    passportNumber: string;
    surname: string;
    givenNames: string;
    dateOfBirth: string;
    dateOfExpiry: string;
    [key: string]: any;
  };
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export default function Passports() {
  const queryClient = useQueryClient();
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Pagination & Filtering State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [passportNumberFilter, setPassportNumberFilter] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('');
  const [givenNamesFilter, setGivenNamesFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['passports', pagination.pageIndex, pagination.pageSize, statusFilter, passportNumberFilter, surnameFilter, givenNamesFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
        passportNumber: passportNumberFilter,
        surname: surnameFilter,
        givenNames: givenNamesFilter,
      });
      const { data } = await api.get(`/passport?${params.toString()}`);
      return data;
    },
  });

  const passports = data?.data || [];
  const pageCount = data?.pagination?.totalPages || 0;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/passport/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      toast.success('Passport status updated');
      handleCloseModal();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleView = async (passport: Passport) => {
    setSelectedPassport(passport);
    setIsModalOpen(true);
    try {
      const { data } = await api.get(`/passport/${passport._id}/image-token`);
      const token = data.data.token;
      setImageUrl(`${api.defaults.baseURL}/passport/image/${token}`);
    } catch (error) {
      console.error('Failed to get image token', error);
      toast.error('Failed to load image');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPassport(null);
    setImageUrl(null);
  };

  const handleStatusUpdate = (status: 'verified' | 'rejected') => {
    if (selectedPassport) {
      updateStatusMutation.mutate({ id: selectedPassport._id, status });
    }
  };

  const columns = useMemo<ColumnDef<Passport>[]>(
    () => [
      {
        accessorKey: 'ocrData.passportNumber',
        header: 'Passport Number',
      },
      {
        accessorKey: 'ocrData.surname',
        header: 'Surname',
      },
      {
        accessorKey: 'ocrData.givenNames',
        header: 'Given Names',
      },
      {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-bold">{row.original.userId?.name}</div>
            <div className="text-sm opacity-50">{row.original.userId?.phone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div
            className={`badge ${
              row.original.status === 'verified'
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
        header: 'Uploaded At',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => handleView(row.original)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Passport Management</h1>

      <Card>
        <DataTable
          columns={columns}
          data={passports}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          filterConfigs={[
            {
              id: 'ocrData.passportNumber',
              label: 'Passport No',
              type: 'text',
              value: passportNumberFilter,
              onChange: (value) => {
                setPassportNumberFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
            },
            {
              id: 'ocrData.surname',
              label: 'Surname',
              type: 'text',
              value: surnameFilter,
              onChange: (value) => {
                setSurnameFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
            },
            {
              id: 'ocrData.givenNames',
              label: 'Given Names',
              type: 'text',
              value: givenNamesFilter,
              onChange: (value) => {
                setGivenNamesFilter(value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              },
            },
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
                { label: 'Verified', value: 'verified' },
                { label: 'Rejected', value: 'rejected' },
              ],
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Passport Details"
      >
        {selectedPassport && (
          <div className="space-y-4">
            {imageUrl && (
              <div className="w-full h-64 bg-base-200 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Passport" className="w-full h-full object-contain" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Passport Number</p>
                <p className="font-bold">{selectedPassport.ocrData.passportNumber}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Date of Birth</p>
                <p className="font-bold">{selectedPassport.ocrData.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Surname</p>
                <p className="font-bold">{selectedPassport.ocrData.surname}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Given Names</p>
                <p className="font-bold">{selectedPassport.ocrData.givenNames}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Expiry Date</p>
                <p className="font-bold">{selectedPassport.ocrData.dateOfExpiry}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Status</p>
                <div className={`badge ${
                  selectedPassport.status === 'verified' ? 'badge-success' :
                  selectedPassport.status === 'pending' ? 'badge-warning' : 'badge-error'
                }`}>
                  {selectedPassport.status}
                </div>
              </div>
            </div>

            {selectedPassport.status === 'pending' && (
              <div className="modal-action">
                <Button variant="error" onClick={() => handleStatusUpdate('rejected')}>
                  Reject
                </Button>
                <Button variant="success" onClick={() => handleStatusUpdate('verified')}>
                  Verify
                </Button>
              </div>
            )}
            <div className="modal-action">
               <Button variant="ghost" onClick={handleCloseModal}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
