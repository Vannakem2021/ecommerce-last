import { IUserInput } from '@/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'user' },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    paymentMethod: { type: String, required: true, default: 'PayPal' },
    address: {
      fullName: { type: String, required: true, default: '' },
      street: { type: String, required: true, default: '' },
      city: { type: String, required: true, default: '' },
      province: { type: String, required: true, default: '' },
      postalCode: { type: String, required: true, default: '' },
      country: { type: String, required: true, default: '' },
      phone: { type: String, required: true, default: '' }
    }
  },
  {
    timestamps: true,
  }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema)

export default User
