import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'normal' | 'extraPool' | 'agentToChild' | 'liveToPool' | 'marketplaceSale';

export interface IQuotaTransaction extends Document {
  type: TransactionType;
  quantity: number;
  agentId: mongoose.Types.ObjectId;
  childId?: mongoose.Types.ObjectId;
  sellerId?: mongoose.Types.ObjectId;
  purchaseId?: mongoose.Types.ObjectId;
  creditCost: number;
  poolQuotaBefore?: number;
  poolQuotaAfter?: number;
  agentQuotaBefore: number;
  agentQuotaAfter: number;
  agentCreditBefore?: number;
  agentCreditAfter?: number;
  createdAt: Date;
}

const quotaTransactionSchema = new Schema<IQuotaTransaction>(
  {
    type: {
      type: String,
      enum: ['normal', 'extraPool', 'agentToChild', 'liveToPool', 'marketplaceSale'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: 'QuotaPurchase',
      default: null,
    },
    creditCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    poolQuotaBefore: {
      type: Number,
      default: null,
    },
    poolQuotaAfter: {
      type: Number,
      default: null,
    },
    agentQuotaBefore: {
      type: Number,
      required: true,
    },
    agentQuotaAfter: {
      type: Number,
      required: true,
    },
    agentCreditBefore: {
      type: Number,
      default: null,
    },
    agentCreditAfter: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quotaTransactionSchema.index({ agentId: 1, createdAt: -1 });
quotaTransactionSchema.index({ type: 1 });

export const QuotaTransaction = mongoose.model<IQuotaTransaction>('QuotaTransaction', quotaTransactionSchema);
