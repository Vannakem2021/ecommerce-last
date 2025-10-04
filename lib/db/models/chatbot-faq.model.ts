import mongoose from 'mongoose'

export interface IChatbotFAQ {
  _id?: string
  category: string
  question: {
    en: string
    kh: string
  }
  answer: {
    en: string
    kh: string
  }
  keywords: string[]
  order: number
  active: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const chatbotFAQSchema = new mongoose.Schema<IChatbotFAQ>(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    question: {
      en: {
        type: String,
        required: true,
        trim: true,
      },
      kh: {
        type: String,
        required: true,
        trim: true,
      },
    },
    answer: {
      en: {
        type: String,
        required: true,
      },
      kh: {
        type: String,
        required: true,
      },
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
chatbotFAQSchema.index({ category: 1, order: 1 })
chatbotFAQSchema.index({ active: 1, order: 1 })
chatbotFAQSchema.index({ keywords: 1 })

// Text index for search functionality
chatbotFAQSchema.index({
  'question.en': 'text',
  'question.kh': 'text',
  'answer.en': 'text',
  'answer.kh': 'text',
  keywords: 'text',
})

const ChatbotFAQ =
  mongoose.models.ChatbotFAQ || mongoose.model<IChatbotFAQ>('ChatbotFAQ', chatbotFAQSchema)

export default ChatbotFAQ
