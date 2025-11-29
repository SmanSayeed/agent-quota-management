/**
 * Email Service Interface
 * This abstraction allows us to switch email providers without changing business logic
 */
export interface IEmailService {
  /**
   * Send an OTP email for email verification or password reset
   */
  sendOTPEmail(to: string, otp: string, type: 'registration' | 'password-reset'): Promise<void>;

  /**
   * Send a welcome email after successful registration
   */
  sendWelcomeEmail(to: string, name: string): Promise<void>;

  /**
   * Send password reset success notification
   */
  sendPasswordResetSuccessEmail(to: string, name: string): Promise<void>;
}
