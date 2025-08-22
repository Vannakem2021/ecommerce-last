import { Document, Model, model, models, Schema } from 'mongoose'

export interface ICategory extends Document {
  _id: string
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

const Category =
  (models.Category as Model<ICategory>) ||
  model<ICategory>('Category', categorySchema)

export default Category
