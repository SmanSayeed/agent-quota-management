import cron from 'node-cron';
import { User } from '../models/User';

export const setupCronJobs = () => {
  // Run at 00:05 AM every day
  cron.schedule('5 0 * * *', async () => {
    console.log('Running daily reset cron job...');
    try {
      await User.updateMany({}, { todayPurchased: 0 });
      console.log('✅ Daily reset completed');
    } catch (error) {
      console.error('❌ Daily reset failed:', error);
    }
  });
};
