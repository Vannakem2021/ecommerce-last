import { Document, Model, model, models, Schema } from "mongoose";

export interface IEmailVerificationOTP extends Document {
  _id: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationOTPSchema = new Schema<IEmailVerificationOTP>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired tokens (TTL index)
emailVerificationOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient user lookup
emailVerificationOTPSchema.index({ userId: 1 });

const EmailVerificationOTP = 
  (models.EmailVerificationOTP as Model<IEmailVerificationOTP>) || 
  model<IEmailVerificationOTP>("EmailVerificationOTP", emailVerificationOTPSchema);

export default EmailVerificationOTP;
