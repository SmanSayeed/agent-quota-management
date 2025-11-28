import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { QuotaTransaction } from '../models/QuotaTransaction';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';
import { sendSuccess, sendError } from '../utils';

export const buyNormalQuota = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantity } = req.body;
    const userId = req.user!._id;

    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const pool = await Pool.findById('pool_singleton').session(session);
    if (!pool) throw new Error('Pool not found');

    // Check against global daily limit
    if (user.todayPurchased + quantity > pool.dailyPurchaseLimit) {
      throw new Error('Daily purchase limit exceeded');
    }

    const cost = quantity * 20;
    if (user.creditBalance < cost) throw new Error('Insufficient credit balance');
    if (pool.availableQuota < quantity) throw new Error('Insufficient pool quota');

    const agentQuotaBefore = user.quotaBalance;
    const agentCreditBefore = user.creditBalance;
    const poolQuotaBefore = pool.availableQuota;

    user.quotaBalance += quantity;
    user.todayPurchased += quantity;
    user.creditBalance -= cost;
    pool.availableQuota -= quantity;

    await user.save({ session });
    await pool.save({ session });

    await QuotaTransaction.create([{
      type: 'normal',
      quantity,
      agentId: userId,
      creditCost: cost,
      agentQuotaBefore,
      agentQuotaAfter: user.quotaBalance,
      agentCreditBefore,
      agentCreditAfter: user.creditBalance,
      poolQuotaBefore,
      poolQuotaAfter: pool.availableQuota,
    }], { session });

    await session.commitTransaction();

    getIO().to('pool-updates').emit('pool-updated', { availableQuota: pool.availableQuota });
    // getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: user.quotaBalance });
    // getIO().to(userId.toString()).emit('credit-balance-updated', { creditBalance: user.creditBalance });

    sendSuccess(res, null, 'Quota purchased successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

export const buyExtraQuota = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantity } = req.body;
    const userId = req.user!._id;

    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const pool = await Pool.findById('pool_singleton').session(session);
    if (!pool) throw new Error('Pool not found');

    // Check if user has exhausted their daily limit
    if (user.todayPurchased < pool.dailyPurchaseLimit) {
        throw new Error('You must exhaust your daily limit first');
    }

    const cost = quantity * 20;
    if (user.creditBalance < cost) throw new Error('Insufficient credit balance');
    if (pool.availableQuota < quantity) throw new Error('Insufficient pool quota');

    const agentQuotaBefore = user.quotaBalance;
    const agentCreditBefore = user.creditBalance;
    const poolQuotaBefore = pool.availableQuota;

    user.quotaBalance += quantity;
    user.creditBalance -= cost;
    pool.availableQuota -= quantity;

    await user.save({ session });
    await pool.save({ session });

    await QuotaTransaction.create([{
      type: 'extraPool',
      quantity,
      agentId: userId,
      creditCost: cost,
      agentQuotaBefore,
      agentQuotaAfter: user.quotaBalance,
      agentCreditBefore,
      agentCreditAfter: user.creditBalance,
      poolQuotaBefore,
      poolQuotaAfter: pool.availableQuota,
    }], { session });

    await session.commitTransaction();

    getIO().to('pool-updates').emit('pool-updated', { availableQuota: pool.availableQuota });
    // getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: user.quotaBalance });
    // getIO().to(userId.toString()).emit('credit-balance-updated', { creditBalance: user.creditBalance });

    sendSuccess(res, null, 'Extra quota purchased successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

export const transferToChild = async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { childId, quantity } = req.body;
      const userId = req.user!._id;
  
      if (!quantity || quantity <= 0) throw new Error('Invalid quantity');
  
      const agent = await User.findById(userId).session(session);
      const child = await User.findById(childId).session(session);
  
      if (!agent || !child) throw new Error('User not found');
      if (child.parentId?.toString() !== userId.toString()) throw new Error('Not your child agent');
  
      if (agent.quotaBalance < quantity) throw new Error('Insufficient quota balance');
  
      const agentQuotaBefore = agent.quotaBalance;
      
      agent.quotaBalance -= quantity;
      child.quotaBalance += quantity;
  
      await agent.save({ session });
      await child.save({ session });
  
      await QuotaTransaction.create([{
        type: 'agentToChild',
        quantity,
        agentId: userId,
        childId: childId,
        creditCost: 0,
        agentQuotaBefore,
        agentQuotaAfter: agent.quotaBalance,
      }], { session });
  
      await session.commitTransaction();
  
      // getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: agent.quotaBalance });
      // getIO().to(childId.toString()).emit('quota-balance-updated', { quotaBalance: child.quotaBalance });
  
      sendSuccess(res, null, 'Quota transferred successfully');
    } catch (error: any) {
      await session.abortTransaction();
      sendError(res, error.message, 400);
    } finally {
      session.endSession();
    }
};

export const liveToPool = async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { quantity } = req.body;
      const userId = req.user!._id;
  
      if (!quantity || quantity <= 0) throw new Error('Invalid quantity');
  
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');
  
      if (user.quotaBalance < quantity) throw new Error('Insufficient quota balance');
  
      const pool = await Pool.findById('pool_singleton').session(session);
      if (!pool) throw new Error('Pool not found');
  
      const agentQuotaBefore = user.quotaBalance;
      const poolQuotaBefore = pool.availableQuota;
  
      user.quotaBalance -= quantity;
      pool.availableQuota += quantity;
  
      await user.save({ session });
      await pool.save({ session });
  
      await QuotaTransaction.create([{
        type: 'liveToPool',
        quantity,
        agentId: userId,
        creditCost: 0,
        agentQuotaBefore,
        agentQuotaAfter: user.quotaBalance,
        poolQuotaBefore,
        poolQuotaAfter: pool.availableQuota,

      }], { session });
  
      await session.commitTransaction();
  
      getIO().to('pool-updates').emit('pool-updated', { availableQuota: pool.availableQuota });
      // getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: user.quotaBalance });
  
      sendSuccess(res, null, 'Quota returned to pool successfully');
    } catch (error: any) {
      await session.abortTransaction();
      sendError(res, error.message, 400);
    } finally {
      session.endSession();
    }
};
