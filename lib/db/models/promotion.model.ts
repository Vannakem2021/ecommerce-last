import { Document, Model, model, models, Schema } from 'mongoose'

export interface IPromotion extends Document {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderValue: number
  maxDiscount?: number
  startDate: Date
  endDate: Date
  usageLimit: number
  userUsageLimit: number
  usedCount: number
  active: boolean
  appliesTo: 'all' | 'products' | 'categories'
  applicableProducts: string[]
  applicableCategories: string[]
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promotionSchema = new Schema<any>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      required: true,
    },
    value: {
      type: Number,
      required: function (this: IPromotion) {
        return this.type !== 'free_shipping'
      },
      min: 0,
      validate: {
        validator: function (this: IPromotion, value: number) {
          if (this.type === 'percentage') {
            return value >= 1 && value <= 100
          }
          return value >= 0
        },
        message: 'Percentage must be between 1-100, fixed amount must be >= 0',
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IPromotion, endDate: Date) {
          return endDate > this.startDate
        },
        message: 'End date must be after start date',
      },
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    userUsageLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    appliesTo: {
      type: String,
      enum: ['all', 'products', 'categories'],
      required: true,
      default: 'all',
    },
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
promotionSchema.index({ code: 1 })
promotionSchema.index({ active: 1, startDate: 1, endDate: 1 })
promotionSchema.index({ appliesTo: 1 })
promotionSchema.index({ createdBy: 1 })

// Virtual for checking if promotion is currently valid
promotionSchema.virtual('isCurrentlyValid').get(function (this: IPromotion) {
  const now = new Date()
  return (
    this.active &&
    this.startDate <= now &&
    this.endDate >= now &&
    (this.usageLimit === 0 || this.usedCount < this.usageLimit)
  )
})

// Method to check if promotion has usage remaining
promotionSchema.methods.hasUsageRemaining = function (this: IPromotion) {
  return this.usageLimit === 0 || this.usedCount < this.usageLimit
}

// Method to increment usage count
promotionSchema.methods.incrementUsage = function (this: IPromotion) {
  this.usedCount += 1
  return this.save()
}

const Promotion =
  (models.Promotion as Model<IPromotion>) ||
  model<IPromotion>('Promotion', promotionSchema)

export default Promotion
