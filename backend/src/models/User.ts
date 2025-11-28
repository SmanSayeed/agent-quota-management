import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'superadmin' | 'agent' | 'child';
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
  todayPurchased: number;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
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
      enum: ['superadmin', 'agent', 'child'],
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
// userSchema.index({ phone: 1 }); // Already indexed by unique: true
userSchema.index({ role: 1 });
userSchema.index({ parentId: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
