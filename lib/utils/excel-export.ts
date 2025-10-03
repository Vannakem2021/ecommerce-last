import ExcelJS from 'exceljs'
import { IOrderList } from '@/types'

/**
 * Generate formatted order number from MongoDB ObjectId and date
 * Format: ORD-YYMMDD-XXXX
 */
function generateOrderNumber(id: string, createdAt: Date): string {
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
      orderId: generateOrderNumber(order._id, order.createdAt),
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
    const orderId = generateOrderNumber(order._id, order.createdAt)
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
  
  // Define columns
  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'List Price', key: 'listPrice', width: 12 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Stock Status', key: 'stockStatus', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Reviews', key: 'reviews', width: 10 },
    { header: 'Sales', key: 'sales', width: 10 },
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
      sku: product.sku || 'N/A',
      name: product.name,
      category: categoryName,
      brand: brandName,
      price: product.price,
      listPrice: product.listPrice || product.price,
      stock: product.countInStock,
      stockStatus: getStockStatus(product.countInStock),
      status: product.isPublished ? 'Published' : 'Draft',
      rating: product.avgRating || 0,
      reviews: product.numReviews || 0,
      sales: product.numSales || 0,
      createdAt: new Date(product.createdAt),
    })
    
    // Format currency columns
    row.getCell('price').numFmt = '$#,##0.00'
    row.getCell('listPrice').numFmt = '$#,##0.00'
    
    // Format date column
    const dateCell = row.getCell('createdAt')
    dateCell.numFmt = 'yyyy-mm-dd hh:mm:ss'
    
    // Format rating (1 decimal)
    const ratingCell = row.getCell('rating')
    ratingCell.numFmt = '0.0'
    
    // Center align numeric columns
    row.getCell('stock').alignment = { horizontal: 'center' }
    row.getCell('stockStatus').alignment = { horizontal: 'center' }
    row.getCell('status').alignment = { horizontal: 'center' }
    row.getCell('rating').alignment = { horizontal: 'center' }
    row.getCell('reviews').alignment = { horizontal: 'center' }
    row.getCell('sales').alignment = { horizontal: 'center' }
    
    // Color code stock status
    const stockStatusCell = row.getCell('stockStatus')
    stockStatusCell.font = { 
      color: { argb: getStockStatusColor(product.countInStock) },
      bold: true
    }
    
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
  
  // Define columns
  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Current Stock', key: 'stock', width: 12 },
    { header: 'Stock Status', key: 'stockStatus', width: 15 },
    { header: 'Unit Price', key: 'price', width: 12 },
    { header: 'Total Value', key: 'totalValue', width: 15 },
    { header: 'Last Updated', key: 'updatedAt', width: 20 },
    { header: 'Status', key: 'publishStatus', width: 12 },
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
      sku: product.sku || 'N/A',
      name: product.name,
      category: categoryName,
      brand: brandName,
      stock: product.countInStock,
      stockStatus: getInventoryStockStatus(product.countInStock),
      price: product.price,
      totalValue: product.price * product.countInStock,
      updatedAt: new Date(product.updatedAt),
      publishStatus: product.isPublished ? 'Published' : 'Draft',
    })
    
    // Format currency columns
    row.getCell('price').numFmt = '$#,##0.00'
    row.getCell('totalValue').numFmt = '$#,##0.00'
    
    // Format date column
    const dateCell = row.getCell('updatedAt')
    dateCell.numFmt = 'yyyy-mm-dd hh:mm:ss'
    
    // Center align numeric columns
    row.getCell('stock').alignment = { horizontal: 'center' }
    row.getCell('stockStatus').alignment = { horizontal: 'center' }
    row.getCell('publishStatus').alignment = { horizontal: 'center' }
    
    // Color code stock status
    const stockStatusCell = row.getCell('stockStatus')
    stockStatusCell.font = { 
      color: { argb: getInventoryStockStatusColor(product.countInStock) },
      bold: true
    }
    
    // Color code publish status
    const statusCell = row.getCell('publishStatus')
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
