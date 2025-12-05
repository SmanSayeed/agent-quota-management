import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettingsBase {
  creditPrice: number; // How much 1 credit costs in BDT (e.g., 1 BDT = 1 credit)
  quotaPrice: number; // How many credits 1 quota costs (e.g., 20 credits per quota)
  dailyFreeQuota: number; // Free quota given daily
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemSettings extends Omit<Document, '_id'>, ISystemSettingsBase {
  _id: string;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    _id: {
      type: String,
      default: 'system_settings_singleton',
    },
    creditPrice: {
      type: Number,
      required: true,
      default: 1, // 1 BDT = 1 credit by default
    },
    quotaPrice: {
      type: Number,
      required: true,
      default: 20, // 20 credits per quota by default
    },
    dailyFreeQuota: {
      type: Number,
      required: true,
      default: 100, // 100 free quota per day by default
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
