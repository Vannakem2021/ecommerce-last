import { IUserInput } from "@/types";
import { Document, Model, model, models, Schema } from "mongoose";

export interface IUser extends Document, IUserInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    // Core fields (always required)
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: "user" },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },

    // Customer-specific fields (optional during registration, required for checkout)
    paymentMethod: {
      type: String,
      required: false, // Made optional to allow registration without payment method
      default: undefined,
    },
    address: {
      // Common fields - made optional for registration
      fullName: {
        type: String,
        required: false,
        default: undefined,
      },
      phone: {
        type: String,
        required: false,
        default: undefined,
      },
      postalCode: {
        type: String,
        required: false,
        default: undefined,
      },

      // Cambodia address fields
      provinceId: { type: Number },
      districtId: { type: Number },
      communeCode: { type: String },
      houseNumber: { type: String },
      street: { type: String },
      provinceName: { type: String },
      districtName: { type: String },
      communeName: { type: String },

      // Legacy address fields (for backward compatibility)
      city: { type: String },
      province: { type: String },
      country: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const User = (models.User as Model<IUser>) || model<IUser>("User", userSchema);

export default User;
