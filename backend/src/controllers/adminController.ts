import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';
import { QuotaListing } from '../models/QuotaListing';
import { QuotaPurchase } from '../models/QuotaPurchase';
import { QuotaTransaction } from '../models/QuotaTransaction';
import { getIO } from '../socket';
import { sendSuccess, sendError, sendPaginatedSuccess } from '../utils';

export const getAgents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const name = req.query.name as string;
    const phone = req.query.phone as string;
    const email = req.query.email as string;

    const query: any = { role: { $in: ['agent', 'child'] } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, agents, total, page, limit);
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

export const getSuperAdmins = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const query: any = { role: 'superadmin' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [superAdmins, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, superAdmins, total, page, limit);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const updateSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, password, status } = req.body;

    const user = await User.findById(id);

    if (!user) {
      sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
      return;
    }

    if (user.role !== 'superadmin') {
      sendError(res, 'User is not a superadmin', 400, 'INVALID_ROLE');
      return;
    }

    // Check if phone/email is taken by another user
    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: id } });
      if (exists) {
        sendError(res, 'Phone number already in use', 400, 'PHONE_EXISTS');
        return;
      }
    }

    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: id } });
      if (exists) {
        sendError(res, 'Email already in use', 400, 'EMAIL_EXISTS');
        return;
      }
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (status) user.status = status;
    if (password) user.password = password;

    await user.save();

    sendSuccess(res, user, 'Superadmin updated successfully');
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const deleteSuperAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (id === currentUserId.toString()) {
      sendError(res, 'You cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
      return;
    }

    if (user.role !== 'superadmin') {
      sendError(res, 'User is not a superadmin', 400, 'INVALID_ROLE');
      return;
    }

    await User.findByIdAndDelete(id);

    sendSuccess(res, null, 'Superadmin deleted successfully');
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Get all pending purchase requests from marketplace
 */
export const getPendingPurchases = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      QuotaPurchase.find({ status: 'pending' })
        .populate('buyerId', 'name phone email creditBalance')
        .populate('sellerId', 'name phone email quotaBalance')
        .populate('listingId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuotaPurchase.countDocuments({ status: 'pending' }),
    ]);

    sendPaginatedSuccess(res, purchases, total, page, limit);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Approve a marketplace purchase
 */
export const approvePurchase = async (req: any, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const purchase = await QuotaPurchase.findOne({
      _id: id,
      status: 'pending',
    }).session(session);

    if (!purchase) throw new Error('Purchase not found or already processed');

    // Deduct credits from buyer
    const buyer = await User.findOneAndUpdate(
      { _id: purchase.buyerId, creditBalance: { $gte: purchase.totalPrice } },
      { $inc: { creditBalance: -purchase.totalPrice, quotaBalance: purchase.quantity } },
      { session, new: true }
    );
    if (!buyer) throw new Error('Buyer has insufficient credits');

    // Add credits to seller
    const seller = await User.findByIdAndUpdate(
      purchase.sellerId,
      { $inc: { creditBalance: purchase.totalPrice } },
      { session, new: true }
    );
    if (!seller) throw new Error('Seller not found');

    // Update purchase status
    purchase.status = 'approved';
    purchase.approvedBy = adminId;
    purchase.approvedAt = new Date();
    await purchase.save({ session });

    // Create transaction records for both buyer and seller
    const buyerBefore = buyer.quotaBalance - purchase.quantity;
    const buyerCreditBefore = buyer.creditBalance + purchase.totalPrice;
    const sellerCreditBefore = seller.creditBalance - purchase.totalPrice;

    await QuotaTransaction.create([
      {
        type: 'marketplaceSale',
        quantity: purchase.quantity,
        agentId: purchase.buyerId,
        sellerId: purchase.sellerId,
        purchaseId: purchase._id,
        creditCost: purchase.totalPrice,
        agentQuotaBefore: buyerBefore,
        agentQuotaAfter: buyer.quotaBalance,
        agentCreditBefore: buyerCreditBefore,
        agentCreditAfter: buyer.creditBalance,
      },
      {
        type: 'marketplaceSale',
        quantity: purchase.quantity,
        agentId: purchase.sellerId,
        sellerId: purchase.sellerId,
        purchaseId: purchase._id,
        creditCost: purchase.totalPrice,
        agentQuotaBefore: seller.quotaBalance,
        agentQuotaAfter: seller.quotaBalance,
        agentCreditBefore: sellerCreditBefore,
        agentCreditAfter: seller.creditBalance,
      },
    ], { session, ordered: true });

    await session.commitTransaction();

    // Emit socket updates
    getIO().to(purchase.buyerId.toString()).emit('quota-balance-updated', { quotaBalance: buyer.quotaBalance });
    getIO().to(purchase.buyerId.toString()).emit('credit-balance-updated', { creditBalance: buyer.creditBalance });
    getIO().to(purchase.sellerId.toString()).emit('credit-balance-updated', { creditBalance: seller.creditBalance });
    getIO().to('admin-updates').emit('purchase-approved', { purchaseId: id });

    sendSuccess(res, purchase, 'Purchase approved successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Reject a marketplace purchase
 */
export const rejectPurchase = async (req: any, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const purchase = await QuotaPurchase.findOne({
      _id: id,
      status: 'pending',
    }).session(session);

    if (!purchase) throw new Error('Purchase not found or already processed');

    // Get the listing and return it to active status
    const listing = await QuotaListing.findById(purchase.listingId).session(session);
    if (listing) {
      // CRITICAL FIX: Return quota to seller
      const seller = await User.findByIdAndUpdate(
        listing.sellerId,
        { $inc: { quotaBalance: listing.quantity } },
        { session, new: true }
      );
      
      if (!seller) throw new Error('Seller not found');
      
      listing.status = 'active';
      listing.purchaseId = undefined;
      await listing.save({ session });
      
      // Emit quota update to seller
      getIO().to(listing.sellerId.toString()).emit('quota-balance-updated', { 
        quotaBalance: seller.quotaBalance 
      });
    }

    // Update purchase status
    purchase.status = 'rejected';
    purchase.approvedBy = adminId;
    purchase.approvedAt = new Date();
    purchase.rejectionReason = reason || 'No reason provided';
    await purchase.save({ session });

    await session.commitTransaction();

    // Emit socket updates
    getIO().to('marketplace-updates').emit('listing-available', { listingId: purchase.listingId });
    getIO().to('admin-updates').emit('purchase-rejected', { purchaseId: id });

    sendSuccess(res, purchase, 'Purchase rejected successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

/**
 * Reset daily quotas for all agents (allocate free daily quota and cancel active listings)
 */
export const resetDailyQuotas = async (_req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Get system settings for daily quota allocation
    const settings = await SystemSettings.findById('system_settings_singleton').session(session);
    if (!settings) throw new Error('Settings not found');

    // Allocate daily quota to all agents (set quotaBalance to dailyPurchaseLimit)
    await User.updateMany(
      { role: { $in: ['agent', 'child'] } },
      { $set: { quotaBalance: settings.dailyPurchaseLimit } },
      { session }
    );

    // Cancel all active listings
    await QuotaListing.updateMany(
      { status: 'active' },
      { $set: { status: 'cancelled' } },
      { session }
    );

    await session.commitTransaction();

    // Emit socket update to all users
    getIO().emit('daily-quota-reset', { dailyQuota: settings.dailyPurchaseLimit });

    sendSuccess(res, { dailyQuota: settings.dailyPurchaseLimit }, 'Daily quotas allocated successfully');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 500);
  } finally {
    session.endSession();
  }
};

