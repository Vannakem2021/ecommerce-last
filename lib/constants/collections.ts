// Featured Collections for Home Page
// TODO: Move to database in the future

export interface FeaturedCollection {
  id: string
  title: string
  description: string
  image: string
  link: string
}

export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    id: 'smartphones',
    title: 'Latest Smartphones',
    description: 'Discover the newest and most powerful smartphones',
    image: '/images/smartphones.jpg',
    link: '/search?category=Smartphones',
  },
  {
    id: 'laptops',
    title: 'Powerful Laptops',
    description: 'Performance meets portability in our laptop collection',
    image: '/images/laptops.jpg',
    link: '/search?category=Laptops',
  },
]
