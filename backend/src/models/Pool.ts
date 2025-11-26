import mongoose, { Schema, Document } from 'mongoose';

export interface IPoolBase {
  availableQuota: number;
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
