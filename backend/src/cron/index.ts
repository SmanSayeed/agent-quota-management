import cron from 'node-cron';


export const setupCronJobs = () => {
  // Run at 00:05 AM every day
  cron.schedule('5 0 * * *', async () => {
    console.log('Running daily reset cron job...');
    // Daily purchase limit reset is no longer needed
    console.log('✅ Daily reset completed');
  });
};
