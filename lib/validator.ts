import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

// Common
const MongoId = z
  .string()
  .min(24, "MongoDB ID must be 24 characters")
  .max(24, "MongoDB ID must be 24 characters")
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid MongoDB ID format" });

const Price = (field: string) =>
  z.coerce
    .number()
    .refine(
      (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(value)),
      `${field} must have exactly two decimal places (e.g., 49.99)`
    );

// BRAND
export const BrandInputSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  logo: z.string().optional(),
  active: z.boolean().default(true),
});

export const BrandUpdateSchema = BrandInputSchema.extend({
  _id: z.string().min(1, "Id is required"),
});

// CATEGORY
export const CategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const CategoryUpdateSchema = CategoryInputSchema.extend({
  _id: z.string().min(1, "Id is required"),
});

export const ReviewInputSchema = z.object({
  product: MongoId,
  user: MongoId,
  isVerifiedPurchase: z.boolean(),
  title: z.string().min(1, "Title is required"),
  comment: z.string().min(1, "Comment is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

const ProductBaseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters").toUpperCase(),
  category: MongoId,
  images: z.array(z.string()).min(1, "Product must have at least one image"),
  brand: MongoId,
  description: z.string().min(1, "Description is required"),
  isPublished: z.boolean(),
  price: Price("Price"),
  listPrice: Price("List price").optional(),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative("count in stock must be a non-negative number"),
  tags: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  avgRating: z.coerce
    .number()
    .min(0, "Average rating must be at least 0")
    .max(5, "Average rating must be at most 5"),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative("Number of reviews must be a non-negative number"),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  reviews: z.array(ReviewInputSchema).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative("Number of sales must be a non-negative number"),
  saleStartDate: z.date().optional(),
  saleEndDate: z.date().optional(),
  secondHand: z.boolean().optional().default(false),
  condition: z.enum(['Like New', 'Good', 'Fair', 'Poor']).optional(),
});

export const ProductInputSchema = ProductBaseSchema.superRefine((data, ctx) => {
  // Both-or-none validation for sale dates
  const hasStartDate = !!data.saleStartDate;
  const hasEndDate = !!data.saleEndDate;

  if (hasStartDate && !hasEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both sale start and end dates are required for a sale",
      path: ["saleEndDate"],
    });
  }

  if (!hasStartDate && hasEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both sale start and end dates are required for a sale",
      path: ["saleStartDate"],
    });
  }

  // If both sale dates are provided, end date must be after start date
  if (data.saleStartDate && data.saleEndDate) {
    if (!(data.saleEndDate > data.saleStartDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale end date must be after sale start date",
        path: ["saleEndDate"],
      });
    }

    // If both dates are provided, sale period must be at least 1 hour
    const hourInMs = 60 * 60 * 1000;
    if (!(data.saleEndDate.getTime() - data.saleStartDate.getTime() >= hourInMs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale period must be at least 1 hour long",
        path: ["saleEndDate"],
      });
    }
  }
});

export const ProductUpdateSchema = ProductBaseSchema.extend({
  _id: z.string(),
}).superRefine((data, ctx) => {
  // Both-or-none validation for sale dates
  const hasStartDate = !!data.saleStartDate;
  const hasEndDate = !!data.saleEndDate;

  if (hasStartDate && !hasEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both sale start and end dates are required for a sale",
      path: ["saleEndDate"],
    });
  }

  if (!hasStartDate && hasEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both sale start and end dates are required for a sale",
      path: ["saleStartDate"],
    });
  }

  // If both sale dates are provided, end date must be after start date
  if (data.saleStartDate && data.saleEndDate) {
    if (!(data.saleEndDate > data.saleStartDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale end date must be after sale start date",
        path: ["saleEndDate"],
      });
    }

    // If both dates are provided, sale period must be at least 1 hour
    const hourInMs = 60 * 60 * 1000;
    if (!(data.saleEndDate.getTime() - data.saleStartDate.getTime() >= hourInMs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale period must be at least 1 hour long",
        path: ["saleEndDate"],
      });
    }
  }
});

// Temporary schema for migration period - supports both string and ObjectId
export const ProductInputLegacySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters").toUpperCase(),
  category: z.union([z.string().min(1, "Category is required"), MongoId]),
  images: z.array(z.string()).min(1, "Product must have at least one image"),
  brand: z.union([z.string().min(1, "Brand is required"), MongoId]),
  description: z.string().min(1, "Description is required"),
  isPublished: z.boolean(),
  price: Price("Price"),
  listPrice: Price("List price").optional(),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative("count in stock must be a non-negative number"),
  tags: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  avgRating: z.coerce
    .number()
    .min(0, "Average rating must be at least 0")
    .max(5, "Average rating must be at most 5"),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative("Number of reviews must be a non-negative number"),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  reviews: z.array(ReviewInputSchema).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative("Number of sales must be a non-negative number"),
});

// STOCK MOVEMENT
export const StockMovementInputSchema = z.object({
  product: MongoId,
  sku: z.string().min(3, "SKU must be at least 3 characters").toUpperCase(),
  type: z.enum(["SET", "ADJUST", "SALE", "RETURN", "CORRECTION"]),
  quantity: z.number(),
  previousStock: z
    .number()
    .int()
    .nonnegative("Previous stock must be non-negative"),
  newStock: z.number().int().nonnegative("New stock must be non-negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
  createdBy: MongoId,
});

// INVENTORY MANAGEMENT
export const SetStockSchema = z.object({
  productId: MongoId,
  newQuantity: z.number().int().nonnegative("Quantity must be non-negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export const AdjustStockSchema = z.object({
  productId: MongoId,
  adjustment: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export const InventoryFiltersSchema = z.object({
  query: z.string().optional(),
  brand: z.union([z.string(), MongoId]).optional(),
  category: z.union([z.string(), MongoId]).optional(),
  page: z.number().int().positive().default(1),
  sort: z
    .enum([
      "latest",
      "oldest",
      "name-asc",
      "name-desc",
      "stock-low",
      "stock-high",
    ])
    .default("latest"),
});

// Order Item
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  product: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  category: z.union([z.string(), MongoId]),
  quantity: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative number"),
  countInStock: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative number"),
  image: z.string().min(1, "Image is required"),
  price: Price("Price"),
  size: z.string().optional(),
  color: z.string().optional(),
});

// Favorites
export const FavoriteToggleSchema = z.object({
  productId: MongoId,
})

export const FavoriteListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})
// Cambodia Address Schema
export const CambodiaAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  provinceId: z.number().min(1, "Province is required"),
  districtId: z.number().min(1, "District is required"),
  communeCode: z.string().min(1, "Commune is required"),
  houseNumber: z.string().min(1, "House number is required"),
  street: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  // For display purposes - these will be populated from IDs
  provinceName: z.string().optional(),
  districtName: z.string().optional(),
  communeName: z.string().optional(),
});

// Legacy address schema for backward compatibility
export const LegacyAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  street: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  province: z.string().min(1, "Province is required"),
  phone: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
});

// Main shipping address schema - supports both formats
export const ShippingAddressSchema = z.union([
  CambodiaAddressSchema,
  LegacyAddressSchema
]);

// Order
export const OrderInputSchema = z.object({
  user: z.union([
    MongoId,
    z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  ]),
  items: z
    .array(OrderItemSchema)
    .min(1, "Order must contain at least one item"),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentResult: z
    .object({
      id: z.string(),
      status: z.string(),
      email_address: z.string(),
      pricePaid: z.string(),
    })
    .optional(),
  itemsPrice: Price("Items price"),
  shippingPrice: Price("Shipping price"),
  taxPrice: Price("Tax price"),
  totalPrice: Price("Total price"),
  expectedDeliveryDate: z
    .date()
    .refine(
      (value) => value > new Date(),
      "Expected delivery date must be in the future"
    ),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.date().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
  // ABA PayWay specific fields
  abaMerchantRefNo: z.string().optional(),
  abaPaymentStatus: z
    .enum(["pending", "processing", "completed", "failed", "cancelled"])
    .optional(),
  abaTransactionId: z.string().optional(),
  abaStatusCode: z.number().optional(),
  abaLastStatusCheck: z.date().optional(),
  abaCallbackReceived: z.boolean().optional(),
  abaStatusHistory: z
    .array(
      z.object({
        status: z.string(),
        statusCode: z.number(),
        timestamp: z.date(),
        source: z.enum(["callback", "manual"]),
        details: z.string().optional(),
      })
    )
    .optional(),
  // Promotion fields
  appliedPromotion: z.optional(z.object({
    code: z.string(),
    promotionId: MongoId,
    discountAmount: z.number(),
    originalTotal: z.number(),
    freeShipping: z.boolean().optional(),
  })),
  discountAmount: z.optional(z.number().min(0)),
});
// Cart

export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, "Order must contain at least one item"),
  itemsPrice: z.number(),
  taxPrice: z.optional(z.number()),
  shippingPrice: z.optional(z.number()),
  totalPrice: z.number(),
  paymentMethod: z.optional(z.string()),
  shippingAddress: z.optional(ShippingAddressSchema),
  deliveryDateIndex: z.optional(z.number()),
  expectedDeliveryDate: z.optional(z.date()),
  // Promotion fields
  appliedPromotion: z.optional(z.object({
    code: z.string(),
    discountAmount: z.number(),
    promotionId: z.string(),
    freeShipping: z.boolean().optional(),
  })),
  discountAmount: z.optional(z.number()),
});

// USER
const UserName = z
  .string()
  .min(2, { message: "Username must be at least 2 characters" })
  .max(50, { message: "Username must be at most 30 characters" });
const Email = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long") // RFC 5321 limit
  .email("Email is invalid")
  .refine((email) => {
    // Additional email security checks
    const normalizedEmail = email.toLowerCase().trim();
    // Prevent email injection attacks
    if (normalizedEmail.includes('\n') || normalizedEmail.includes('\r') || normalizedEmail.includes('\t')) {
      return false;
    }
    // Basic domain validation
    const domain = normalizedEmail.split('@')[1];
    if (!domain || domain.length < 2) {
      return false;
    }
    return true;
  }, "Invalid email format")
  .transform((email) => email.toLowerCase().trim());

const RegistrationEmail = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long") // RFC 5321 limit
  .email("Email is invalid")
  .refine((email) => {
    // Additional email security checks
    const normalizedEmail = email.toLowerCase().trim();
    // Prevent email injection attacks
    if (normalizedEmail.includes('\n') || normalizedEmail.includes('\r') || normalizedEmail.includes('\t')) {
      return false;
    }
    // Basic domain validation
    const domain = normalizedEmail.split('@')[1];
    if (!domain || domain.length < 2) {
      return false;
    }
    return true;
  }, "Invalid email format")
  .transform((email) => email.toLowerCase().trim());
const Password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
  .refine((password) => {
    // Block common weak passwords
    const commonPasswords = [
      'password', 'password123', 'admin123', 'qwerty123', '123456789', 'password1',
      'welcome123', 'letmein123', 'monkey123', 'dragon123', 'sunshine123',
      '12345678', 'qwertyui', 'asdfghjk', 'zxcvbnm1', 'iloveyou', 'princess',
      'football', 'baseball', 'welcome1', 'abc12345'
    ];
    return !commonPasswords.includes(password.toLowerCase());
  }, "Password is too common. Please choose a stronger password")
  .refine((password) => {
    // Prevent passwords that are just repeated characters
    const repeatedChar = /^(.)\1+$/.test(password);
    return !repeatedChar;
  }, "Password cannot be just repeated characters")
  .refine((password) => {
    // Prevent long sequential characters (5+ characters like 12345 or abcde)
    // This allows common patterns like "Password123" while blocking obvious sequences
    const longSequential = /(01234|12345|23456|34567|45678|56789|abcde|bcdef|cdefg|defgh|efghi|fghij|ghijk|hijkl|ijklm|jklmn|klmno|lmnop|mnopq|nopqr|opqrs|pqrst|qrstu|rstuv|stuvw|tuvwx|uvwxy|vwxyz)/i.test(password);
    return !longSequential;
  }, "Password cannot contain long sequential characters (like 12345 or abcde)")
  .refine((password) => {
    // Prevent keyboard patterns
    const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '1qaz2wsx', 'qazwsx'];
    return !keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern));
  }, "Password cannot contain keyboard patterns (like qwerty or asdfgh)");

const SignInPassword = z.string().min(1, "Password is required");
const UserRole = z.enum(["admin", "manager", "seller", "user"], {
  errorMap: () => ({
    message: "Invalid role. Must be admin, manager, seller, or user",
  }),
}).refine((role) => {
  // Additional role validation to prevent injection
  const validRoles = ["admin", "manager", "seller", "user"];
  return validRoles.includes(role);
}, "Invalid role value");

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  email: Email,
  role: UserRole,
});

// Base user schema with optional customer-specific fields (for registration)
export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  paymentMethod: z.string().optional(),
  address: z.union([
    // Cambodia address format
    z.object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      provinceId: z.number().optional(),
      districtId: z.number().optional(),
      communeCode: z.string().optional(),
      houseNumber: z.string().optional(),
      street: z.string().optional(),
      postalCode: z.string().optional(),
      provinceName: z.string().optional(),
      districtName: z.string().optional(),
      communeName: z.string().optional(),
    }),
    // Legacy address format for backward compatibility
    z.object({
      fullName: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
    }),
  ]).optional(),
});

// Schema for complete user profile (required for checkout/orders)
export const UserProfileCompleteSchema = UserInputSchema.refine(
  (data) => {
    // Customer users (role: 'user') must have payment method and complete address for checkout
    if (data.role === "user") {
      const hasPaymentMethod =
        data.paymentMethod && data.paymentMethod.trim().length > 0;
      const hasCompleteAddress =
        data.address &&
        data.address.fullName &&
        data.address.fullName.trim().length > 0 &&
        data.address.phone &&
        data.address.phone.trim().length > 0 &&
        data.address.postalCode &&
        data.address.postalCode.trim().length > 0 &&
        // Check for either Cambodia format or legacy format
        (('provinceName' in data.address && data.address.provinceName && 'districtName' in data.address && data.address.districtName) ||
         ('city' in data.address && data.address.city && 'province' in data.address && data.address.province && 'country' in data.address && data.address.country));

      return hasPaymentMethod && hasCompleteAddress;
    }
    // System users (admin, manager, seller) don't require these fields
    return true;
  },
  {
    message:
      "Complete profile required: payment method and address information must be provided for checkout",
    path: ["role"],
  }
);

export const UserSignInSchema = z.object({
  email: Email,
  password: SignInPassword,
});
export const UserSignUpSchema = z.object({
  name: UserName,
  email: RegistrationEmail,
  password: Password,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export const UserNameSchema = z.object({
  name: UserName,
});

// Password reset schemas
export const ForgotPasswordSchema = z.object({
  email: Email,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: Password,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Enhanced admin user creation schema with role-based validation
export const AdminUserCreateSchema = z
  .object({
    name: UserName,
    email: RegistrationEmail,
    role: UserRole,
    password: Password,
    sendWelcomeEmail: z.boolean().default(false),
    // Optional fields for customer users
    paymentMethod: z.string().optional(),
    address: z
      .object({
        fullName: z.string().optional(),
        street: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // If creating a customer user, require address and payment method
      if (data.role === "user") {
        const hasPaymentMethod =
          data.paymentMethod && data.paymentMethod.trim().length > 0;
        const hasCompleteAddress =
          data.address &&
          data.address.fullName &&
          data.address.fullName.trim().length > 0 &&
          data.address.street &&
          data.address.street.trim().length > 0 &&
          data.address.city &&
          data.address.city.trim().length > 0 &&
          data.address.province &&
          data.address.province.trim().length > 0 &&
          data.address.postalCode &&
          data.address.postalCode.trim().length > 0 &&
          data.address.country &&
          data.address.country.trim().length > 0 &&
          data.address.phone &&
          data.address.phone.trim().length > 0;

        return hasPaymentMethod && hasCompleteAddress;
      }
      // System users don't require these fields
      return true;
    },
    {
      message:
        "Customer users must provide payment method and complete address information",
      path: ["role"],
    }
  );

// WEBPAGE
export const WebPageInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  content: z.string().min(1, "Content is required"),
  isPublished: z.boolean(),
});

export const WebPageUpdateSchema = WebPageInputSchema.extend({
  _id: z.string(),
});

// Setting

export const SiteLanguageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});
export const CarouselSchema = z.object({
  title: z.string().min(1, "title is required"),
  url: z.string().min(1, "url is required"),
  image: z.string().min(1, "image is required"),
  buttonCaption: z.string().min(1, "buttonCaption is required"),
});

export const SiteCurrencySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  convertRate: z.coerce.number().min(0, "Convert rate must be at least 0"),
  symbol: z.string().min(1, "Symbol is required"),
});

export const PaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  commission: z.coerce.number().min(0, "Commission must be at least 0"),
});

export const DeliveryDateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  daysToDeliver: z.number().min(0, "Days to deliver must be at least 0"),
  shippingPrice: z.coerce.number().min(0, "Shipping price must be at least 0"),
  freeShippingMinPrice: z.coerce
    .number()
    .min(0, "Free shipping min amount must be at least 0"),
});

export const SettingInputSchema = z.object({
  // PROMPT: create fields
  // codeium, based on the mongoose schema for settings
  common: z.object({
    pageSize: z.coerce
      .number()
      .min(1, "Page size must be at least 1")
      .default(9),
    isMaintenanceMode: z.boolean().default(false),
    freeShippingMinPrice: z.coerce
      .number()
      .min(0, "Free shipping min price must be at least 0")
      .default(0),
    defaultTheme: z
      .string()
      .min(1, "Default theme is required")
      .default("light"),
    defaultColor: z
      .string()
      .min(1, "Default color is required")
      .default("green"),
  }),
  site: z.object({
    name: z.string().min(1, "Name is required"),
    logo: z.string().min(1, "logo is required"),
    slogan: z.string().min(1, "Slogan is required"),
    description: z.string().min(1, "Description is required"),
    keywords: z.string().min(1, "Keywords is required"),
    url: z.string().min(1, "Url is required"),
    email: z.string().min(1, "Email is required"),
    phone: z.string().min(1, "Phone is required"),
    author: z.string().min(1, "Author is required"),
    copyright: z.string().min(1, "Copyright is required"),
    address: z.string().min(1, "Address is required"),
  }),
  availableLanguages: z
    .array(SiteLanguageSchema)
    .min(1, "At least one language is required"),

  carousels: z
    .array(CarouselSchema)
    .min(1, "At least one language is required"),
  defaultLanguage: z.string().min(1, "Language is required"),
  availableCurrencies: z
    .array(SiteCurrencySchema)
    .min(1, "At least one currency is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
  availablePaymentMethods: z
    .array(PaymentMethodSchema)
    .min(1, "At least one payment method is required"),
  defaultPaymentMethod: z.string().min(1, "Payment method is required"),
  availableDeliveryDates: z
    .array(DeliveryDateSchema)
    .min(1, "At least one delivery date is required"),
  defaultDeliveryDate: z.string().min(1, "Delivery date is required"),
  // ABA PayWay configuration
  abaPayWay: z
    .object({
      enabled: z.boolean().default(false),
      merchantId: z.string().optional(),
      sandboxMode: z.boolean().default(true),
    })
    .optional(),
  // Telegram notification configuration
  telegram: z
    .object({
      enabled: z.boolean().default(false),
      botToken: z.string().optional(),
      chatId: z.string().optional(),
      notificationTypes: z
        .object({
          orderPaid: z.boolean().default(true),
          orderDelivered: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),
  // Home Page sections configuration
  homePage: z
    .object({
      sections: z.array(
        z.object({
          id: z.string().min(1, "Section ID is required"),
          type: z.enum(['dynamic', 'category'], {
            errorMap: () => ({ message: "Type must be 'dynamic' or 'category'" }),
          }),
          title: z.object({
            en: z.string().min(1, "English title is required"),
            kh: z.string().min(1, "Khmer title is required"),
          }),
          enabled: z.boolean().default(true),
          limit: z.coerce.number().min(1, "Limit must be at least 1").default(6),
          order: z.coerce.number().min(0, "Order must be at least 0"),
          categoryName: z.string().optional(),
        })
      ),
    })
    .optional(),
});

// PROMOTION
const PromotionBaseSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code can only contain uppercase letters, numbers, hyphens, and underscores"
    )
    .transform((val) => val.toUpperCase()),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  active: z.boolean().default(true),
  minOrderValue: z.coerce
    .number()
    .min(0, "Minimum order value must be non-negative")
    .default(0),
  usageLimit: z.coerce
    .number()
    .int()
    .min(0, "Usage limit must be non-negative")
    .default(0),
  userUsageLimit: z.coerce
    .number()
    .int()
    .min(0, "User usage limit must be non-negative")
    .default(0),
  appliesTo: z
    .enum(["all", "products", "categories"], {
      required_error: "Application scope is required",
    })
    .default("all"),
  applicableProducts: z.array(MongoId).default([]),
  applicableCategories: z.array(MongoId).default([]),
})

const PercentagePromotionSchema = PromotionBaseSchema.extend({
  type: z.literal("percentage"),
  value: z.coerce
    .number()
    .int()
    .min(1, "Percentage must be between 1 and 100")
    .max(100, "Percentage must be between 1 and 100"),
})

const FixedPromotionSchema = PromotionBaseSchema.extend({
  type: z.literal("fixed"),
  value: z.coerce.number().gt(0, "Fixed amount must be greater than 0"),
})

const FreeShippingPromotionSchema = PromotionBaseSchema.extend({
  type: z.literal("free_shipping"),
  value: z.literal(0).default(0),
})

export const PromotionInputSchema = z
  .discriminatedUnion("type", [
    PercentagePromotionSchema,
    FixedPromotionSchema,
    FreeShippingPromotionSchema,
  ])
  .superRefine((data, ctx) => {
    if (!(data.endDate > data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["endDate"],
      })
    }
    if (data.appliesTo === "products" && data.applicableProducts.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Must select at least one product when applying to specific products",
        path: ["applicableProducts"],
      })
    }
    if (
      data.appliesTo === "categories" &&
      data.applicableCategories.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Must select at least one category when applying to specific categories",
        path: ["applicableCategories"],
      })
    }
  })

export const PromotionUpdateSchema = PromotionInputSchema.and(z.object({
  _id: z.string().min(1, "Id is required"),
}));

// PROMOTION USAGE
export const PromotionUsageInputSchema = z.object({
  promotion: MongoId,
  user: MongoId,
  order: MongoId,
  usedAt: z.date().default(() => new Date()),
  discountAmount: z.coerce.number().min(0, "Discount amount must be non-negative"),
  originalTotal: z.coerce.number().min(0, "Original total must be non-negative"),
  finalTotal: z.coerce.number().min(0, "Final total must be non-negative"),
});

// PROMOTION VALIDATION (for checkout)
export const PromotionValidationSchema = z.object({
  code: z.string().min(1, "Promotion code is required"),
  cartTotal: z.coerce.number().min(0, "Cart total must be non-negative"),
  userId: MongoId.optional(),
});

