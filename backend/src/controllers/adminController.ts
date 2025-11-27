import { Request, Response } from 'express';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { getIO } from '../socket';

export const getAgents = async (_req: Request, res: Response) => {
  try {
    const agents = await User.find({ role: 'agent' }).select('-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, dailyPurchaseLimit } = req.body;

    const agent = await User.findById(id);

    if (!agent) {
      res.status(404).json({ message: 'Agent not found' });
      return;
    }

    if (status) agent.status = status;
    if (dailyPurchaseLimit !== undefined) agent.dailyPurchaseLimit = dailyPurchaseLimit;

    await agent.save();

    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPool = async (_req: Request, res: Response) => {
  try {
    const pool = await Pool.findById('pool_singleton');
    res.json(pool);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePool = async (req: Request, res: Response) => {
  try {
    const { availableQuota } = req.body;
    
    const pool = await Pool.findById('pool_singleton');
    if (!pool) {
        res.status(404).json({ message: 'Pool not found' });
        return;
    }

    pool.availableQuota = availableQuota;
    await pool.save();

    getIO().emit('pool-updated', { availableQuota: pool.availableQuota });

    res.json(pool);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
