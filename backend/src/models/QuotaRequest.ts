import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotaRequest extends Document {
  childId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'bank_transfer' | 'mobile_banking';
  paymentDetails: {
    transactionId: string;
    transactionDate: string;
    bankName?: string;
    accountNumber?: string;
    provider?: string;
    phoneNumber?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const quotaRequestSchema = new Schema<IQuotaRequest>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'mobile_banking'],
      required: true,
    },
    paymentDetails: {
      transactionId: { type: String, required: true },
      transactionDate: { type: String, required: true },
      bankName: String,
      accountNumber: String,
      provider: String,
      phoneNumber: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const QuotaRequest = mongoose.model<IQuotaRequest>('QuotaRequest', quotaRequestSchema);
