import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'agent' | 'child';
export type UserStatus = 'pending' | 'active' | 'disabled';

export interface IUser extends Document {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  parentId?: mongoose.Types.ObjectId;
  creditBalance: number;
  quotaBalance: number;
  dailyPurchaseLimit?: number;
  todayPurchased: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'agent', 'child'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'disabled'],
      default: 'pending',
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotaBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyPurchaseLimit: {
      type: Number,
      default: null,
      min: 0,
    },
    todayPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ parentId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
