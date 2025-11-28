import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';
import { QuotaTransaction } from '../models/QuotaTransaction';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';
import { sendSuccess, sendError } from '../utils';

/**
 * Purchase quota (normal + extra from pool)
 */
export const buyQuota = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity } = req.body;
    const userId = req.user!._id;
    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');

    // Load settings and user within the transaction
    const settings = await SystemSettings.findById('system_settings_singleton').session(session);
    if (!settings) throw new Error('Settings not found');
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const cost = quantity * settings.quotaPrice;
    if (user.creditBalance < cost) throw new Error('Insufficient credit balance');

    // Determine how much can be bought as normal quota
    const remainingDaily = Math.max(0, settings.dailyPurchaseLimit - user.todayPurchased);
    const normalQty = quantity <= remainingDaily ? quantity : remainingDaily;
    const extraQty = quantity - normalQty;

    // Update user atomically (credit and quota)
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, creditBalance: { $gte: cost } },
      { $inc: { quotaBalance: quantity, creditBalance: -cost, todayPurchased: normalQty } },
      { session, new: true }
    );
    if (!updatedUser) throw new Error('Insufficient credit balance or concurrent transaction failed');

    // If extra quota is needed, deduct from pool atomically
    let updatedPool = null as any;
    let poolBefore = 0;
    if (extraQty > 0) {
      const pool = await Pool.findById('pool_singleton').session(session);
      if (!pool) throw new Error('Pool not found');
      poolBefore = pool.availableQuota;
      updatedPool = await Pool.findOneAndUpdate(
        { _id: 'pool_singleton', availableQuota: { $gte: extraQty } },
        { $inc: { availableQuota: -extraQty } },
        { session, new: true }
      );
      if (!updatedPool) throw new Error('Insufficient pool quota for extra purchase');
    } else {
      const pool = await Pool.findById('pool_singleton').session(session);
      if (pool) poolBefore = pool.availableQuota;
      updatedPool = pool;
    }

    // Log transaction
    const transactions = [] as any[];
    const userBeforeQuota = user.quotaBalance;
    const userBeforeCredit = user.creditBalance;
    if (normalQty > 0) {
      transactions.push({
        type: 'normal',
        quantity: normalQty,
        agentId: userId,
        creditCost: normalQty * settings.quotaPrice,
        agentQuotaBefore: userBeforeQuota,
        agentQuotaAfter: userBeforeQuota + normalQty,
        agentCreditBefore: userBeforeCredit,
        agentCreditAfter: userBeforeCredit - normalQty * settings.quotaPrice,
        poolQuotaBefore: poolBefore,
        poolQuotaAfter: poolBefore,
      });
    }
    if (extraQty > 0) {
      const afterUserQuota = updatedUser.quotaBalance;
      const afterUserCredit = updatedUser.creditBalance;
      transactions.push({
        type: 'extraPool',
        quantity: extraQty,
        agentId: userId,
        creditCost: extraQty * settings.quotaPrice,
        agentQuotaBefore: userBeforeQuota + normalQty,
        agentQuotaAfter: afterUserQuota,
        agentCreditBefore: userBeforeCredit - normalQty * settings.quotaPrice,
        agentCreditAfter: afterUserCredit,
        poolQuotaBefore: poolBefore,
        poolQuotaAfter: updatedPool?.availableQuota ?? poolBefore,
      });
    }
    await QuotaTransaction.create(transactions, { session });

    await session.commitTransaction();

    // Emit socket updates
    if (updatedPool) {
      getIO().to('pool-updates').emit('pool-updated', { availableQuota: updatedPool.availableQuota });
    }
    getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: updatedUser.quotaBalance });
    getIO().to(userId.toString()).emit('credit-balance-updated', { creditBalance: updatedUser.creditBalance });

    sendSuccess(res, { normalQuantity: normalQty, extraQuantity: extraQty }, 'Quota purchased successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Transfer quota from an agent to a child agent
 */
export const transferToChild = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { childId, quantity } = req.body;
    const userId = req.user!._id;
    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');

    // Deduct from parent atomically
    const updatedParent = await User.findOneAndUpdate(
      { _id: userId, quotaBalance: { $gte: quantity } },
      { $inc: { quotaBalance: -quantity } },
      { session, new: true }
    );
    if (!updatedParent) throw new Error('Insufficient quota balance');

    // Add to child atomically (must belong to parent)
    const updatedChild = await User.findOneAndUpdate(
      { _id: childId, parentId: userId },
      { $inc: { quotaBalance: quantity } },
      { session, new: true }
    );
    if (!updatedChild) throw new Error('Child agent not found or not yours');

    // Log transaction
    const parentBefore = updatedParent.quotaBalance + quantity;
    await QuotaTransaction.create([
      {
        type: 'agentToChild',
        quantity,
        agentId: userId,
        childId,
        creditCost: 0,
        agentQuotaBefore: parentBefore,
        agentQuotaAfter: updatedParent.quotaBalance,
      },
    ], { session });

    await session.commitTransaction();

    // Emit update for parent (child does not receive realtime per spec)
    getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: updatedParent.quotaBalance });
    sendSuccess(res, null, 'Quota transferred successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Return unused quota from an agent back to the global pool (no credit refund)
 */
export const liveToPool = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity } = req.body;
    const userId = req.user!._id;
    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');

    // Deduct from agent
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, quotaBalance: { $gte: quantity } },
      { $inc: { quotaBalance: -quantity } },
      { session, new: true }
    );
    if (!updatedUser) throw new Error('Insufficient quota balance');

    // Add back to pool
    const updatedPool = await Pool.findByIdAndUpdate(
      'pool_singleton',
      { $inc: { availableQuota: quantity } },
      { session, new: true }
    );
    if (!updatedPool) throw new Error('Pool not found');

    // Log transaction
    const agentBefore = updatedUser.quotaBalance + quantity;
    const poolBefore = updatedPool.availableQuota - quantity;
    await QuotaTransaction.create([
      {
        type: 'liveToPool',
        quantity,
        agentId: userId,
        creditCost: 0,
        agentQuotaBefore: agentBefore,
        agentQuotaAfter: updatedUser.quotaBalance,
        poolQuotaBefore: poolBefore,
        poolQuotaAfter: updatedPool.availableQuota,
      },
    ], { session });

    await session.commitTransaction();

    // Emit updates
    getIO().to('pool-updates').emit('pool-updated', { availableQuota: updatedPool.availableQuota });
    getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: updatedUser.quotaBalance });
    sendSuccess(res, null, 'Quota returned to pool successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Get pool information (used by agents via /quota/pool endpoint)
 */
export const getPoolInfo = async (_req: AuthRequest, res: Response) => {
  try {
    const pool = await Pool.findById('pool_singleton');
    if (!pool) throw new Error('Pool not found');
    sendSuccess(res, pool);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};
