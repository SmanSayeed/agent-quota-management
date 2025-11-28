import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

interface Passport {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    role: string;
  };
  imagePath: string;
  ocrData: any;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export default function Passports() {
  const queryClient = useQueryClient();
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const { data: passports, isLoading } = useQuery({
    queryKey: ['passports'],
    queryFn: async () => {
      const { data } = await api.get('/passport');
      return data.data as Passport[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.put(`/passport/${id}`, { ocrData: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passports'] });
      toast.success('Passport updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to update passport');
    },
  });

  const handleView = async (passport: Passport) => {
    setSelectedPassport(passport);
    setEditData(passport.ocrData || {});
    try {
      const { data } = await api.get(`/passport/image-token/${passport._id}`);
      const token = data.data.token;
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passport/serve/${token}`;
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to get image token', error);
      toast.error('Failed to load image');
    }
  };

  const handleCloseModal = () => {
    setSelectedPassport(null);
    setImageUrl(null);
    setEditData(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (selectedPassport) {
      updateMutation.mutate({ id: selectedPassport._id, data: editData });
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
      <h1 className="text-3xl font-bold">Passport Management</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Passport Info</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {passports?.map((passport) => (
                <tr key={passport._id}>
                  <td>
                    <div>
                      <div className="font-bold">{passport.userId?.name || 'Unknown'}</div>
                      <div className="text-sm opacity-50">{passport.userId?.role}</div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>No: {passport.ocrData?.passportNumber || 'N/A'}</div>
                      <div>Name: {passport.ocrData?.givenNames} {passport.ocrData?.surname}</div>
                    </div>
                  </td>
                  <td>{new Date(passport.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button size="sm" variant="info" onClick={() => handleView(passport)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
              {passports?.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    No passports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manage Modal */}
      <Modal
        isOpen={!!selectedPassport}
        onClose={handleCloseModal}
        title="Manage Passport"
        className="w-11/12 max-w-7xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Image */}
          <div className="border rounded-lg overflow-hidden bg-base-200 flex justify-center items-center p-4 min-h-[500px] h-full">
            {imageUrl ? (
              <img src={imageUrl} alt="Passport" className="max-w-full max-h-[700px] object-contain" />
            ) : (
              <span className="loading loading-spinner loading-lg"></span>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="space-y-4 h-full overflow-y-auto">
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-bold mb-4 text-lg">Passport Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Passport Number</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.passportNumber || ''} 
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Nationality</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.nationality || ''} 
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Surname</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.surname || ''} 
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Given Names</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.givenNames || ''} 
                    onChange={(e) => handleInputChange('givenNames', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Date of Birth</span></label>
                  <input 
                    type="date" 
                    className="input input-bordered" 
                    value={editData?.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : ''} 
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Sex</span></label>
                  <select 
                    className="select select-bordered w-full"
                    value={editData?.sex || ''} 
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Date of Expiry</span></label>
                  <input 
                    type="date" 
                    className="input input-bordered" 
                    value={editData?.dateOfExpiry ? new Date(editData.dateOfExpiry).toISOString().split('T')[0] : ''} 
                    onChange={(e) => handleInputChange('dateOfExpiry', e.target.value)}
                  />
                </div>
                 <div className="form-control">
                  <label className="label"><span className="label-text">Date of Issue</span></label>
                  <input 
                    type="date" 
                    className="input input-bordered" 
                    value={editData?.dateOfIssue ? new Date(editData.dateOfIssue).toISOString().split('T')[0] : ''} 
                    onChange={(e) => handleInputChange('dateOfIssue', e.target.value)}
                  />
                </div>
                 <div className="form-control">
                  <label className="label"><span className="label-text">Place of Birth</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.placeOfBirth || ''} 
                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                  />
                </div>
                 <div className="form-control">
                  <label className="label"><span className="label-text">Authority</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={editData?.authority || ''} 
                    onChange={(e) => handleInputChange('authority', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-action justify-end mt-6">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
