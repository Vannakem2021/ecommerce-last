Yes 💯 — coupons usually need to be scoped:

Sometimes they apply to all products (site-wide promotion).

Sometimes only to specific products (e.g. “10% off iPhone”).

Sometimes only to categories (e.g. “20% off Shoes”).

Right now, the model I gave you is “global” (applies to everything). Let’s enhance it to support product/category-specific rules.

🗂️ Enhanced MongoDB Model (Mongoose)
import { Schema, model, models } from "mongoose";

const promotionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },

    type: { type: String, enum: ["percentage", "fixed", "free_shipping"], required: true },
    value: {
      type: Number,
      required: function () {
        return this.type !== "free_shipping";
      },
    },

    // Validity
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true },

    // Usage control
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    userUsageLimit: { type: Number, default: 0 }, // per user

    // Scope
    appliesTo: { type: String, enum: ["all", "products", "categories"], default: "all" },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

const Promotion = models.Promotion || model("Promotion", promotionSchema);
export default Promotion;

⚡ Validation Logic (Server Action)
export async function validatePromotion(code: string, cart: any[], cartTotal: number) {
  await dbConnect();
  const promo = await Promotion.findOne({ code: code.toUpperCase() });

  if (!promo || !promo.active) return { error: "Invalid coupon" };

  const now = new Date();
  if (promo.startDate > now || promo.endDate < now) return { error: "Coupon expired" };

  if (cartTotal < promo.minOrderValue)
    return { error: `Minimum order ${promo.minOrderValue} required` };

  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit)
    return { error: "Coupon usage limit reached" };

  // --- Apply Scope ---
  let eligibleItems = cart;

  if (promo.appliesTo === "products") {
    eligibleItems = cart.filter((item) =>
      promo.applicableProducts.some((p) => p.toString() === item.productId.toString())
    );
  } else if (promo.appliesTo === "categories") {
    eligibleItems = cart.filter((item) =>
      promo.applicableCategories.some((c) => c.toString() === item.categoryId.toString())
    );
  }

  if (eligibleItems.length === 0) {
    return { error: "Coupon not applicable to selected products" };
  }

  // --- Calculate Discount ---
  let discount = 0;
  if (promo.type === "percentage") {
    const eligibleTotal = eligibleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    discount = (promo.value / 100) * eligibleTotal;
  } else if (promo.type === "fixed") {
    discount = promo.value;
  } else if (promo.type === "free_shipping") {
    discount = -1; // flag for free shipping
  }

  return { success: true, discount, promo: JSON.parse(JSON.stringify(promo)) };
}

🛒 Example Cart Input
const cart = [
  { productId: "64fabc123", categoryId: "64fcat456", name: "Shoes", price: 50, quantity: 2 },
  { productId: "64fabc789", categoryId: "64fcat999", name: "Watch", price: 100, quantity: 1 },
];

✅ Summary

appliesTo = "all" → coupon applies to every product.

appliesTo = "products" → only items in applicableProducts[].

appliesTo = "categories" → only items in applicableCategories[].

At checkout, you pass the cart items → backend checks if eligible → discount is calculate


what if the product no list price should coupon check againt sale price?
Next.js (NextJS) said:

Exactly 👌 — if a product doesn’t have a list price, then the sale price becomes the base price for coupon calculation.

🔑 Pricing Logic in E-commerce

Product with List Price (MSRP) & Sale Price

Example:

List Price: $100

Sale Price: $80

Coupon: 10% OFF

✅ Discount applies on sale price ($80) → Final Price = $72

⚠️ Don’t apply coupon on list price, otherwise customer gets double discount (list vs sale + coupon).

Product without List Price (only Sale Price)

Example:

Sale Price: $50

Coupon: $10 OFF

✅ Coupon applies directly to sale price ($50) → Final Price = $40

👉 If no list price, treat salePrice as the base.

⚡ Suggested Model in MongoDB (Mongoose)
const productSchema = new Schema({
  name: String,
  listPrice: { type: Number, default: null }, // optional
  salePrice: { type: Number, required: true }, // actual selling price
});

⚡ Coupon Validation Logic (Server Action)
// Inside validatePromotion
let eligibleTotal = eligibleItems.reduce((sum, item) => {
  // Use salePrice if available, otherwise fallback to listPrice
  const price = item.salePrice || item.listPrice;
  return sum + price * item.quantity;
}, 0);

let discount = 0;
if (promo.type === "percentage") {
  discount = (promo.value / 100) * eligibleTotal;
} else if (promo.type === "fixed") {
  discount = Math.min(promo.value, eligibleTotal); // prevent negative
}

✅ Best Practice

Always apply coupons on the current selling price (salePrice).

If listPrice is missing, no problem → use salePrice.

listPrice is mostly for showing discounts visually (marketing), not for backend calculations.