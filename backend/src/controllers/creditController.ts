import { Response } from 'express';
import mongoose from 'mongoose';
import { CreditRequest } from '../models/CreditRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';

export const requestCredit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user!._id;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount' });
      return;
    }

    const creditRequest = await CreditRequest.create({
      agentId: userId,
      amount,
      status: 'pending',
    });

    res.status(201).json(creditRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCreditRequests = async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await CreditRequest.find().sort({ createdAt: -1 }).populate('agentId', 'name phone');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

    getIO().to(agent._id.toString()).emit('credit-balance-updated', { creditBalance: agent.creditBalance });

    res.json(creditRequest);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
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
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (creditRequest.status !== 'pending') {
      res.status(400).json({ message: 'Request already processed' });
      return;
    }

    creditRequest.status = 'rejected';
    creditRequest.approvedBy = adminId;
    creditRequest.rejectionReason = reason;

    await creditRequest.save();

    res.json(creditRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
