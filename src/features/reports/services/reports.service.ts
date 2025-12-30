import type {
  ReportFilters,
  SalesReportSummary,
  SalesReportData,
  TopProductData,
} from '../types'
import supabase from '@/utils/supabase'

/**
 * Get sales report data for a given period
 */
export const getSalesReport = async (
  filters: ReportFilters,
): Promise<SalesReportSummary> => {
  // Get all completed orders in the period
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_date,
      total,
      status,
      items:order_items(
        id,
        quantity,
        price,
        subtotal
      )
    `,
    )
    .eq('status', 'completed')
    .gte('order_date', filters.date_from)
    .lte('order_date', filters.date_to)
    .order('order_date', { ascending: true })

  if (ordersError) throw ordersError

  // Get all expenses in the period
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('transaction_date, total_expense')
    .gte('transaction_date', filters.date_from)
    .lte('transaction_date', filters.date_to)

  if (expensesError) throw expensesError

  // Calculate totals
  const totalOrders = orders?.length || 0
  const totalGross =
    orders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0
  const totalExpenses =
    expenses?.reduce((sum, exp) => sum + Number(exp.total_expense || 0), 0) ||
    0
  const totalNet = totalGross - totalExpenses

  // Group by date for daily breakdown
  const dailyMap = new Map<string, SalesReportData>()

  // Process orders by date
  orders?.forEach((order) => {
    const date = order.order_date
    const existing = dailyMap.get(date) || {
      date,
      order_count: 0,
      total_gross: 0,
      total_expenses: 0,
      total_net: 0,
    }
    existing.order_count += 1
    existing.total_gross += Number(order.total || 0)
    dailyMap.set(date, existing)
  })

  // Process expenses by date
  expenses?.forEach((expense) => {
    const date = expense.transaction_date
    const existing = dailyMap.get(date) || {
      date,
      order_count: 0,
      total_gross: 0,
      total_expenses: 0,
      total_net: 0,
    }
    existing.total_expenses += Number(expense.total_expense || 0)
    dailyMap.set(date, existing)
  })

  // Calculate net for each day
  const dailyData = Array.from(dailyMap.values())
    .map((day) => ({
      ...day,
      total_net: day.total_gross - day.total_expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    period_start: filters.date_from,
    period_end: filters.date_to,
    total_orders: totalOrders,
    total_gross: totalGross,
    total_expenses: totalExpenses,
    total_net: totalNet,
    daily_data: dailyData,
  }
}

/**
 * Get top performing products with variants for a given period
 */
export const getTopProductsReport = async (
  filters: ReportFilters,
): Promise<TopProductData[]> => {
  // Get all completed orders in the period with items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_date,
      items:order_items(
        id,
        product_id,
        variant_id,
        quantity,
        price,
        subtotal,
        product:products(
          id,
          name,
          sku,
          category:categories(name)
        ),
        variant:product_variants(
          id,
          name,
          sku
        )
      )
    `,
    )
    .eq('status', 'completed')
    .gte('order_date', filters.date_from)
    .lte('order_date', filters.date_to)

  if (ordersError) throw ordersError

  // Aggregate product/variant sales
  const productMap = new Map<string, TopProductData & { orderIds: Set<string> }>()

  orders?.forEach((order) => {
    order.items?.forEach((item: any) => {
      const key = `${item.product_id}-${item.variant_id || 'no-variant'}`
      const existing = productMap.get(key) || {
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        product_sku: item.product?.sku || null,
        variant_id: item.variant_id || null,
        variant_name: item.variant?.name || null,
        variant_sku: item.variant?.sku || null,
        category_name: item.product?.category?.name || null,
        total_quantity_sold: 0,
        total_revenue: 0,
        order_count: 0,
        orderIds: new Set<string>(),
      }

      existing.total_quantity_sold += item.quantity || 0
      existing.total_revenue += Number(item.subtotal || 0)
      existing.orderIds.add(order.id)

      productMap.set(key, existing)
    })
  })

  // Convert orderIds sets to order_count
  productMap.forEach((product) => {
    product.order_count = product.orderIds.size
    delete (product as any).orderIds
  })

  // Convert to array and sort by revenue (descending)
  const topProducts = Array.from(productMap.values()).sort(
    (a, b) => b.total_revenue - a.total_revenue,
  )

  return topProducts
}

