import { Response } from 'express';
import mongoose from 'mongoose';
import { CreditRequest } from '../models/CreditRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
// import { getIO } from '../socket';
import { sendSuccess, sendError } from '../utils';

export const requestCredit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user!._id;

    if (!amount || amount <= 0) {
      sendError(res, 'Invalid amount', 400, 'INVALID_AMOUNT');
      return;
    }

    if (!paymentMethod || !['bank_transfer', 'mobile_banking'].includes(paymentMethod)) {
      sendError(res, 'Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
      return;
    }

    if (!paymentDetails) {
      sendError(res, 'Payment details are required', 400, 'MISSING_PAYMENT_DETAILS');
      return;
    }

    const creditRequest = await CreditRequest.create({
      agentId: userId,
      amount,
      paymentMethod,
      paymentDetails: typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails,
      status: 'pending',
    });

    sendSuccess(res, creditRequest, 'Credit requested successfully', 201);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const getCreditRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const userRole = req.user!.role;

    let filter = {};

    if (userRole === 'superadmin') {
      // SuperAdmin sees requests from Agents
      const agents = await User.find({ role: 'agent' }).select('_id');
      const agentIds = agents.map(a => a._id);
      filter = { agentId: { $in: agentIds } };
    } else if (userRole === 'agent') {
      // Agent sees requests from their Children
      const children = await User.find({ parentAgentId: userId }).select('_id');
      const childIds = children.map(c => c._id);
      filter = { agentId: { $in: childIds } };
    } else {
      return sendError(res, 'Not authorized', 403);
    }

    const requests = await CreditRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('agentId', 'name phone role');

    sendSuccess(res, requests);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

export const approveCreditRequest = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { approvedAmount } = req.body;
    const approver = req.user!;

    const creditRequest = await CreditRequest.findById(id).session(session);
    if (!creditRequest) {
      throw new Error('Request not found');
    }

    if (creditRequest.status !== 'pending') {
      throw new Error('Request already processed');
    }

    // Use approved amount if provided, otherwise use requested amount
    const amountToApprove = approvedAmount || creditRequest.amount;

    if (amountToApprove <= 0) {
      throw new Error('Approved amount must be greater than 0');
    }

    const requester = await User.findById(creditRequest.agentId).session(session);
    if (!requester) {
        throw new Error('Requester not found');
    }

    // Logic for Agent approving Child
    if (approver.role === 'agent') {
        // Verify requester is a child of this agent
        if (requester.parentId?.toString() !== approver._id.toString()) {
            throw new Error('Not authorized to approve this request');
        }
        
        // Check balance
        if (approver.creditBalance < amountToApprove) {
            throw new Error('Insufficient credit balance');
        }

        // Deduct from Parent
        approver.creditBalance -= amountToApprove;
        await approver.save({ session });
    }

    creditRequest.status = 'approved';
    creditRequest.approvedBy = approver._id;

    // Add to Requester (Agent or Child)
    requester.creditBalance += amountToApprove;

    await creditRequest.save({ session });
    await requester.save({ session });

    await session.commitTransaction();

    // getIO().to(requester._id.toString()).emit('credit-balance-updated', { creditBalance: requester.creditBalance });

    sendSuccess(res, creditRequest, `Credit request approved with ${amountToApprove} BDT`);
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
