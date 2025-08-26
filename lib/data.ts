import { Data, IProductInput, IUserInput } from "@/types";
import { toSlug } from "./utils";
import bcrypt from "bcryptjs";
import { i18n } from "@/i18n-config";

const users: IUserInput[] = [
  {
    name: "John",
    email: "admin@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "admin",
    address: {
      fullName: "John Doe",
      street: "111 Main St",
      city: "New York",
      province: "NY",
      postalCode: "10001",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Stripe",
    emailVerified: false,
  },
  {
    name: "Jane",
    email: "jane@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "manager",
    address: {
      fullName: "Jane Harris",
      street: "222 Main St",
      city: "New York",
      province: "NY",
      postalCode: "1002",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Cash On Delivery",
    emailVerified: false,
  },
  {
    name: "Jack",
    email: "jack@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "seller",
    address: {
      fullName: "Jack Ryan",
      street: "333 Main St",
      city: "New York",
      province: "NY",
      postalCode: "1003",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "PayPal",
    emailVerified: false,
  },
  {
    name: "Sarah",
    email: "sarah@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Sarah Smith",
      street: "444 Main St",
      city: "New York",
      province: "NY",
      postalCode: "1005",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Cash On Delivery",
    emailVerified: false,
  },
  {
    name: "Michael",
    email: "michael@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "John Alexander",
      street: "555 Main St",
      city: "New York",
      province: "NY",
      postalCode: "1006",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "PayPal",
    emailVerified: false,
  },
  {
    name: "Emily",
    email: "emily@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Emily Johnson",
      street: "666 Main St",
      city: "New York",
      province: "NY",
      postalCode: "10001",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Stripe",
    emailVerified: false,
  },
  {
    name: "Alice",
    email: "alice@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Alice Cooper",
      street: "777 Main St",
      city: "New York",
      province: "NY",
      postalCode: "10007",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Cash On Delivery",
    emailVerified: false,
  },
  {
    name: "Tom",
    email: "tom@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Tom Hanks",
      street: "888 Main St",
      city: "New York",
      province: "NY",
      postalCode: "10008",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Stripe",
    emailVerified: false,
  },
  {
    name: "Linda",
    email: "linda@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Linda Holmes",
      street: "999 Main St",
      city: "New York",
      province: "NY",
      postalCode: "10009",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "PayPal",
    emailVerified: false,
  },
  {
    name: "George",
    email: "george@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "George Smith",
      street: "101 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10010",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Stripe",
    emailVerified: false,
  },
  {
    name: "Jessica",
    email: "jessica@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Jessica Brown",
      street: "102 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10011",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Cash On Delivery",
    emailVerified: false,
  },
  {
    name: "Chris",
    email: "chris@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Chris Evans",
      street: "103 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10012",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "PayPal",
    emailVerified: false,
  },
  {
    name: "Samantha",
    email: "samantha@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Samantha Wilson",
      street: "104 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10013",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Stripe",
    emailVerified: false,
  },
  {
    name: "David",
    email: "david@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "David Lee",
      street: "105 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10014",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "Cash On Delivery",
    emailVerified: false,
  },
  {
    name: "Anna",
    email: "anna@example.com",
    password: bcrypt.hashSync("123456", 5),
    role: "user",
    address: {
      fullName: "Anna Smith",
      street: "106 First Ave",
      city: "New York",
      province: "NY",
      postalCode: "10015",
      country: "USA",
      phone: "123-456-7890",
    },
    paymentMethod: "PayPal",
    emailVerified: false,
  },
];

const products: IProductInput[] = [
 {
  name: "Apple iPhone 15 Pro Max",
  slug: toSlug("Apple iPhone 15 Pro Max"),
  category: "Smartphones",
  images: ["/images/p1-1.jpg", "/images/p1-2.jpg"],
  tags: ["new-arrival", "bestseller"],
  isPublished: true,
  price: 1199,
  listPrice: 1299,
  brand: "Apple",
  avgRating: 4.8,
  numReviews: 120,
  ratingDistribution: [
    { rating: 1, count: 2 },
    { rating: 2, count: 1 },
    { rating: 3, count: 6 },
    { rating: 4, count: 20 },
    { rating: 5, count: 91 },
  ],
  numSales: 340,
  countInStock: 42,
  description: "Apple's flagship phone with A17 Pro chip, titanium build, and advanced camera system.",
  sizes: ["128GB", "256GB", "512GB", "1TB"],
  colors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"],
  reviews: [],
},
{
  name: "Samsung Galaxy S23 Ultra",
  slug: toSlug("Samsung Galaxy S23 Ultra"),
  category: "Smartphones",
  images: ["/images/p2-1.jpg", "/images/p2-2.jpg"],
  tags: ["featured"],
  isPublished: true,
  price: 1099,
  listPrice: 1199,
  brand: "Samsung",
  avgRating: 4.7,
  numReviews: 98,
  ratingDistribution: [
    { rating: 1, count: 3 },
    { rating: 2, count: 2 },
    { rating: 3, count: 7 },
    { rating: 4, count: 25 },
    { rating: 5, count: 61 },
  ],
  numSales: 280,
  countInStock: 36,
  description: "Premium smartphone with S Pen, 200MP camera, and Snapdragon 8 Gen 2 processor.",
  sizes: ["256GB", "512GB", "1TB"],
  colors: ["Phantom Black", "Green", "Cream", "Lavender"],
  reviews: [],
},
{
  name: "Dell XPS 15 Laptop",
  slug: toSlug("Dell XPS 15 Laptop"),
  category: "Laptops",
  images: ["/images/p3-1.jpg", "/images/p3-2.jpg"],
  tags: ["new-arrival"],
  isPublished: true,
  price: 1699,
  listPrice: 1799,
  brand: "Dell",
  avgRating: 4.6,
  numReviews: 76,
  ratingDistribution: [
    { rating: 1, count: 2 },
    { rating: 2, count: 3 },
    { rating: 3, count: 8 },
    { rating: 4, count: 20 },
    { rating: 5, count: 43 },
  ],
  numSales: 150,
  countInStock: 22,
  description: "High-performance laptop with Intel Core i7, RTX 4070, and stunning 4K OLED display.",
  sizes: ["512GB SSD", "1TB SSD"],
  colors: ["Silver", "Black"],
  reviews: [],
},
{
  name: "MacBook Air M2",
  slug: toSlug("MacBook Air M2"),
  category: "Laptops",
  images: ["/images/p4-1.jpg", "/images/p4-2.jpg"],
  tags: ["bestseller"],
  isPublished: true,
  price: 1249,
  listPrice: 1399,
  brand: "Apple",
  avgRating: 4.9,
  numReviews: 210,
  ratingDistribution: [
    { rating: 1, count: 1 },
    { rating: 2, count: 1 },
    { rating: 3, count: 6 },
    { rating: 4, count: 18 },
    { rating: 5, count: 184 },
  ],
  numSales: 500,
  countInStock: 60,
  description: "Ultra-thin laptop with Apple M2 chip, Liquid Retina display, and 18-hour battery life.",
  sizes: ["256GB", "512GB", "1TB"],
  colors: ["Midnight", "Starlight", "Silver", "Space Gray"],
  reviews: [],
},
{
  name: "Asus ROG Strix G16 Gaming Laptop",
  slug: toSlug("Asus ROG Strix G16 Gaming Laptop"),
  category: "Laptops",
  images: ["/images/p5-1.jpg", "/images/p5-2.jpg"],
  tags: ["gaming"],
  isPublished: true,
  price: 1499,
  listPrice: 1599,
  brand: "Asus",
  avgRating: 4.5,
  numReviews: 60,
  ratingDistribution: [
    { rating: 1, count: 2 },
    { rating: 2, count: 4 },
    { rating: 3, count: 6 },
    { rating: 4, count: 20 },
    { rating: 5, count: 28 },
  ],
  numSales: 130,
  countInStock: 18,
  description: "Gaming laptop with Intel i9, RTX 4070, and 240Hz display.",
  sizes: ["512GB SSD", "1TB SSD"],
  colors: ["Black", "Gray"],
  reviews: [],
},
{
  name: "Microsoft Surface Pro 9",
  slug: toSlug("Microsoft Surface Pro 9"),
  category: "Tablets",
  images: ["/images/p6-1.jpg", "/images/p6-2.jpg"],
  tags: ["2-in-1"],
  isPublished: true,
  price: 999,
  listPrice: 1099,
  brand: "Microsoft",
  avgRating: 4.4,
  numReviews: 54,
  ratingDistribution: [
    { rating: 1, count: 3 },
    { rating: 2, count: 3 },
    { rating: 3, count: 10 },
    { rating: 4, count: 15 },
    { rating: 5, count: 23 },
  ],
  numSales: 90,
  countInStock: 25,
  description: "Versatile 2-in-1 tablet with 13” PixelSense touchscreen, 5G support, and long battery life.",
  sizes: ["128GB", "256GB", "512GB"],
  colors: ["Platinum", "Sapphire", "Forest"],
  reviews: [],
},
{
  name: "HP Pavilion Gaming Desktop",
  slug: toSlug("HP Pavilion Gaming Desktop"),
  category: "PCs",
  images: ["/images/p7-1.jpg", "/images/p7-2.jpg"],
  tags: ["gaming", "desktop"],
  isPublished: true,
  price: 899,
  listPrice: 999,
  brand: "HP",
  avgRating: 4.3,
  numReviews: 40,
  ratingDistribution: [
    { rating: 1, count: 2 },
    { rating: 2, count: 3 },
    { rating: 3, count: 7 },
    { rating: 4, count: 12 },
    { rating: 5, count: 16 },
  ],
  numSales: 75,
  countInStock: 12,
  description: "Affordable gaming PC with AMD Ryzen 7, GTX 1660 Super, and expandable storage.",
  sizes: ["512GB SSD", "1TB HDD + 256GB SSD"],
  colors: ["Black"],
  reviews: [],
},
{
  name: "Lenovo ThinkPad X1 Carbon",
  slug: toSlug("Lenovo ThinkPad X1 Carbon"),
  category: "Laptops",
  images: ["/images/p8-1.jpg", "/images/p8-2.jpg"],
  tags: ["business"],
  isPublished: true,
  price: 1399,
  listPrice: 1499,
  brand: "Lenovo",
  avgRating: 4.7,
  numReviews: 88,
  ratingDistribution: [
    { rating: 1, count: 1 },
    { rating: 2, count: 2 },
    { rating: 3, count: 8 },
    { rating: 4, count: 22 },
    { rating: 5, count: 55 },
  ],
  numSales: 140,
  countInStock: 20,
  description: "Lightweight business laptop with Intel Evo platform, Dolby Vision, and all-day battery.",
  sizes: ["512GB SSD", "1TB SSD"],
  colors: ["Black"],
  reviews: [],
},
{
  name: "Apple iPad Pro 12.9 (M2)",
  slug: toSlug("Apple iPad Pro 12.9 (M2)"),
  category: "Tablets",
  images: ["/images/p9-1.jpg", "/images/p9-2.jpg"],
  tags: ["premium"],
  isPublished: true,
  price: 1099,
  listPrice: 1199,
  brand: "Apple",
  avgRating: 4.8,
  numReviews: 150,
  ratingDistribution: [
    { rating: 1, count: 1 },
    { rating: 2, count: 2 },
    { rating: 3, count: 7 },
    { rating: 4, count: 28 },
    { rating: 5, count: 112 },
  ],
  numSales: 300,
  countInStock: 35,
  description: "Powerful tablet with Apple M2 chip, Liquid Retina XDR display, and Apple Pencil 2 support.",
  sizes: ["128GB", "256GB", "512GB", "1TB", "2TB"],
  colors: ["Silver", "Space Gray"],
  reviews: [],
},
{
  name: "Sony WH-1000XM5 Wireless Headphones",
  slug: toSlug("Sony WH-1000XM5 Wireless Headphones"),
  category: "Headphones",
  images: ["/images/p10-1.jpg", "/images/p10-2.jpg"],
  tags: ["audio", "bestseller"],
  isPublished: true,
  price: 399,
  listPrice: 449,
  brand: "Sony",
  avgRating: 4.9,
  numReviews: 210,
  ratingDistribution: [
    { rating: 1, count: 1 },
    { rating: 2, count: 2 },
    { rating: 3, count: 4 },
    { rating: 4, count: 25 },
    { rating: 5, count: 178 },
  ],
  numSales: 500,
  countInStock: 50,
  description: "Industry-leading noise cancellation headphones with premium sound and 30-hour battery life.",
  sizes: ["One Size"],
  colors: ["Black", "Silver"],
  reviews: [],
}

];
const reviews = [
  {
    rating: 1,
    title: "Poor quality",
    comment:
      "Very disappointed. The item broke after just a few uses. Not worth the money.",
  },
  {
    rating: 2,
    title: "Disappointed",
    comment:
      "Not as expected. The material feels cheap, and it didn't fit well. Wouldn't buy again.",
  },
  {
    rating: 2,
    title: "Needs improvement",
    comment:
      "It looks nice but doesn't perform as expected. Wouldn't recommend without upgrades.",
  },
  {
    rating: 3,
    title: "not bad",
    comment:
      "This product is decent, the quality is good but it could use some improvements in the details.",
  },
  {
    rating: 3,
    title: "Okay, not great",
    comment:
      "It works, but not as well as I hoped. Quality is average and lacks some finishing.",
  },
  {
    rating: 3,
    title: "Good product",
    comment:
      "This product is amazing, I love it! The quality is top notch, the material is comfortable and breathable.",
  },
  {
    rating: 4,
    title: "Pretty good",
    comment:
      "Solid product! Great value for the price, but there's room for minor improvements.",
  },
  {
    rating: 4,
    title: "Very satisfied",
    comment:
      "Good product! High quality and worth the price. Would consider buying again.",
  },
  {
    rating: 4,
    title: "Absolutely love it!",
    comment:
      "Perfect in every way! The quality, design, and comfort exceeded all my expectations.",
  },
  {
    rating: 4,
    title: "Exceeded expectations!",
    comment:
      "Fantastic product! High quality, feels durable, and performs well. Highly recommend!",
  },
  {
    rating: 5,
    title: "Perfect purchase!",
    comment:
      "Couldn't be happier with this product. The quality is excellent, and it works flawlessly!",
  },
  {
    rating: 5,
    title: "Highly recommend",
    comment:
      "Amazing product! Worth every penny, great design, and feels premium. I'm very satisfied.",
  },
  {
    rating: 5,
    title: "Just what I needed",
    comment:
      "Exactly as described! Quality exceeded my expectations, and it arrived quickly.",
  },
  {
    rating: 5,
    title: "Excellent choice!",
    comment:
      "This product is outstanding! Everything about it feels top-notch, from material to functionality.",
  },
  {
    rating: 5,
    title: "Couldn't ask for more!",
    comment:
      "Love this product! It's durable, stylish, and works great. Would buy again without hesitation.",
  },
];

const data: Data = {
  users,
  products,
  reviews,
  webPages: [
    {
      title: "About Us",
      slug: "about-us",
      content: `Welcome to [Your Store Name], your trusted destination for quality products and exceptional service. Our journey began with a mission to bring you the best shopping experience by offering a wide range of products at competitive prices, all in one convenient platform.

At [Your Store Name], we prioritize customer satisfaction and innovation. Our team works tirelessly to curate a diverse selection of items, from everyday essentials to exclusive deals, ensuring there's something for everyone. We also strive to make your shopping experience seamless with fast shipping, secure payments, and excellent customer support.

As we continue to grow, our commitment to quality and service remains unwavering. Thank you for choosing [Your Store Name]—we look forward to being a part of your journey and delivering value every step of the way.`,
      isPublished: true,
    },
    {
      title: "Contact Us",
      slug: "contact-us",
      content: `We’re here to help! If you have any questions, concerns, or feedback, please don’t hesitate to reach out to us. Our team is ready to assist you and ensure you have the best shopping experience.

**Customer Support**
For inquiries about orders, products, or account-related issues, contact our customer support team:
- **Email:** support@example.com
- **Phone:** +1 (123) 456-7890
- **Live Chat:** Available on our website from 9 AM to 6 PM (Monday to Friday).

**Head Office**
For corporate or business-related inquiries, reach out to our headquarters:
- **Address:** 1234 E-Commerce St, Suite 567, Business City, BC 12345
- **Phone:** +1 (987) 654-3210

We look forward to assisting you! Your satisfaction is our priority.
`,
      isPublished: true,
    },
    {
      title: "Help",
      slug: "help",
      content: `Welcome to our Help Center! We're here to assist you with any questions or concerns you may have while shopping with us. Whether you need help with orders, account management, or product inquiries, this page provides all the information you need to navigate our platform with ease.

**Placing and Managing Orders**
Placing an order is simple and secure. Browse our product categories, add items to your cart, and proceed to checkout. Once your order is placed, you can track its status through your account under the "My Orders" section. If you need to modify or cancel your order, please contact us as soon as possible for assistance.

**Shipping and Returns**
We offer a variety of shipping options to suit your needs, including standard and express delivery. For detailed shipping costs and delivery timelines, visit our Shipping Policy page. If you're not satisfied with your purchase, our hassle-free return process allows you to initiate a return within the specified timeframe. Check our Returns Policy for more details.

**Account and Support**
Managing your account is easy. Log in to update your personal information, payment methods, and saved addresses. If you encounter any issues or need further assistance, our customer support team is available via email, live chat, or phone. Visit our Contact Us page for support hours and contact details.`,
      isPublished: true,
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: `We value your privacy and are committed to protecting your personal information. This Privacy Notice explains how we collect, use, and share your data when you interact with our services. By using our platform, you consent to the practices described herein.

We collect data such as your name, email address, and payment details to provide you with tailored services and improve your experience. This information may also be used for marketing purposes, but only with your consent. Additionally, we may share your data with trusted third-party providers to facilitate transactions or deliver products.

Your data is safeguarded through robust security measures to prevent unauthorized access. However, you have the right to access, correct, or delete your personal information at any time. For inquiries or concerns regarding your privacy, please contact our support team.`,
      isPublished: true,
    },
    {
      title: "Conditions of Use",
      slug: "conditions-of-use",
      content: `Welcome to [Ecommerce Website Name]. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. These terms govern your use of our platform, including browsing, purchasing products, and interacting with any content or services provided. You must be at least 18 years old or have the consent of a parent or guardian to use this website. Any breach of these terms may result in the termination of your access to our platform.

We strive to ensure all product descriptions, pricing, and availability information on our website are accurate. However, errors may occur, and we reserve the right to correct them without prior notice. All purchases are subject to our return and refund policy. By using our site, you acknowledge that your personal information will be processed according to our privacy policy, ensuring your data is handled securely and responsibly. Please review these terms carefully before proceeding with any transactions.
`,
      isPublished: true,
    },
    {
      title: "Customer Service",
      slug: "customer-service",
      content: `At [Your Store Name], our customer service team is here to ensure you have the best shopping experience. Whether you need assistance with orders, product details, or returns, we are committed to providing prompt and helpful support.

If you have questions or concerns, please reach out to us through our multiple contact options:
- **Email:** support@example.com
- **Phone:** +1 (123) 456-7890
- **Live Chat:** Available on our website for instant assistance

We also provide helpful resources such as order tracking, product guides, and FAQs to assist you with common inquiries. Your satisfaction is our priority, and we’re here to resolve any issues quickly and efficiently. Thank you for choosing us!`,
      isPublished: true,
    },
    {
      title: "Returns Policy",
      slug: "returns-policy",
      content: "Returns Policy Content",
      isPublished: true,
    },
    {
      title: "Careers",
      slug: "careers",
      content: "careers Content",
      isPublished: true,
    },
    {
      title: "Blog",
      slug: "blog",
      content: "Blog Content",
      isPublished: true,
    },
    {
      title: "Sell Products",
      slug: "sell",
      content: `Sell Products Content`,
      isPublished: true,
    },
    {
      title: "Become Affiliate",
      slug: "become-affiliate",
      content: "Become Affiliate Content",
      isPublished: true,
    },
    {
      title: "Advertise Your Products",
      slug: "advertise",
      content: "Advertise Your Products",
      isPublished: true,
    },
    {
      title: "Shipping Rates & Policies",
      slug: "shipping",
      content: "Shipping Rates & Policies",
      isPublished: true,
    },
  ],
  headerMenus: [
    {
      name: "Today's Deal",
      href: "/search?tag=todays-deal",
    },
    {
      name: "New Arrivals",
      href: "/search?tag=new-arrival",
    },
    {
      name: "Featured Products",
      href: "/search?tag=featured",
    },
    {
      name: "Best Sellers",
      href: "/search?tag=best-seller",
    },
    {
      name: "Browsing History",
      href: "/#browsing-history",
    },
    {
      name: "Customer Service",
      href: "/page/customer-service",
    },
    {
      name: "About Us",
      href: "/page/about-us",
    },
    {
      name: "Help",
      href: "/page/help",
    },
  ],
  carousels: [
    {
      title: "Most Popular Shoes For Sale",
      buttonCaption: "Shop Now",
      image: "/images/banner3.jpg",
      url: "/search?category=Shoes",
      isPublished: true,
    },
    {
      title: "Best Sellers in T-Shirts",
      buttonCaption: "Shop Now",
      image: "/images/banner1.jpg",
      url: "/search?category=T-Shirts",
      isPublished: true,
    },
    {
      title: "Best Deals on Wrist Watches",
      buttonCaption: "See More",
      image: "/images/banner2.jpg",
      url: "/search?category=Wrist Watches",
      isPublished: true,
    },
  ],
  settings: [
    {
      common: {
        freeShippingMinPrice: 35,
        isMaintenanceMode: false,
        defaultTheme: "Light",
        defaultColor: "Gold",
        pageSize: 9,
      },
      site: {
        name: "NxtAmzn",
        description:
          "NxtAmzn is a sample Ecommerce website built with Next.js, Tailwind CSS, and MongoDB.",
        keywords: "Next Ecommerce, Next.js, Tailwind CSS, MongoDB",
        url: "https://next-mongo-ecommerce-final.vercel.app",
        logo: "/icons/logo.svg",
        slogan: "Spend less, enjoy more.",
        author: "Next Ecommerce",
        copyright: "2000-2024, Next-Ecommerce.com, Inc. or its affiliates",
        email: "admin@example.com",
        address: "123, Main Street, Anytown, CA, Zip 12345",
        phone: "+1 (123) 456-7890",
      },
      carousels: [
        {
          title: "Most Popular Shoes For Sale",
          buttonCaption: "Shop Now",
          image: "/images/banner3.jpg",
          url: "/search?category=Shoes",
        },
        {
          title: "Best Sellers in T-Shirts",
          buttonCaption: "Shop Now",
          image: "/images/banner1.jpg",
          url: "/search?category=T-Shirts",
        },
        {
          title: "Best Deals on Wrist Watches",
          buttonCaption: "See More",
          image: "/images/banner2.jpg",
          url: "/search?category=Wrist Watches",
        },
      ],
      availableLanguages: i18n.locales.map((locale) => ({
        code: locale.code,
        name: locale.name,
      })),
      defaultLanguage: "en-US",
      availableCurrencies: [
        {
          name: "United States Dollar",
          code: "USD",
          symbol: "$",
          convertRate: 1,
        },
        { name: "Euro", code: "EUR", symbol: "€", convertRate: 0.96 },
        { name: "UAE Dirham", code: "AED", symbol: "AED", convertRate: 3.67 },
      ],
      defaultCurrency: "USD",
      availablePaymentMethods: [
        { name: "PayPal", commission: 0 },
        { name: "Stripe", commission: 0 },
        { name: "ABA PayWay", commission: 0 },
        { name: "Cash On Delivery", commission: 0 },
      ],
      defaultPaymentMethod: "PayPal",
      availableDeliveryDates: [
        {
          name: "Tomorrow",
          daysToDeliver: 1,
          shippingPrice: 12.9,
          freeShippingMinPrice: 0,
        },
        {
          name: "Next 3 Days",
          daysToDeliver: 3,
          shippingPrice: 6.9,
          freeShippingMinPrice: 0,
        },
        {
          name: "Next 5 Days",
          daysToDeliver: 5,
          shippingPrice: 4.9,
          freeShippingMinPrice: 35,
        },
      ],
      defaultDeliveryDate: "Next 5 Days",
      // ABA PayWay configuration
      abaPayWay: {
        enabled: false,
        merchantId: "",
        sandboxMode: true,
      },
      // Telegram notification configuration
      telegram: {
        enabled: false,
        botToken: "",
        chatId: "",
        notificationTypes: {
          orderPaid: true,
          orderDelivered: false,
        },
      },
    },
  ],
};

export default data;
