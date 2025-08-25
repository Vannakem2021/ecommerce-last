import {
  BrandInputSchema,
  BrandUpdateSchema,
  CarouselSchema,
  CartSchema,
  CategoryInputSchema,
  CategoryUpdateSchema,
  DeliveryDateSchema,
  OrderInputSchema,
  OrderItemSchema,
  PaymentMethodSchema,
  ProductInputSchema,
  ReviewInputSchema,
  SettingInputSchema,
  ShippingAddressSchema,
  CambodiaAddressSchema,
  LegacyAddressSchema,
  SiteCurrencySchema,
  SiteLanguageSchema,
  UserInputSchema,
  UserNameSchema,
  UserSignInSchema,
  UserSignUpSchema,
  AdminUserCreateSchema,
  WebPageInputSchema,
  StockMovementInputSchema,
  SetStockSchema,
  AdjustStockSchema,
  InventoryFiltersSchema,
} from '@/lib/validator'
import { z } from 'zod'

// Brand & Category types
export type IBrandInput = z.infer<typeof BrandInputSchema>
export type IBrandUpdate = z.infer<typeof BrandUpdateSchema>
export type ICategoryInput = z.infer<typeof CategoryInputSchema>
export type ICategoryUpdate = z.infer<typeof CategoryUpdateSchema>

export type IReviewInput = z.infer<typeof ReviewInputSchema>
export type IReviewDetails = IReviewInput & {
  _id: string
  createdAt: string
  user: {
    name: string
  }
}
export type IProductInput = z.infer<typeof ProductInputSchema>

export type Data = {
  settings: ISettingInput[]
  webPages: IWebPageInput[]
  users: IUserInput[]
  products: IProductInput[]
  reviews: {
    title: string
    rating: number
    comment: string
  }[]
  headerMenus: {
    name: string
    href: string
  }[]
  carousels: {
    image: string
    url: string
    title: string
    buttonCaption: string
    isPublished: boolean
  }[]
}
// Order
export type IOrderInput = z.infer<typeof OrderInputSchema>
export type IOrderList = IOrderInput & {
  _id: string
  user: {
    name: string
    email: string
  }
  createdAt: Date
}
export type OrderItem = z.infer<typeof OrderItemSchema>
export type Cart = z.infer<typeof CartSchema>
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>
export type CambodiaAddress = z.infer<typeof CambodiaAddressSchema>
export type LegacyAddress = z.infer<typeof LegacyAddressSchema>

// user
export type IUserInput = z.infer<typeof UserInputSchema>
export type IUserSignIn = z.infer<typeof UserSignInSchema>
export type IUserSignUp = z.infer<typeof UserSignUpSchema>
export type IUserName = z.infer<typeof UserNameSchema>
export type IAdminUserCreate = z.infer<typeof AdminUserCreateSchema>

// webpage
export type IWebPageInput = z.infer<typeof WebPageInputSchema>

// setting
export type ICarousel = z.infer<typeof CarouselSchema>
export type ISettingInput = z.infer<typeof SettingInputSchema>
export type ClientSetting = ISettingInput & {
  currency: string
}
export type SiteLanguage = z.infer<typeof SiteLanguageSchema>
export type SiteCurrency = z.infer<typeof SiteCurrencySchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type DeliveryDate = z.infer<typeof DeliveryDateSchema>

// Inventory Management types
export type IStockMovementInput = z.infer<typeof StockMovementInputSchema>
export type ISetStock = z.infer<typeof SetStockSchema>
export type IAdjustStock = z.infer<typeof AdjustStockSchema>
export type IInventoryFilters = z.infer<typeof InventoryFiltersSchema>

export type StockMovementType = 'SET' | 'ADJUST' | 'SALE' | 'RETURN' | 'CORRECTION'

export type IInventoryProduct = {
  _id: string
  name: string
  sku: string
  brand: string
  category: string
  countInStock: number
  price: number
  isPublished: boolean
  images: string[]
  createdAt: Date
  updatedAt: Date
}
