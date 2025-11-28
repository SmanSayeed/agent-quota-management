import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Pool } from '../models/Pool';
import { SystemSettings } from '../models/SystemSettings';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agent-management');
    console.log('✅ Connected to MongoDB');

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
    } else {
      console.log('ℹ️  Superadmin already exists');
    }

    // Create pool if doesn't exist
    const poolExists = await Pool.findById('pool_singleton');
    if (!poolExists) {
      await Pool.create({
        _id: 'pool_singleton',
        availableQuota: 10000,
      });
      console.log('✅ Pool created with 10000 quota');
    } else {
      console.log('ℹ️  Pool already exists');
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
    } else {
      console.log('ℹ️  System settings already exist');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
