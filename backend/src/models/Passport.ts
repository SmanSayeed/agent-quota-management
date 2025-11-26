import mongoose, { Schema, Document } from 'mongoose';

export type PassportStatus = 'pending' | 'verified' | 'rejected';

export interface IOCRData {
  passportNumber?: string;
  surname?: string;
  givenNames?: string;
  nationality?: string;
  dateOfBirth?: string;
  sex?: string;
  placeOfBirth?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  authority?: string;
  [key: string]: any;
}

export interface IPassport extends Document {
  userId: mongoose.Types.ObjectId;
  imagePath: string;
  ocrData: IOCRData;
  status: PassportStatus;
  editedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const passportSchema = new Schema<IPassport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    ocrData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    editedBy: {
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
passportSchema.index({ userId: 1 });
passportSchema.index({ status: 1 });
passportSchema.index({ createdAt: -1 });

export const Passport = mongoose.model<IPassport>('Passport', passportSchema);
