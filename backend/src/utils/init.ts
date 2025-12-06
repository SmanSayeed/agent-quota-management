import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';
import { User } from '../models/User';

export const initializePool = async () => {
  try {
    // Initialize Pool singleton
    const pool = await Pool.findById('pool_singleton');
    if (!pool) {
      await Pool.create({
        _id: 'pool_singleton',
        availableQuota: 0,
      });
      console.log('✅ Pool singleton initialized');
    }
    
    // Initialize SystemSettings singleton
    const settings = await SystemSettings.findById('system_settings_singleton');
    if (!settings) {
      await SystemSettings.create({
        _id: 'system_settings_singleton',
        dailyFreeQuota: 100,
        creditPrice: 1,
        quotaPrice: 20,
      });
      console.log('✅ SystemSettings singleton initialized');
    }
    
    // Create default superadmin
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      await User.create({
        name: 'Super Admin',
        phone: '01700000000',
        password: 'password123',
        role: 'superadmin',
        status: 'active',
      });
      console.log('✅ Default superadmin created (01700000000 / password123)');
    }
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
};
