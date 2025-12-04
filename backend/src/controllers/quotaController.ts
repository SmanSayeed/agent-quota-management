import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';
import { QuotaTransaction } from '../models/QuotaTransaction';
import { QuotaListing } from '../models/QuotaListing';
import { QuotaPurchase } from '../models/QuotaPurchase';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';
import { sendSuccess, sendError, sendPaginatedSuccess } from '../utils';

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
    await QuotaTransaction.create(transactions, { session, ordered: true });

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
    ], { session, ordered: true });

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
/**
 * Get quota transaction history for the logged-in agent
 */
export const getQuotaHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    
    const skip = (page - 1) * limit;
    const query: any = { agentId: userId };

    if (type && type !== 'all') {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      QuotaTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('childId', 'name phone'),
      QuotaTransaction.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, transactions, total, page, limit);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

/**
 * Create a quota listing for the marketplace
 */
export const createListing = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, pricePerQuota } = req.body;
    const userId = req.user!._id;
    
    if (!quantity || quantity <= 0) throw new Error('Invalid quantity');
    if (!pricePerQuota || pricePerQuota <= 0) throw new Error('Invalid price');

    // Deduct quota from agent
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, quotaBalance: { $gte: quantity } },
      { $inc: { quotaBalance: -quantity } },
      { session, new: true }
    );
    if (!updatedUser) throw new Error('Insufficient quota balance');

    const totalPrice = quantity * pricePerQuota;

    // Create listing
    const listing = await QuotaListing.create([{
      sellerId: userId,
      quantity,
      pricePerQuota,
      totalPrice,
      status: 'active',
    }], { session });

    await session.commitTransaction();

    // Emit socket update
    getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: updatedUser.quotaBalance });
    getIO().to('marketplace-updates').emit('listing-created', listing[0]);

    sendSuccess(res, listing[0], 'Listing created successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Get all active marketplace listings
 */
export const getMarketplace = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      QuotaListing.find({ status: 'active' })
        .populate('sellerId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuotaListing.countDocuments({ status: 'active' }),
    ]);

    sendPaginatedSuccess(res, listings, total, page, limit);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

/**
 * Get agent's own listings
 */
export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    
    const skip = (page - 1) * limit;
    const query: any = { sellerId: userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const [listings, total] = await Promise.all([
      QuotaListing.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuotaListing.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, listings, total, page, limit);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

/**
 * Cancel an active listing
 */
export const cancelListing = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const listing = await QuotaListing.findOne({
      _id: id,
      sellerId: userId,
      status: 'active',
    }).session(session);

    if (!listing) throw new Error('Listing not found or already sold/cancelled');

    // Return quota to agent
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { quotaBalance: listing.quantity } },
      { session, new: true }
    );

    // Update listing status
    listing.status = 'cancelled';
    await listing.save({ session });

    await session.commitTransaction();

    // Emit socket updates
    getIO().to(userId.toString()).emit('quota-balance-updated', { quotaBalance: updatedUser!.quotaBalance });
    getIO().to('marketplace-updates').emit('listing-cancelled', { listingId: id });

    sendSuccess(res, null, 'Listing cancelled successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Purchase quota from marketplace (creates pending purchase)
 */
export const purchaseFromMarketplace = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { listingId } = req.params;
    const userId = req.user!._id;

    const listing = await QuotaListing.findOne({
      _id: listingId,
      status: 'active',
    }).session(session);

    if (!listing) throw new Error('Listing not found or no longer available');
    if (listing.sellerId.toString() === userId.toString()) {
      throw new Error('Cannot purchase your own listing');
    }

    // Check if buyer has sufficient credit
    const buyer = await User.findById(userId).session(session);
    if (!buyer) throw new Error('User not found');
    if (buyer.creditBalance < listing.totalPrice) {
      throw new Error('Insufficient credit balance');
    }

    // Create pending purchase
    const purchase = await QuotaPurchase.create([{
      listingId: listing._id,
      buyerId: userId,
      sellerId: listing.sellerId,
      quantity: listing.quantity,
      pricePerQuota: listing.pricePerQuota,
      totalPrice: listing.totalPrice,
      status: 'pending',
    }], { session });

    // Update listing to mark it as having a pending purchase
    listing.purchaseId = purchase[0]._id;
    listing.status = 'sold'; // Temporarily mark as sold
    await listing.save({ session });

    await session.commitTransaction();

    // Emit socket updates
    getIO().to('marketplace-updates').emit('listing-purchased', { listingId: listing._id });
    getIO().to('admin-updates').emit('purchase-pending', purchase[0]);

    sendSuccess(res, purchase[0], 'Purchase request submitted, awaiting admin approval');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};



/**
 * Get total available quota in marketplace
 */
export const getMarketplaceTotalQuota = async (_req: any, res: Response) => {
  try {
    const result = await QuotaListing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalQuota: { $sum: '$quantity' } } }
    ]);

    const totalQuota = result.length > 0 ? result[0].totalQuota : 0;
    sendSuccess(res, { totalQuota }, 'Total marketplace quota retrieved');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
