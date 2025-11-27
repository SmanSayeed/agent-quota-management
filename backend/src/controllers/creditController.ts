import { Response } from 'express';
import mongoose from 'mongoose';
import { CreditRequest } from '../models/CreditRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
// import { getIO } from '../socket';
import { sendSuccess, sendError } from '../utils';

export const requestCredit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user!._id;

    if (!amount || amount <= 0) {
      sendError(res, 'Invalid amount', 400, 'INVALID_AMOUNT');
      return;
    }

    const creditRequest = await CreditRequest.create({
      agentId: userId,
      amount,
      status: 'pending',
    });

    sendSuccess(res, creditRequest, 'Credit requested successfully', 201);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getCreditRequests = async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await CreditRequest.find().sort({ createdAt: -1 }).populate('agentId', 'name phone');
    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const approveCreditRequest = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.user!._id;

    const creditRequest = await CreditRequest.findById(id).session(session);
    if (!creditRequest) {
      throw new Error('Request not found');
    }

    if (creditRequest.status !== 'pending') {
      throw new Error('Request already processed');
    }

    creditRequest.status = 'approved';
    creditRequest.approvedBy = adminId;

    const agent = await User.findById(creditRequest.agentId).session(session);
    if (!agent) {
        throw new Error('Agent not found');
    }

    agent.creditBalance += creditRequest.amount;

    await creditRequest.save({ session });
    await agent.save({ session });

    await session.commitTransaction();

    // getIO().to(agent._id.toString()).emit('credit-balance-updated', { creditBalance: agent.creditBalance });

    sendSuccess(res, creditRequest, 'Credit request approved');
  } catch (error: any) {
    await session.abortTransaction();
    sendError(res, error.message, 400);
  } finally {
    session.endSession();
  }
};

export const rejectCreditRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!._id;

    const creditRequest = await CreditRequest.findById(id);
    if (!creditRequest) {
      sendError(res, 'Request not found', 404, 'REQUEST_NOT_FOUND');
      return;
    }

    if (creditRequest.status !== 'pending') {
      sendError(res, 'Request already processed', 400, 'ALREADY_PROCESSED');
      return;
    }

    creditRequest.status = 'rejected';
    creditRequest.approvedBy = adminId;
    creditRequest.rejectionReason = reason;

    await creditRequest.save();

    sendSuccess(res, creditRequest, 'Credit request rejected');
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};
