import { MetadataRoute } from 'next'
import { getSetting } from '@/lib/actions/setting.actions'
import Product from '@/lib/db/models/product.model'
import Category from '@/lib/db/models/category.model'
import { connectToDatabase } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectToDatabase()
    const { site } = await getSetting()
    const baseUrl = site.url || 'https://bcs.vercel.app'

    // Static pages - High priority
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/page/about-us`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/page/contact-us`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/page/help`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/sign-in`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/sign-up`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
      },
    ]

    // Get all published products
    const products = await Product.find({ isPublished: true })
      .select('slug updatedAt')
      .lean()
      .limit(1000) // Limit for performance

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // Get all categories
    const categories = await Category.find({})
      .select('name slug updatedAt')
      .lean()

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/search?category=${encodeURIComponent(category.name)}`,
      lastModified: new Date(category.updatedAt || new Date()),
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    // Combine all pages
    return [...staticPages, ...productPages, ...categoryPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return minimal sitemap on error
    return [
      {
        url: 'https://bcs.vercel.app',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ]
  }
}
