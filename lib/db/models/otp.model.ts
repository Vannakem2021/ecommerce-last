import { Document, Model, model, models, Schema } from "mongoose";

export type OTPPurpose = 'email-verification' | 'password-reset';

export interface IOTP extends Document {
  _id: string;
  userId: string;
  purpose: OTPPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['email-verification', 'password-reset'],
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired tokens (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookup by user and purpose
otpSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

const OTP = 
  (models.OTP as Model<IOTP>) || 
  model<IOTP>("OTP", otpSchema);

export default OTP;
