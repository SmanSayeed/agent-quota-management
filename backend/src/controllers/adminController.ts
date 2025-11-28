import { Request, Response } from 'express';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';
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

// Pool Management (Quota only)
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
    const { availableQuota } = req.body;
    
    const pool = await Pool.findById('pool_singleton');
    if (!pool) {
        sendError(res, 'Pool not found', 404, 'POOL_NOT_FOUND');
        return;
    }

    if (availableQuota !== undefined) pool.availableQuota = availableQuota;
    await pool.save();

    getIO().to('pool-updates').emit('pool-updated', { availableQuota: pool.availableQuota });

    sendSuccess(res, pool);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// System Settings Management
export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.findById('system_settings_singleton');
    sendSuccess(res, settings);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { dailyPurchaseLimit, creditPrice, quotaPrice } = req.body;
    
    const settings = await SystemSettings.findById('system_settings_singleton');
    if (!settings) {
        sendError(res, 'Settings not found', 404, 'SETTINGS_NOT_FOUND');
        return;
    }

    if (dailyPurchaseLimit !== undefined) settings.dailyPurchaseLimit = dailyPurchaseLimit;
    if (creditPrice !== undefined) settings.creditPrice = creditPrice;
    if (quotaPrice !== undefined) settings.quotaPrice = quotaPrice;
    await settings.save();

    sendSuccess(res, settings);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const createSuperadmin = async (req: Request, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      sendError(res, 'User already exists', 400, 'USER_EXISTS');
      return;
    }

    const user = await User.create({
      name,
      phone,
      password,
      role: 'superadmin',
      status: 'active',
    });

    sendSuccess(res, user, 'Superadmin created successfully', 201);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};
