/**
 * Sales report data type
 */
export interface SalesReportData {
  date: string
  order_count: number
  total_gross: number
  total_expenses: number
  total_net: number
}

/**
 * Sales report summary
 */
export interface SalesReportSummary {
  period_start: string
  period_end: string
  total_orders: number
  total_gross: number
  total_expenses: number
  total_net: number
  daily_data: SalesReportData[]
}

/**
 * Top performing product with variant
 */
export interface TopProductData {
  product_id: string
  product_name: string
  product_sku: string | null
  variant_id: string | null
  variant_name: string | null
  variant_sku: string | null
  category_name: string | null
  total_quantity_sold: number
  total_revenue: number
  order_count: number
}

/**
 * Report filters
 */
export interface ReportFilters {
  date_from: string
  date_to: string
}

