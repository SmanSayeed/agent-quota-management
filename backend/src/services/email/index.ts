import { IEmailService } from './IEmailService';
import { NodemailerEmailService } from './NodemailerEmailService';

/**
 * Email Service Factory
 * 
 * To switch from Nodemailer to another provider:
 * 1. Create a new class implementing IEmailService (e.g., SendGridEmailService)
 * 2. Update the getEmailService function to return your new implementation
 * 3. Update environment variables as needed
 * 
 * Example:
 * ```typescript
 * export const getEmailService = (): IEmailService => {
 *   return new SendGridEmailService(); // or any other provider
 * };
 * ```
 */
let emailServiceInstance: IEmailService | null = null;

export const getEmailService = (): IEmailService => {
  if (!emailServiceInstance) {
    // Change this line to switch email providers
    emailServiceInstance = new NodemailerEmailService();
  }
  return emailServiceInstance;
};

// Export the interface for type checking
export type { IEmailService };
