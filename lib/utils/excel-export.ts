import ExcelJS from 'exceljs'
import { IOrderList } from '@/types'

/**
 * Generate formatted order number from MongoDB ObjectId and date
 * Uses custom orderId if available, otherwise generates from _id
 * Format: ORD-YYMMDD-XXXX
 */
function generateOrderNumber(id: string, createdAt: Date, orderId?: string): string {
  // If custom orderId is provided, use it
  if (orderId) {
    return orderId
  }
  
  // Fallback: Generate from MongoDB _id and date
  const date = new Date(createdAt)
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const shortId = id.slice(-4).toUpperCase()
  return `ORD-${year}${month}${day}-${shortId}`
}

/**
 * Format shipping address as single line
 */
function formatAddress(address: any): string {
  if (!address) return 'N/A'
  const parts = [
    address.fullName,
    address.streetAddress,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ].filter(Boolean)
  return parts.join(', ')
}

/**
 * Get status text based on order state
 */
function getOrderStatus(order: IOrderList): string {
  if (order.isDelivered) return 'Delivered'
  if (order.isPaid) return 'Paid'
  return 'Pending Payment'
}

/**
 * Generate Excel file from orders data
 * @param orders - Array of orders to export
 * @returns Excel file buffer
 */
export async function generateOrdersExcel(orders: IOrderList[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Set workbook properties
  workbook.creator = 'E-Commerce Admin'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  // Create Orders Summary Sheet
  const worksheet = workbook.addWorksheet('Orders Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze header row
  })
  
  // Define columns
  worksheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 20 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Customer Name', key: 'customerName', width: 25 },
    { header: 'Customer Email', key: 'customerEmail', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Items', key: 'itemsCount', width: 10 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 20 },
    { header: 'Shipping Address', key: 'shippingAddress', width: 50 },
  ]
  
  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo color
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25
  
  // Add data rows
  orders.forEach((order) => {
    const row = worksheet.addRow({
      orderId: generateOrderNumber(order._id, order.createdAt, (order as any).orderId),
      date: new Date(order.createdAt),
      customerName: order.user?.name || 'N/A',
      customerEmail: order.user?.email || 'N/A',
      status: getOrderStatus(order),
      paymentStatus: order.isPaid ? 'Paid' : 'Unpaid',
      itemsCount: order.items.length,
      totalAmount: order.totalPrice,
      paymentMethod: order.paymentMethod || 'N/A',
      shippingAddress: formatAddress(order.shippingAddress),
    })
    
    // Format date column
    const dateCell = row.getCell('date')
    dateCell.numFmt = 'yyyy-mm-dd hh:mm:ss'
    
    // Format currency column
    const amountCell = row.getCell('totalAmount')
    amountCell.numFmt = '$#,##0.00'
    
    // Center align some columns
    row.getCell('itemsCount').alignment = { horizontal: 'center' }
    row.getCell('status').alignment = { horizontal: 'center' }
    row.getCell('paymentStatus').alignment = { horizontal: 'center' }
    
    // Color code status
    const statusCell = row.getCell('status')
    if (order.isDelivered) {
      statusCell.font = { color: { argb: 'FF16A34A' } } // Green
    } else if (order.isPaid) {
      statusCell.font = { color: { argb: 'FF2563EB' } } // Blue
    } else {
      statusCell.font = { color: { argb: 'FFDC2626' } } // Red
    }
  })
  
  // Enable auto-filter on header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  }
  
  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Create Order Items Details Sheet (Optional)
  const itemsSheet = workbook.addWorksheet('Order Items', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  })
  
  itemsSheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 20 },
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Size', key: 'size', width: 10 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit Price', key: 'unitPrice', width: 15 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
  ]
  
  // Style header
  const itemsHeaderRow = itemsSheet.getRow(1)
  itemsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  itemsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }, // Green color
  }
  itemsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
  itemsHeaderRow.height = 25
  
  // Add item data
  orders.forEach((order) => {
    const orderId = generateOrderNumber(order._id, order.createdAt, (order as any).orderId)
    order.items.forEach((item) => {
      const row = itemsSheet.addRow({
        orderId,
        productName: item.name,
        sku: item.sku || 'N/A',
        color: item.color || 'N/A',
        size: item.size || 'N/A',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })
      
      // Format currency
      row.getCell('unitPrice').numFmt = '$#,##0.00'
      row.getCell('subtotal').numFmt = '$#,##0.00'
      
      // Center align
      row.getCell('quantity').alignment = { horizontal: 'center' }
      row.getCell('color').alignment = { horizontal: 'center' }
      row.getCell('size').alignment = { horizontal: 'center' }
    })
  })
  
  // Enable auto-filter
  itemsSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: itemsSheet.columns.length },
  }
  
  // Add borders
  itemsSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Get stock status text based on count
 */
function getStockStatus(stock: number): string {
  if (stock > 10) return 'In Stock'
  if (stock >= 1) return 'Low Stock'
  return 'Out of Stock'
}

/**
 * Get stock status color
 */
function getStockStatusColor(stock: number): string {
  if (stock > 10) return 'FF16A34A' // Green
  if (stock >= 1) return 'FFF59E0B' // Orange
  return 'FFDC2626' // Red
}

/**
 * Generate Excel file from products data
 * @param products - Array of products to export
 * @returns Excel file buffer
 */
export async function generateProductsExcel(products: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Set workbook properties
  workbook.creator = 'E-Commerce Admin'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  // Create Products Summary Sheet
  const worksheet = workbook.addWorksheet('Products Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze header row
  })
  
  // Define columns (matching Products table: no stock info)
  worksheet.columns = [
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Reviews', key: 'reviews', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created Date', key: 'createdAt', width: 20 },
  ]
  
  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo color
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25
  
  // Add data rows
  products.forEach((product) => {
    const categoryName = typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : 'N/A'
    const brandName = typeof product.brand === 'object' && product.brand !== null
      ? product.brand.name
      : 'N/A'
    
    const row = worksheet.addRow({
      name: product.name,
      category: categoryName,
      price: product.price,
      rating: product.avgRating || 0,
      reviews: product.numReviews || 0,
      status: product.isPublished ? 'Published' : 'Draft',
      createdAt: new Date(product.createdAt),
    })
    
    // Format currency column
    row.getCell('price').numFmt = '$#,##0.00'
    
    // Format date column
    const dateCell = row.getCell('createdAt')
    dateCell.numFmt = 'yyyy-mm-dd hh:mm:ss'
    
    // Format rating (1 decimal)
    const ratingCell = row.getCell('rating')
    ratingCell.numFmt = '0.0'
    
    // Center align columns
    row.getCell('status').alignment = { horizontal: 'center' }
    row.getCell('rating').alignment = { horizontal: 'center' }
    row.getCell('reviews').alignment = { horizontal: 'center' }
    
    // Color code publish status
    const statusCell = row.getCell('status')
    if (product.isPublished) {
      statusCell.font = { color: { argb: 'FF16A34A' }, bold: true } // Green
    } else {
      statusCell.font = { color: { argb: 'FF6B7280' }, bold: true } // Gray
    }
  })
  
  // Enable auto-filter on header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  }
  
  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Create Product Variants Sheet
  const variantsSheet = workbook.addWorksheet('Product Variants', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  })
  
  variantsSheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Variant Type', key: 'variantType', width: 15 },
    { header: 'Variant Value', key: 'variantValue', width: 20 },
    { header: 'Price Modifier', key: 'priceModifier', width: 15 },
    { header: 'Final Price', key: 'finalPrice', width: 15 },
  ]
  
  // Style header
  const variantsHeaderRow = variantsSheet.getRow(1)
  variantsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  variantsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }, // Green color
  }
  variantsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
  variantsHeaderRow.height = 25
  
  // Add variant data
  products.forEach((product) => {
    const basePrice = product.price
    const sku = product.sku || 'N/A'
    const name = product.name
    
    // Storage variants
    if (product.variants?.storage && Array.isArray(product.variants.storage)) {
      product.variants.storage.forEach((variant: any) => {
        const row = variantsSheet.addRow({
          sku,
          name,
          variantType: 'Storage',
          variantValue: variant.value,
          priceModifier: variant.priceModifier || 0,
          finalPrice: basePrice + (variant.priceModifier || 0),
        })
        
        // Format currency
        row.getCell('priceModifier').numFmt = '$#,##0.00'
        row.getCell('finalPrice').numFmt = '$#,##0.00'
        
        // Center align
        row.getCell('variantType').alignment = { horizontal: 'center' }
        row.getCell('variantValue').alignment = { horizontal: 'center' }
      })
    }
    
    // RAM variants
    if (product.variants?.ram && Array.isArray(product.variants.ram)) {
      product.variants.ram.forEach((variant: any) => {
        const row = variantsSheet.addRow({
          sku,
          name,
          variantType: 'RAM',
          variantValue: variant.value,
          priceModifier: variant.priceModifier || 0,
          finalPrice: basePrice + (variant.priceModifier || 0),
        })
        
        // Format currency
        row.getCell('priceModifier').numFmt = '$#,##0.00'
        row.getCell('finalPrice').numFmt = '$#,##0.00'
        
        // Center align
        row.getCell('variantType').alignment = { horizontal: 'center' }
        row.getCell('variantValue').alignment = { horizontal: 'center' }
      })
    }
    
    // Color variants (no price modifier)
    if (product.variants?.colors && Array.isArray(product.variants.colors)) {
      product.variants.colors.forEach((color: string) => {
        const row = variantsSheet.addRow({
          sku,
          name,
          variantType: 'Color',
          variantValue: color,
          priceModifier: 0,
          finalPrice: basePrice,
        })
        
        // Format currency
        row.getCell('priceModifier').numFmt = '$#,##0.00'
        row.getCell('finalPrice').numFmt = '$#,##0.00'
        
        // Center align
        row.getCell('variantType').alignment = { horizontal: 'center' }
        row.getCell('variantValue').alignment = { horizontal: 'center' }
      })
    }
    
    // Legacy support: colors array (old format)
    if (!product.variants?.colors && product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      product.colors.forEach((color: string) => {
        const row = variantsSheet.addRow({
          sku,
          name,
          variantType: 'Color',
          variantValue: color,
          priceModifier: 0,
          finalPrice: basePrice,
        })
        
        // Format currency
        row.getCell('priceModifier').numFmt = '$#,##0.00'
        row.getCell('finalPrice').numFmt = '$#,##0.00'
        
        // Center align
        row.getCell('variantType').alignment = { horizontal: 'center' }
        row.getCell('variantValue').alignment = { horizontal: 'center' }
      })
    }
  })
  
  // Enable auto-filter
  variantsSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: variantsSheet.columns.length },
  }
  
  // Add borders
  variantsSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Get stock status text based on count
 */
function getInventoryStockStatus(stock: number): string {
  if (stock > 10) return 'In Stock'
  if (stock >= 1) return 'Low Stock'
  return 'Out of Stock'
}

/**
 * Get stock status color for inventory
 */
function getInventoryStockStatusColor(stock: number): string {
  if (stock > 10) return 'FF16A34A' // Green
  if (stock >= 1) return 'FFF59E0B' // Orange
  return 'FFDC2626' // Red
}

/**
 * Get action status text
 */
function getActionStatus(stock: number): string {
  if (stock === 0) return 'RESTOCK URGENT'
  if (stock <= 10) return 'Restock Soon'
  return 'Stock OK'
}

/**
 * Get action status color
 */
function getActionStatusColor(stock: number): string {
  if (stock === 0) return 'FFDC2626' // Red
  if (stock <= 10) return 'FFF59E0B' // Orange
  return 'FF16A34A' // Green
}

/**
 * Generate Excel file from inventory data
 * @param products - Array of products to export
 * @returns Excel file buffer
 */
export async function generateInventoryExcel(products: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Set workbook properties
  workbook.creator = 'E-Commerce Admin'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  // Create Inventory Summary Sheet
  const worksheet = workbook.addWorksheet('Inventory Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze header row
  })
  
  // Define columns (matching Inventory table: no price, no publish status)
  worksheet.columns = [
    { header: 'Product Name (SKU)', key: 'name', width: 35 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Current Stock', key: 'stock', width: 12 },
    { header: 'Stock Status', key: 'stockStatus', width: 15 },
    { header: 'Last Updated', key: 'updatedAt', width: 20 },
  ]
  
  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo color
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25
  
  // Add data rows
  products.forEach((product) => {
    const categoryName = typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : 'N/A'
    const brandName = typeof product.brand === 'object' && product.brand !== null
      ? product.brand.name
      : 'N/A'
    
    const sku = product.sku || 'N/A'
    const nameWithSku = `${product.name} (${sku})`
    
    const row = worksheet.addRow({
      name: nameWithSku,
      brand: brandName,
      category: categoryName,
      stock: product.countInStock,
      stockStatus: getInventoryStockStatus(product.countInStock),
      updatedAt: new Date(product.updatedAt),
    })
    
    // Format date column
    const dateCell = row.getCell('updatedAt')
    dateCell.numFmt = 'yyyy-mm-dd hh:mm:ss'
    
    // Center align columns
    row.getCell('stock').alignment = { horizontal: 'center' }
    row.getCell('stockStatus').alignment = { horizontal: 'center' }
    
    // Color code stock status
    const stockStatusCell = row.getCell('stockStatus')
    stockStatusCell.font = { 
      color: { argb: getInventoryStockStatusColor(product.countInStock) },
      bold: true
    }
  })
  
  // Enable auto-filter on header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  }
  
  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Create Stock Analysis Sheet
  const analysisSheet = workbook.addWorksheet('Stock Analysis', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  })
  
  analysisSheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Current Stock', key: 'stock', width: 12 },
    { header: 'Reorder Point', key: 'reorderPoint', width: 15 },
    { header: 'Units Below Reorder', key: 'deficit', width: 15 },
    { header: 'Stock Value', key: 'value', width: 15 },
    { header: 'Days Supply', key: 'daysSupply', width: 12 },
    { header: 'Action', key: 'action', width: 20 },
  ]
  
  // Style header
  const analysisHeaderRow = analysisSheet.getRow(1)
  analysisHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  analysisHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }, // Green color
  }
  analysisHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
  analysisHeaderRow.height = 25
  
  // Add analysis data
  products.forEach((product) => {
    const reorderPoint = 10
    const deficit = Math.max(0, reorderPoint - product.countInStock)
    const daysSupply = product.numSales > 0 
      ? Math.floor(product.countInStock / (product.numSales / 30)) 
      : 999
    
    const row = analysisSheet.addRow({
      sku: product.sku || 'N/A',
      name: product.name,
      stock: product.countInStock,
      reorderPoint: reorderPoint,
      deficit: deficit,
      value: product.price * product.countInStock,
      daysSupply: daysSupply > 365 ? 'N/A' : daysSupply,
      action: getActionStatus(product.countInStock),
    })
    
    // Format currency
    row.getCell('value').numFmt = '$#,##0.00'
    
    // Center align
    row.getCell('stock').alignment = { horizontal: 'center' }
    row.getCell('reorderPoint').alignment = { horizontal: 'center' }
    row.getCell('deficit').alignment = { horizontal: 'center' }
    row.getCell('daysSupply').alignment = { horizontal: 'center' }
    row.getCell('action').alignment = { horizontal: 'center' }
    
    // Color code action
    const actionCell = row.getCell('action')
    actionCell.font = {
      color: { argb: getActionStatusColor(product.countInStock) },
      bold: true
    }
  })
  
  // Enable auto-filter
  analysisSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: analysisSheet.columns.length },
  }
  
  // Add borders
  analysisSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
    })
  })
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Generate Excel file from users data
 * @param users - Array of users to export
 * @param userType - Type of users (customer or system)
 * @returns Excel file buffer
 */
export async function generateUsersExcel(
  users: any[],
  userType: 'customer' | 'system'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Set workbook properties
  workbook.creator = 'BCS Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Create main worksheet
  const worksheet = workbook.addWorksheet(
    userType === 'customer' ? 'Customers' : 'System Users'
  )

  // Define columns based on user type
  if (userType === 'customer') {
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email Verified', key: 'emailVerified', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Spent ($)', key: 'totalSpent', width: 18 },
      { header: 'Last Order', key: 'lastOrderDate', width: 20 },
      { header: 'Status', key: 'isActive', width: 12 },
      { header: 'Joined Date', key: 'createdAt', width: 20 },
    ]
  } else {
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Status', key: 'isActive', width: 12 },
      { header: 'Last Login', key: 'lastLoginAt', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
    ]
  }

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(1).height = 30

  // Add data rows
  users.forEach((user) => {
    const row: any = {
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      phone: user.phone || 'N/A',
      isActive: user.isActive ? 'Active' : 'Inactive',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    }

    if (userType === 'customer') {
      row.emailVerified = user.emailVerified ? 'Yes' : 'No'
      row.totalOrders = user.totalOrders || 0
      row.totalSpent = user.totalSpent ? (user.totalSpent / 100).toFixed(2) : '0.00'
      row.lastOrderDate = user.lastOrderDate 
        ? new Date(user.lastOrderDate).toLocaleDateString() 
        : 'Never'
    } else {
      row.role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'
      row.lastLoginAt = user.lastLoginAt 
        ? new Date(user.lastLoginAt).toLocaleDateString() 
        : 'Never'
    }

    worksheet.addRow(row)
  })

  // Apply borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
      
      // Align data rows
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    })
  })

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Summary')
  
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ]

  // Style summary header
  summarySheet.getRow(1).font = { bold: true, size: 12 }
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  }
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  summarySheet.getRow(1).height = 30

  // Calculate summary statistics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = totalUsers - activeUsers

  if (userType === 'customer') {
    const verifiedUsers = users.filter(u => u.emailVerified).length
    const totalOrders = users.reduce((sum, u) => sum + (u.totalOrders || 0), 0)
    const totalRevenue = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0)
    const avgOrdersPerCustomer = totalUsers > 0 ? (totalOrders / totalUsers).toFixed(2) : '0.00'
    const avgRevenuePerCustomer = totalUsers > 0 ? ((totalRevenue / 100) / totalUsers).toFixed(2) : '0.00'

    summarySheet.addRows([
      { metric: 'Total Customers', value: totalUsers },
      { metric: 'Active Customers', value: activeUsers },
      { metric: 'Inactive Customers', value: inactiveUsers },
      { metric: 'Email Verified', value: verifiedUsers },
      { metric: 'Total Orders Placed', value: totalOrders },
      { metric: 'Total Revenue ($)', value: (totalRevenue / 100).toFixed(2) },
      { metric: 'Avg Orders per Customer', value: avgOrdersPerCustomer },
      { metric: 'Avg Revenue per Customer ($)', value: avgRevenuePerCustomer },
      { metric: 'Export Date', value: new Date().toLocaleString() },
    ])
  } else {
    const roleBreakdown = users.reduce((acc: any, u) => {
      const role = u.role || 'unknown'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})

    summarySheet.addRows([
      { metric: 'Total System Users', value: totalUsers },
      { metric: 'Active Users', value: activeUsers },
      { metric: 'Inactive Users', value: inactiveUsers },
      { metric: 'Admins', value: roleBreakdown.admin || 0 },
      { metric: 'Managers', value: roleBreakdown.manager || 0 },
      { metric: 'Sellers', value: roleBreakdown.seller || 0 },
      { metric: 'Export Date', value: new Date().toLocaleString() },
    ])
  }

  // Apply borders to summary sheet
  summarySheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
      
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    })
  })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
