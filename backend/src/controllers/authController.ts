import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, clearToken } from '../utils';
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
         res.status(401).json({ message: 'Account is disabled' });
         return;
      }
      if (user.status === 'pending') {
         res.status(401).json({ message: 'Account is pending approval' });
         return;
      }

      generateToken(res, user._id, user.role);

      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        creditBalance: user.creditBalance,
        quotaBalance: user.quotaBalance,
      });
    } else {
      res.status(401).json({ message: 'Invalid phone or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new user (Agent)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({
      name,
      phone,
      password,
      role: 'agent',
      status: 'pending', // Agents need approval
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        message: 'Registration successful. Please wait for admin approval.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (_req: Request, res: Response) => {
  clearToken(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      creditBalance: user.creditBalance,
      quotaBalance: user.quotaBalance,
      dailyPurchaseLimit: user.dailyPurchaseLimit,
      todayPurchased: user.todayPurchased,
      parentId: user.parentId,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
