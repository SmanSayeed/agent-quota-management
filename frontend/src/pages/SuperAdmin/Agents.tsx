import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

interface Agent {
  _id: string;
  name: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'disabled';
  creditBalance: number;
  quotaBalance: number;
  dailyPurchaseLimit: number;
  todayPurchased: number;
}

const updateAgentSchema = z.object({
  status: z.enum(['pending', 'active', 'disabled']),
});

type UpdateAgentInputs = z.infer<typeof updateAgentSchema>;

export default function Agents() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await api.get('/admin/agents');
      return data.data as Agent[];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAgentInputs>({
    resolver: zodResolver(updateAgentSchema),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAgentInputs) => {
      if (!selectedAgent) return;
      await api.put(`/admin/agents/${selectedAgent._id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    reset({
      status: agent.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };

  const onSubmit = (data: UpdateAgentInputs) => {
    updateMutation.mutate(data);
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
      <h1 className="text-3xl font-bold">Agents Management</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Quota</th>
                <th>Daily Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents?.map((agent) => (
                <tr key={agent._id}>
                  <td>
                    <div className="font-bold">{agent.name}</div>
                  </td>
                  <td>{agent.phone}</td>
                  <td>
                    <div
                      className={`badge ${
                        agent.status === 'active'
                          ? 'badge-success'
                          : agent.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {agent.status}
                    </div>
                  </td>
                  <td>{agent.creditBalance}</td>
                  <td>{agent.quotaBalance}</td>
                  <td>
                    {agent.todayPurchased} / {agent.dailyPurchaseLimit}
                  </td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(agent)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {agents?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Edit Agent: ${selectedAgent?.name}`}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="disabled">Disabled</option>
            </select>
            {errors.status && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.status.message}</span>
              </label>
            )}
          </div>



          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
