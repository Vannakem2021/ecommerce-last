import { Document, Model, model, models, Schema } from 'mongoose'
import { getEffectivePrice as getEffectivePriceUtil } from '@/lib/utils'

export interface IProduct extends Document {
  _id: string
  name: string
  slug: string
  sku: string
  category: Schema.Types.ObjectId
  images: string[]
  brand: Schema.Types.ObjectId
  description: string
  price: number
  listPrice: number
  countInStock: number
  tags: string[]
  colors: string[]
  sizes: string[]
  // Variant pricing structure
  variants?: {
    storage?: { value: string; priceModifier: number }[]
    ram?: { value: string; priceModifier: number }[]
    colors?: string[]
  }
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
  numSales: number
  isPublished: boolean
  reviews: Schema.Types.ObjectId[]
  saleStartDate?: Date
  saleEndDate?: Date
  secondHand?: boolean
  condition?: string
  createdAt: Date
  updatedAt: Date

  // Virtual methods
  isCurrentlyOnSale(date?: Date): boolean
  getEffectivePrice(date?: Date): number
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: [String],
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    listPrice: { type: Number, required: false, },
    countInStock: {
      type: Number,
      required: true,
    },
    tags: { type: [String], default: ['new-arrival'] },
    colors: { type: [String], default: ['White', 'Green', 'Black'] },
    sizes: { type: [String], default: ['S', 'M', 'L'] },
    avgRating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    ratingDistribution: [
      {
        rating: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
      },
    ],
    numSales: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
        default: [],
      },
    ],
    saleStartDate: {
      type: Date,
      required: false,
    },
    saleEndDate: {
      type: Date,
      required: false,
    },
    secondHand: {
      type: Boolean,
      required: false,
      default: false,
    },
    condition: {
      type: String,
      required: false,
      enum: ['Like New', 'Good', 'Fair', 'Poor'],
    },
    variants: {
      type: {
        storage: [{
          value: { type: String, required: true },
          priceModifier: { type: Number, required: true, default: 0 }
        }],
        ram: [{
          value: { type: String, required: true },
          priceModifier: { type: Number, required: true, default: 0 }
        }],
        colors: [String]
      },
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

// Add validation for sale dates
productSchema.pre('save', function (next) {
  if (this.saleStartDate && this.saleEndDate) {
    if (this.saleEndDate <= this.saleStartDate) {
      return next(new Error('Sale end date must be after sale start date'))
    }
    // Ensure sale period is at least 1 hour
    const hourInMs = 60 * 60 * 1000
    if (this.saleEndDate.getTime() - this.saleStartDate.getTime() < hourInMs) {
      return next(new Error('Sale period must be at least 1 hour long'))
    }
  }
  next()
})

// Virtual method to check if product is currently on sale
productSchema.methods.isCurrentlyOnSale = function (date?: Date): boolean {
  const checkDate = date || new Date()
  if (!this.saleStartDate || !this.saleEndDate) {
    return false
  }
  return checkDate >= this.saleStartDate && checkDate <= this.saleEndDate
}

// Virtual method to get effective price - delegates to utils function
productSchema.methods.getEffectivePrice = function (date?: Date): number {
  return getEffectivePriceUtil(this, date)
}

// Add indexes for performance
productSchema.index({ saleStartDate: 1, saleEndDate: 1 })

const Product =
  (models.Product as Model<IProduct>) ||
  model<IProduct>('Product', productSchema)

export default Product

