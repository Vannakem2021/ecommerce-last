import { Document, Model, model, models, Schema } from 'mongoose'

export interface IBrand extends Document {
  _id: string
  name: string
  logo?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const Brand =
  (models.Brand as Model<IBrand>) || model<IBrand>('Brand', brandSchema)

export default Brand
