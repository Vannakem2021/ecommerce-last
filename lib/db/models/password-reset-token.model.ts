import { Document, Model, model, models, Schema } from "mongoose";

export interface IPasswordResetToken extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient token lookup
passwordResetTokenSchema.index({ token: 1 });

// Index for user lookup
passwordResetTokenSchema.index({ userId: 1 });

const PasswordResetToken = 
  (models.PasswordResetToken as Model<IPasswordResetToken>) || 
  model<IPasswordResetToken>("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetToken;
