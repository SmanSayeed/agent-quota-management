import cron from 'node-cron';
import { User } from '../models/User';

export const setupCronJobs = () => {
  // Reset todayPurchased at 00:05 AM every day
  cron.schedule('5 0 * * *', async () => {
    try {
      console.log('🕐 Running daily reset job...');
      await User.updateMany(
        { role: 'agent' },
        { $set: { todayPurchased: 0 } }
      );
      console.log('✅ Daily reset completed');
    } catch (error) {
      console.error('❌ Daily reset error:', error);
    }
  }, {
    timezone: 'Asia/Dhaka' // Adjust to your timezone
  });

  console.log('⏰ Cron jobs scheduled');
};
