import { Response } from 'express';
import { QuotaRequest } from '../models/QuotaRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendSuccess, sendError } from '../utils';

// Child requests quota from parent
export const requestQuota = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const childId = req.user!._id;

    // Get child user to find parent
    const child = await User.findById(childId);
    if (!child || !child.parentId) {
      sendError(res, 'Parent agent not found', 404, 'PARENT_NOT_FOUND');
      return;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      sendError(res, 'Invalid amount', 400, 'INVALID_AMOUNT');
      return;
    }

    // Validate payment details
    if (!paymentMethod || !paymentDetails) {
      sendError(res, 'Payment details are required', 400, 'MISSING_PAYMENT_DETAILS');
      return;
    }

    // Create quota request
    const quotaRequest = await QuotaRequest.create({
      childId,
      parentId: child.parentId,
      amount,
      paymentMethod,
      paymentDetails,
      status: 'pending',
    });

    sendSuccess(res, quotaRequest, 'Quota request submitted successfully', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// Parent gets their quota requests
export const getQuotaRequests = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user!._id;

    const quotaRequests = await QuotaRequest.find({ parentId })
      .populate('childId', 'name phone')
      .sort({ createdAt: -1 });

    sendSuccess(res, quotaRequests);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// Parent approves quota request
export const approveQuotaRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parentId = req.user!._id;

    const quotaRequest = await QuotaRequest.findOne({ _id: id, parentId });

    if (!quotaRequest) {
      sendError(res, 'Quota request not found', 404, 'REQUEST_NOT_FOUND');
      return;
    }

    if (quotaRequest.status !== 'pending') {
      sendError(res, 'Request already processed', 400, 'ALREADY_PROCESSED');
      return;
    }

    const { approvedAmount } = req.body;
    const amountToApprove = approvedAmount ? Number(approvedAmount) : quotaRequest.amount;

    if (amountToApprove <= 0) {
      sendError(res, 'Approved amount must be greater than 0', 400, 'INVALID_AMOUNT');
      return;
    }

    // Get parent and child users
    const parent = await User.findById(parentId);
    const child = await User.findById(quotaRequest.childId);

    if (!parent || !child) {
      sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
      return;
    }

    // Check if parent has enough quota
    if (parent.quotaBalance < amountToApprove) {
      sendError(res, 'Insufficient quota balance', 400, 'INSUFFICIENT_QUOTA');
      return;
    }

    // Transfer quota
    parent.quotaBalance -= amountToApprove;
    child.quotaBalance += amountToApprove;

    await parent.save();
    await child.save();

    // Update request status and amount if changed
    quotaRequest.status = 'approved';
    if (approvedAmount) {
      quotaRequest.amount = amountToApprove;
    }
    await quotaRequest.save();

    sendSuccess(res, quotaRequest, 'Quota request approved successfully');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// Parent rejects quota request
export const rejectQuotaRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parentId = req.user!._id;

    const quotaRequest = await QuotaRequest.findOne({ _id: id, parentId });

    if (!quotaRequest) {
      sendError(res, 'Quota request not found', 404, 'REQUEST_NOT_FOUND');
      return;
    }

    if (quotaRequest.status !== 'pending') {
      sendError(res, 'Request already processed', 400, 'ALREADY_PROCESSED');
      return;
    }

    quotaRequest.status = 'rejected';
    await quotaRequest.save();

    sendSuccess(res, quotaRequest, 'Quota request rejected');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};
// Child gets their own quota requests
export const getMyQuotaRequests = async (req: AuthRequest, res: Response) => {
  try {
    const childId = req.user!._id;

    const quotaRequests = await QuotaRequest.find({ childId })
      .sort({ createdAt: -1 });

    sendSuccess(res, quotaRequests);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};
