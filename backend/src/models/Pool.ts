import mongoose, { Schema, Document } from 'mongoose';

export interface IPoolBase {
  availableQuota: number;
  dailyPurchaseLimit: number;
  creditPrice: number; // How much 1 credit costs in BDT (e.g., 1 BDT = 1 credit)
  quotaPrice: number; // How many credits 1 quota costs (e.g., 20 credits per quota)
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPool extends Omit<Document, '_id'>, IPoolBase {
  _id: string;
}

const poolSchema = new Schema<IPool>(
  {
    _id: {
      type: String,
      default: 'pool_singleton',
    },
    availableQuota: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dailyPurchaseLimit: {
      type: Number,
      required: true,
      default: 100,
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
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Pool = mongoose.model<IPool>('Pool', poolSchema);
