import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, clearToken, sendSuccess, sendError, sendPaginatedSuccess } from '../utils';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'disabled') {
         sendError(res, 'Account is disabled', 401, 'ACCOUNT_DISABLED');
         return;
      }
      if (user.status === 'pending') {
         sendError(res, 'Account is pending approval', 401, 'ACCOUNT_PENDING');
         return;
      }

      generateToken(res, user._id, user.role);

      sendSuccess(
        res,
        {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          creditBalance: user.creditBalance,
          quotaBalance: user.quotaBalance,
          todayPurchased: user.todayPurchased,
        },
        'Login successful'
      );
    } else {
      sendError(res, 'Invalid phone or password', 401, 'INVALID_CREDENTIALS');
    }
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// @desc    Register a new user (Agent)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, parentAgentId } = req.body;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      sendError(res, 'User already exists', 400, 'USER_EXISTS');
      return;
    }

    // If parentAgentId is provided, verify it exists and is an agent
    if (parentAgentId) {
      const parentAgent = await User.findById(parentAgentId);
      if (!parentAgent || parentAgent.role !== 'agent') {
        sendError(res, 'Invalid Parent Agent ID', 400, 'INVALID_PARENT_AGENT');
        return;
      }
    }

    const user = await User.create({
      name,
      phone,
      password,
      role: parentAgentId ? 'child' : 'agent',
      parentId: parentAgentId || undefined,
      status: 'pending', // All new registrations need approval
    });

    if (user) {
      sendSuccess(
        res,
        {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
        'Registration successful. Please wait for admin approval.',
        201
      );
    } else {
      sendError(res, 'Invalid user data', 400, 'INVALID_DATA');
    }
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (_req: Request, res: Response) => {
  clearToken(res);
  sendSuccess(res, null, 'Logged out successfully');
};

// @desc    Get logged in agent's children
// @route   GET /api/auth/my-children
// @access  Private (Agent)
export const getMyChildren = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const name = req.query.name as string;
    const phone = req.query.phone as string;

    const query: any = { parentId: req.user!._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [children, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    sendPaginatedSuccess(res, children, total, page, limit);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// @desc    Create a child agent directly - DEPRECATED
// @note    This function is deprecated. Agents should use the new email-based registration flow
//          with parentAgentId: /api/auth/send-registration-otp + /api/auth/verify-and-register
// @route   POST /api/auth/create-child (kept for backward compatibility)
// @access  Private (Agent)
export const createChild = async (_req: AuthRequest, res: Response) => {
  sendError(
    res,
    'This endpoint is deprecated. Please use the new email-based registration flow with parentAgentId parameter.',
    410,
    'ENDPOINT_DEPRECATED'
  );
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (user) {
    sendSuccess(res, {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
      creditBalance: user.creditBalance,
      quotaBalance: user.quotaBalance,
      todayPurchased: user.todayPurchased,
      parentId: user.parentId,
    });
  } else {
    sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
  }
};


