import mongoose, { Schema, Document } from 'mongoose';

export type CreditRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ICreditRequest extends Document {
  agentId: mongoose.Types.ObjectId;
  amount: number;
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
