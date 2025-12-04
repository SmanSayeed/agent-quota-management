import mongoose, { Document, Schema } from 'mongoose';

export type PurchaseStatus = 'pending' | 'approved' | 'rejected';

export interface IQuotaPurchase extends Document {
  listingId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  quantity: number;
  pricePerQuota: number;
  totalPrice: number;
  status: PurchaseStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quotaPurchaseSchema = new Schema<IQuotaPurchase>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'QuotaListing',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerQuota: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quotaPurchaseSchema.index({ buyerId: 1, status: 1 });
quotaPurchaseSchema.index({ sellerId: 1, status: 1 });
quotaPurchaseSchema.index({ status: 1, createdAt: -1 });

export const QuotaPurchase = mongoose.model<IQuotaPurchase>('QuotaPurchase', quotaPurchaseSchema);
