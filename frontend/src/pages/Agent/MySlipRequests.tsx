import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

interface Passport {
  _id: string;
  ocrData: any;
  status: string;
  createdAt: string;
}

export default function MySlipRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: myPassports, isLoading } = useQuery({
    queryKey: ['myPassports'],
    queryFn: async () => {
      const { data } = await api.get('/passport/my-passports');
      return data.data as Passport[];
    },
  });

  const handleAddSlipRequest = () => {
    const route = user?.role === 'child' ? '/child/slip-request' : '/agent/slip-request';
    navigate(route);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Slip Requests</h1>
        <Button onClick={handleAddSlipRequest}>
          Add Slip Request
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Passport Number</th>
                  <th>Name</th>
                  <th>Date Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {myPassports?.map((p) => (
                  <tr key={p._id}>
                    <td>{p.ocrData?.passportNumber || 'N/A'}</td>
                    <td>{p.ocrData?.givenNames} {p.ocrData?.surname}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {myPassports?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center">
                      No slip requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
