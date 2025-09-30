import { Document, Model, model, models, Schema } from 'mongoose'

export interface IPromotionUsage extends Document {
  _id: string
  promotion: string
  user: string
  order: string
  usedAt: Date
  discountAmount: number
  originalTotal: number
  finalTotal: number
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promotionUsageSchema = new Schema<any>(
  {
    promotion: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    usedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance and uniqueness
promotionUsageSchema.index({ promotion: 1, user: 1 })
promotionUsageSchema.index({ promotion: 1, order: 1 }, { unique: true })
promotionUsageSchema.index({ user: 1, usedAt: -1 })
promotionUsageSchema.index({ promotion: 1, usedAt: -1 })

// Static method to get user usage count for a promotion
promotionUsageSchema.statics.getUserUsageCount = function (
  promotionId: string,
  userId: string
) {
  return this.countDocuments({ promotion: promotionId, user: userId })
}

// Static method to get total usage for a promotion
promotionUsageSchema.statics.getPromotionUsageCount = function (
  promotionId: string
) {
  return this.countDocuments({ promotion: promotionId })
}

// Static method to get usage statistics
promotionUsageSchema.statics.getUsageStats = function (promotionId: string) {
  return this.aggregate([
    { $match: { promotion: promotionId } },
    {
      $group: {
        _id: '$promotion',
        totalUsage: { $sum: 1 },
        totalDiscountGiven: { $sum: '$discountAmount' },
        averageDiscount: { $avg: '$discountAmount' },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
      },
    },
    {
      $project: {
        uniqueUsers: 0,
      },
    },
  ])
}

const PromotionUsage =
  (models.PromotionUsage as Model<IPromotionUsage>) ||
  model<IPromotionUsage>('PromotionUsage', promotionUsageSchema)

export default PromotionUsage
