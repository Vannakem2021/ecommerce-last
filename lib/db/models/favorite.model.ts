import { Document, Model, model, models, Schema } from 'mongoose'

export interface IFavorite extends Document {
  _id: string
  user: Schema.Types.ObjectId
  product: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const favoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: true }
)

favoriteSchema.index({ user: 1, product: 1 }, { unique: true })
favoriteSchema.index({ user: 1, createdAt: -1 })

const Favorite =
  (models.Favorite as Model<IFavorite>) ||
  model<IFavorite>('Favorite', favoriteSchema)

export default Favorite

