import mongoose, { Document, Schema } from 'mongoose';

export type ListingStatus = 'active' | 'sold' | 'cancelled';

export interface IQuotaListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  quantity: number;
  pricePerQuota: number;
  totalPrice: number;
  status: ListingStatus;
  purchaseId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quotaListingSchema = new Schema<IQuotaListing>(
  {
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
      enum: ['active', 'sold', 'cancelled'],
      default: 'active',
    },
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: 'QuotaPurchase',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quotaListingSchema.index({ sellerId: 1, status: 1 });
quotaListingSchema.index({ status: 1, createdAt: -1 });

export const QuotaListing = mongoose.model<IQuotaListing>('QuotaListing', quotaListingSchema);
