import { Request, Response } from 'express';
import { EmailVerification } from '../models/EmailVerification';
import { User } from '../models/User';
import { getEmailService } from '../services/email';
import { sendSuccess, sendError } from '../utils';

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP for registration (Step 1 of registration)
 * @route   POST /api/auth/send-registration-otp
 * @access  Public
 */
export const sendRegistrationOTP = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validate that all required fields are provided
    if (!name || !phone || !email || !password) {
      sendError(res, 'All fields are required', 400, 'MISSING_FIELDS');
      return;
    }

    // Check if phone already exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      sendError(res, 'Phone number already registered', 400, 'PHONE_EXISTS');
      return;
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      sendError(res, 'Email already registered', 400, 'EMAIL_EXISTS');
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing registration OTPs for this email or phone
    await EmailVerification.deleteMany({
      $or: [{ email: email.toLowerCase() }, { phone }],
      type: 'registration',
    });

    // Create new OTP record
    await EmailVerification.create({
      email: email.toLowerCase(),
      phone,
      otp,
      type: 'registration',
      expiresAt,
    });

    // Send OTP email
    const emailService = getEmailService();
    await emailService.sendOTPEmail(email, otp, 'registration');

    sendSuccess(
      res,
      { email: email.toLowerCase() },
      'OTP sent to your email. Please verify to complete registration.'
    );
  } catch (error) {
    console.error('Send registration OTP error:', error);
    sendError(res, 'Failed to send OTP. Please try again.', 500, 'SEND_OTP_FAILED');
  }
};

/**
 * @desc    Verify OTP and complete registration (Step 2 of registration)
 * @route   POST /api/auth/verify-and-register
 * @access  Public
 */
export const verifyAndRegister = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, otp, parentAgentId } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !password || !otp) {
      sendError(res, 'All fields including OTP are required', 400, 'MISSING_FIELDS');
      return;
    }

    // Find OTP record
    const otpRecord = await EmailVerification.findOne({
      email: email.toLowerCase(),
      phone,
      type: 'registration',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      sendError(res, 'Invalid or expired OTP', 400, 'INVALID_OTP');
      return;
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      sendError(res, 'Incorrect OTP', 400, 'INCORRECT_OTP');
      return;
    }

    // Double-check that user doesn't exist (race condition prevention)
    const userExists = await User.findOne({
      $or: [{ phone }, { email: email.toLowerCase() }],
    });

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

    // Create user
    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      emailVerified: true, // Email is verified via OTP
      password,
      role: parentAgentId ? 'child' : 'agent',
      parentId: parentAgentId || undefined,
      status: 'pending', // Still needs admin approval
    });

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Send welcome email
    const emailService = getEmailService();
    await emailService.sendWelcomeEmail(email, name);

    sendSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      'Registration successful! Your account is pending admin approval.',
      201
    );
  } catch (error) {
    console.error('Verify and register error:', error);
    sendError(res, 'Registration failed. Please try again.', 500, 'REGISTRATION_FAILED');
  }
};

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, 'Email is required', 400, 'MISSING_EMAIL');
      return;
    }

    // Find user by email (only agents and children can reset via email)
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ['agent', 'child'] },
    });

    // For security, don't reveal if email exists or not
    if (!user) {
      sendSuccess(
        res,
        null,
        'If an account exists with this email, an OTP has been sent.'
      );
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing password-reset OTPs for this email
    await EmailVerification.deleteMany({
      email: email.toLowerCase(),
      type: 'password-reset',
    });

    // Create new OTP record
    await EmailVerification.create({
      email: email.toLowerCase(),
      phone: user.phone,
      otp,
      type: 'password-reset',
      expiresAt,
    });

    // Send OTP email
    const emailService = getEmailService();
    await emailService.sendOTPEmail(email, otp, 'password-reset');

    sendSuccess(
      res,
      null,
      'If an account exists with this email, an OTP has been sent.'
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to send OTP. Please try again.', 500, 'SEND_OTP_FAILED');
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      sendError(res, 'Email, OTP, and new password are required', 400, 'MISSING_FIELDS');
      return;
    }

    // Find OTP record
    const otpRecord = await EmailVerification.findOne({
      email: email.toLowerCase(),
      type: 'password-reset',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      sendError(res, 'Invalid or expired OTP', 400, 'INVALID_OTP');
      return;
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      sendError(res, 'Incorrect OTP', 400, 'INCORRECT_OTP');
      return;
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: { $in: ['agent', 'child'] },
    });

    if (!user) {
      sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Send password reset success email
    const emailService = getEmailService();
    await emailService.sendPasswordResetSuccessEmail(email, user.name);

    sendSuccess(res, null, 'Password reset successful. You can now login with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Password reset failed. Please try again.', 500, 'RESET_PASSWORD_FAILED');
  }
};

/**
 * @desc    Resend OTP for registration or password reset
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      sendError(res, 'Email and type are required', 400, 'MISSING_FIELDS');
      return;
    }

    if (type !== 'registration' && type !== 'password-reset') {
      sendError(res, 'Invalid OTP type', 400, 'INVALID_TYPE');
      return;
    }

    // For registration, we don't need to check if user exists
    // For password-reset, check if user exists
    if (type === 'password-reset') {
      const user = await User.findOne({
        email: email.toLowerCase(),
        role: { $in: ['agent', 'child'] },
      });

      if (!user) {
        // Don't reveal if user exists
        sendSuccess(res, null, 'If an account exists with this email, an OTP has been sent.');
        return;
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email and type
    await EmailVerification.deleteMany({
      email: email.toLowerCase(),
      type,
    });

    // Get phone from previous attempt or leave empty
    const previousRecord = await EmailVerification.findOne({
      email: email.toLowerCase(),
      type,
    }).sort({ createdAt: -1 });

    // Create new OTP record
    await EmailVerification.create({
      email: email.toLowerCase(),
      phone: previousRecord?.phone || '',
      otp,
      type,
      expiresAt,
    });

    // Send OTP email
    const emailService = getEmailService();
    await emailService.sendOTPEmail(email, otp, type);

    sendSuccess(res, null, 'OTP resent successfully.');
  } catch (error) {
    console.error('Resend OTP error:', error);
    sendError(res, 'Failed to resend OTP. Please try again.', 500, 'RESEND_OTP_FAILED');
  }
};
