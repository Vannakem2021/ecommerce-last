import { IOrderInput } from "@/types";
import { Document, Model, model, models, Schema } from "mongoose";

export interface IOrder extends Document, IOrderInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        color: { type: String },
        sku: { type: String },
      },
    ],
    shippingAddress: {
      // Common fields
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      postalCode: { type: String, required: true },

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
    expectedDeliveryDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    paymentResult: { id: String, status: String, email_address: String },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    // ABA PayWay specific fields
    abaMerchantRefNo: { type: String }, // Merchant reference number for ABA PayWay
    // Enhanced ABA PayWay status tracking
    abaPaymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    abaTransactionId: { type: String }, // ABA PayWay transaction ID
    abaStatusCode: { type: Number }, // Status code from ABA PayWay (0=success, 1=cancelled, etc.)
    abaCallbackReceived: { type: Boolean, default: false }, // Whether we received a callback
    abaStatusHistory: [
      {
        status: { type: String, required: true },
        statusCode: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
        source: {
          type: String,
          enum: ["callback", "manual"],
          required: true,
        },
        details: { type: String },
      },
    ],
    // Promotion fields
    appliedPromotion: {
      code: { type: String },
      promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion' },
      discountAmount: { type: Number, min: 0 },
      originalTotal: { type: Number, min: 0 },
      freeShipping: { type: Boolean, default: false },
    },
    discountAmount: { type: Number, min: 0, default: 0 },
    // Internal notes (admin only - not visible to customers)
    internalNotes: [
      {
        note: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);

export default Order;
