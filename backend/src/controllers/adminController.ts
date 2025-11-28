import { Request, Response } from 'express';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { getIO } from '../socket';
import { sendSuccess, sendError } from '../utils';

export const getAgents = async (_req: Request, res: Response) => {
  try {
    const agents = await User.find({ role: { $in: ['agent', 'child'] } }).select('-password');
    sendSuccess(res, agents);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const agent = await User.findById(id);

    if (!agent) {
      sendError(res, 'Agent not found', 404, 'AGENT_NOT_FOUND');
      return;
    }

    if (status) agent.status = status;

    await agent.save();

    sendSuccess(res, agent);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getPool = async (_req: Request, res: Response) => {
  try {
    const pool = await Pool.findById('pool_singleton');
    sendSuccess(res, pool);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const updatePool = async (req: Request, res: Response) => {
  try {
    const { availableQuota, dailyPurchaseLimit } = req.body;
    
    const pool = await Pool.findById('pool_singleton');
    if (!pool) {
        sendError(res, 'Pool not found', 404, 'POOL_NOT_FOUND');
        return;
    }

    if (availableQuota !== undefined) pool.availableQuota = availableQuota;
    if (dailyPurchaseLimit !== undefined) pool.dailyPurchaseLimit = dailyPurchaseLimit;
    await pool.save();

    getIO().to('pool-updates').emit('pool-updated', { availableQuota: pool.availableQuota });

    sendSuccess(res, pool);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};
