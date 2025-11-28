import mongoose, { Schema, Document } from 'mongoose';

export type CreditRequestStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'bank_transfer' | 'mobile_banking';

export interface IPaymentDetails {
  // Bank Transfer fields
  bankName?: string;
  accountNumber?: string;
  
  // Mobile Banking fields
  provider?: string; // bKash, Nagad, Rocket
  phoneNumber?: string;
  
  // Common fields
  transactionId: string;
  transactionDate: string;
}

export interface ICreditRequest extends Document {
  agentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDetails: IPaymentDetails;
  proofImagePath?: string;
  status: CreditRequestStatus;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const creditRequestSchema = new Schema<ICreditRequest>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'mobile_banking'],
      required: true,
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      required: true,
    },
    proofImagePath: {
      type: String,
      default: null,
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
creditRequestSchema.index({ agentId: 1 });
creditRequestSchema.index({ status: 1 });
creditRequestSchema.index({ createdAt: -1 });

export const CreditRequest = mongoose.model<ICreditRequest>('CreditRequest', creditRequestSchema);
