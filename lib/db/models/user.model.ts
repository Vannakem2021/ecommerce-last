import { IUserInput } from "@/types";
import { Document, Model, model, models, Schema } from "mongoose";

export interface IUser extends Document, IUserInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
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

    // Customer-specific fields (conditionally required based on role)
    paymentMethod: {
      type: String,
      required: function (this: IUser) {
        return this.role === "user";
      },
      default: function (this: IUser) {
        return this.role === "user" ? "ABA PayWay" : undefined;
      },
    },
    address: {
      // Common fields
      fullName: {
        type: String,
        required: function (this: IUser) {
          return this.role === "user";
        },
        default: function (this: IUser) {
          return this.role === "user" ? "" : undefined;
        },
      },
      phone: {
        type: String,
        required: function (this: IUser) {
          return this.role === "user";
        },
        default: function (this: IUser) {
          return this.role === "user" ? "" : undefined;
        },
      },
      postalCode: {
        type: String,
        required: function (this: IUser) {
          return this.role === "user";
        },
        default: function (this: IUser) {
          return this.role === "user" ? "" : undefined;
        },
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
