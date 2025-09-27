// Helper function to generate user-friendly product SKUs
export const generateProductSKU = (id: string, name: string, category?: string) => {
  // Get category prefix (first 3 letters, uppercase)
  const categoryPrefix = category
    ? category.substring(0, 3).toUpperCase()
    : 'PRD'

  // Get product name prefix (first 3 letters of first word, uppercase)
  const namePrefix = name
    .split(' ')[0]
    .substring(0, 3)
    .toUpperCase()

  // Get short ID from MongoDB ObjectID (last 4 characters, uppercase)
  const shortId = id.slice(-4).toUpperCase()

  return `${categoryPrefix}-${namePrefix}-${shortId}`
}

// Helper function to get stock status and color
export const getStockStatus = (stock: number, lowStockThreshold: number = 10) => {
  if (stock === 0) {
    return {
      status: 'Out of Stock',
      color: 'destructive',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950'
    }
  } else if (stock <= lowStockThreshold) {
    return {
      status: 'Low Stock',
      color: 'warning' as const,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950'
    }
  } else {
    return {
      status: 'In Stock',
      color: 'default' as const,
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    }
  }
}

// Helper function to calculate product metrics
export const calculateProductMetrics = (products: any[]) => {
  const totalProducts = products.length
  const publishedProducts = products.filter(p => p.isPublished).length
  const draftProducts = totalProducts - publishedProducts
  const lowStockCount = products.filter(p => p.countInStock <= 10 && p.countInStock > 0).length
  const outOfStockCount = products.filter(p => p.countInStock === 0).length

  const totalValue = products.reduce((sum, product) => {
    return sum + (product.price * product.countInStock)
  }, 0)

  const avgRating = products.length > 0
    ? products.reduce((sum, product) => sum + (product.avgRating || 0), 0) / products.length
    : 0

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    lowStockCount,
    outOfStockCount,
    totalValue,
    avgRating: Math.round(avgRating * 10) / 10 // Round to 1 decimal
  }
}