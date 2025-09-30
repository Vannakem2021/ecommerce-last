import { Document, Model, model, models, Schema } from 'mongoose'

export interface IStockMovement extends Document {
  _id: string
  product: string // Reference to Product ObjectId
  sku: string // Denormalized for quick lookup
  type: 'SET' | 'ADJUST' | 'SALE' | 'RETURN' | 'CORRECTION'
  quantity: number // Positive for increase, negative for decrease
  previousStock: number
  newStock: number
  reason: string
  notes?: string
  createdBy: string // Reference to User ObjectId
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stockMovementSchema = new Schema<any>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['SET', 'ADJUST', 'SALE', 'RETURN', 'CORRECTION'],
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
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

// Add indexes for better query performance
stockMovementSchema.index({ product: 1, createdAt: -1 })
stockMovementSchema.index({ sku: 1, createdAt: -1 })
stockMovementSchema.index({ type: 1, createdAt: -1 })
stockMovementSchema.index({ createdBy: 1, createdAt: -1 })

const StockMovement =
  (models.StockMovement as Model<IStockMovement>) ||
  model<IStockMovement>('StockMovement', stockMovementSchema)

export default StockMovement
