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
