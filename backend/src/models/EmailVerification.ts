import mongoose, { Schema, Document } from 'mongoose';

export type VerificationType = 'registration' | 'password-reset';

export interface IEmailVerification extends Document {
  email: string;
  phone: string;
  otp: string;
  type: VerificationType;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['registration', 'password-reset'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - MongoDB will auto-delete when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailVerificationSchema.index({ email: 1, type: 1 });
emailVerificationSchema.index({ phone: 1, type: 1 });

export const EmailVerification = mongoose.model<IEmailVerification>(
  'EmailVerification',
  emailVerificationSchema
);
