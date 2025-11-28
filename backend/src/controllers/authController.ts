import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, clearToken, sendSuccess, sendError } from '../utils';
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
    const children = await User.find({ parentId: req.user!._id }).select('-password');
    sendSuccess(res, children);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
};

// @desc    Create a child agent directly
// @route   POST /api/auth/create-child
// @access  Private (Agent)
export const createChild = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, password } = req.body;
    const parentId = req.user!._id;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      sendError(res, 'User already exists', 400, 'USER_EXISTS');
      return;
    }

    const user = await User.create({
      name,
      phone,
      password,
      role: 'child',
      parentId,
      status: 'pending', // Must be approved by Admin
    });

    sendSuccess(res, user, 'Child agent created successfully. Waiting for admin approval.', 201);
  } catch (error) {
    sendError(res, 'Server error', 500, 'INTERNAL_ERROR');
  }
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


