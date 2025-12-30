import * as XLSX from 'xlsx'
import type { SalesReportSummary, TopProductData } from '../types'

/**
 * Export sales report to Excel
 */
export const exportSalesReportToExcel = (
  report: SalesReportSummary,
  filename?: string,
) => {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Sales Report Summary'],
    [],
    ['Period Start', report.period_start],
    ['Period End', report.period_end],
    [],
    ['Total Orders', report.total_orders],
    ['Total Gross Sales', report.total_gross],
    ['Total Expenses', report.total_expenses],
    ['Total Net Profit', report.total_net],
    [],
    ['Daily Breakdown'],
    [
      'Date',
      'Order Count',
      'Total Gross',
      'Total Expenses',
      'Total Net',
    ],
    ...report.daily_data.map((day) => [
      day.date,
      day.order_count,
      day.total_gross,
      day.total_expenses,
      day.total_net,
    ]),
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Write file
  const defaultFilename = `sales-report-${report.period_start}-to-${report.period_end}.xlsx`
  XLSX.writeFile(workbook, filename || defaultFilename)
}

/**
 * Export top products report to Excel
 */
export const exportTopProductsToExcel = (
  products: TopProductData[],
  periodStart: string,
  periodEnd: string,
  filename?: string,
) => {
  const workbook = XLSX.utils.book_new()

  // Products data
  const productsData = [
    [
      'Product Name',
      'Product SKU',
      'Variant Name',
      'Variant SKU',
      'Category',
      'Quantity Sold',
      'Total Revenue',
      'Order Count',
    ],
    ...products.map((product) => [
      product.product_name,
      product.product_sku || '',
      product.variant_name || 'No Variant',
      product.variant_sku || '',
      product.category_name || '',
      product.total_quantity_sold,
      product.total_revenue,
      product.order_count,
    ]),
  ]

  const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products')

  // Summary sheet
  const totalQuantity = products.reduce(
    (sum, p) => sum + p.total_quantity_sold,
    0,
  )
  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0)

  const summaryData = [
    ['Top Products Report Summary'],
    [],
    ['Period Start', periodStart],
    ['Period End', periodEnd],
    [],
    ['Total Products/Variants', products.length],
    ['Total Quantity Sold', totalQuantity],
    ['Total Revenue', totalRevenue],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Write file
  const defaultFilename = `top-products-report-${periodStart}-to-${periodEnd}.xlsx`
  XLSX.writeFile(workbook, filename || defaultFilename)
}

