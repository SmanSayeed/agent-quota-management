import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';

export const runDatabaseSeed = async () => {
  try {
    console.log('🌱 Running database seed checks...');

    // Create default superadmin if doesn't exist
    const superadminExists = await User.findOne({ role: 'superadmin' });
    if (!superadminExists) {
      await User.create({
        name: 'Super Admin',
        phone: '01700000000',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'superadmin',
        status: 'active',
        creditBalance: 0,
        quotaBalance: 0,
      });
      console.log('✅ Default superadmin created (Phone: 01700000000, Password: admin123)');
    }

    // Create pool if doesn't exist
    const poolExists = await Pool.findById('pool_singleton');
    if (!poolExists) {
      await Pool.create({
        _id: 'pool_singleton',
        availableQuota: 10000,
      });
      console.log('✅ Pool created with 10000 quota');
    }

    // Create system settings if doesn't exist
    const settingsExists = await SystemSettings.findById('system_settings_singleton');
    if (!settingsExists) {
      await SystemSettings.create({
        _id: 'system_settings_singleton',
        dailyPurchaseLimit: 100,
        creditPrice: 1,
        quotaPrice: 20,
      });
      console.log('✅ System settings created');
    }

    console.log('✅ Database seed check completed');
  } catch (error) {
    console.error('❌ Error in database seed:', error);
  }
};
