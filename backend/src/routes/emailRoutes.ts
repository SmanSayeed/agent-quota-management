import express from 'express';
import {
  sendRegistrationOTP,
  verifyAndRegister,
  forgotPassword,
  resetPassword,
  resendOTP,
} from '../controllers/emailController';
import { validate } from '../middleware/validationMiddleware';
import {
  sendRegistrationOTPSchema,
  verifyAndRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOTPSchema,
} from '../validators/emailValidators';

const router: express.Router = express.Router();

// Registration flow (email-based)
router.post('/send-registration-otp', validate(sendRegistrationOTPSchema), sendRegistrationOTP);
router.post('/verify-and-register', validate(verifyAndRegisterSchema), verifyAndRegister);

// Password reset flow
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Resend OTP
router.post('/resend-otp', validate(resendOTPSchema), resendOTP);

export default router;
