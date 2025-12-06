import { User } from '../models/User';
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

    // Create system settings if doesn't exist
    const settingsExists = await SystemSettings.findById('system_settings_singleton');
    if (!settingsExists) {
      await SystemSettings.create({
        _id: 'system_settings_singleton',
        dailyFreeQuota: 100, // Free daily quota allocation
        creditPrice: 1,
        quotaPrice: 20, // Price for marketplace trading
      });
      console.log('✅ System settings created (Daily allocation: 100 quota)');
    }

    // Create Agent 1
    const agent1Exists = await User.findOne({ phone: '01700000001' });
    let agent1Id;
    if (!agent1Exists) {
      const agent1 = await User.create({
        name: 'Agent One',
        phone: '01700000001',
        password: 'password123',
        role: 'agent',
        status: 'active',
        creditBalance: 1000,
        quotaBalance: 100, // Daily free quota
      });
      agent1Id = agent1._id;
      console.log('✅ Agent 1 created (Phone: 01700000001, Password: password123)');
    } else {
      agent1Id = agent1Exists._id;
    }

    // Create Agent 2
    const agent2Exists = await User.findOne({ phone: '01700000002' });
    if (!agent2Exists) {
      await User.create({
        name: 'Agent Two',
        phone: '01700000002',
        password: 'password123',
        role: 'agent',
        status: 'active',
        creditBalance: 500,
        quotaBalance: 100, // Daily free quota
      });
      console.log('✅ Agent 2 created (Phone: 01700000002, Password: password123)');
    }

    // Create Child Agent (child of Agent 1)
    const childAgentExists = await User.findOne({ phone: '01700000003' });
    if (!childAgentExists && agent1Id) {
      await User.create({
        name: 'Child Agent',
        phone: '01700000003',
        password: 'password123',
        role: 'child',
        status: 'active',
        parentId: agent1Id, // Fixed: use parentId instead of createdBy
        creditBalance: 0,
        quotaBalance: 50,
      });
      console.log('✅ Child Agent created (Phone: 01700000003, Password: password123, Parent: Agent 1)');
    }

    console.log('✅ Database seed check completed');
  } catch (error) {
    console.error('❌ Error in database seed:', error);
  }
};
