import type { OrderFormValues } from '../schema/order-form'
import type { OrderStatus } from '../types/order'
import supabase from '@/utils/supabase'

export interface GetOrdersFilters {
  status?: OrderStatus
  date_from?: string
  date_to?: string
  customer_name?: string
  product_name?: string
  category_id?: string
}

export const getOrders = async (filters?: GetOrdersFilters) => {
  let query = supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(
          id,
          name,
          sku,
          category:categories(id, name)
        ),
        variant:product_variants(
          id,
          name,
          sku
        )
      )
    `,
    )
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.date_from) {
    query = query.gte('order_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('order_date', filters.date_to)
  }

  if (filters?.customer_name) {
    query = query.ilike('customer_name', `%${filters.customer_name}%`)
  }

  const { data, error } = await query
  if (error) throw error

  // Filter by product name or category if specified
  let filteredData = data || []

  if (filters?.product_name) {
    filteredData = filteredData.filter((order: any) =>
      order.items?.some((item: any) =>
        item.product?.name
          ?.toLowerCase()
          .includes(filters.product_name!.toLowerCase()),
      ),
    )
  }

  if (filters?.category_id) {
    filteredData = filteredData.filter((order: any) =>
      order.items?.some(
        (item: any) => item.product?.category?.id === filters.category_id,
      ),
    )
  }

  // Transform the data to match our types
  return filteredData.map((order: any) => ({
    ...order,
    items: order.items?.map((item: any) => ({
      ...item,
      product_name: item.product?.name,
      product_sku: item.product?.sku,
      variant_name: item.variant?.name,
      variant_sku: item.variant?.sku,
      category_name: item.product?.category?.name,
    })),
  }))
}

export const getOrder = async (id: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(
          id,
          name,
          description,
          sku,
          price,
          category:categories(id, name)
        ),
        variant:product_variants(
          id,
          name,
          sku,
          price
        )
      )
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error

  // Transform the data
  return {
    ...data,
    items: data.items?.map((item: any) => ({
      ...item,
      product_name: item.product?.name,
      product_sku: item.product?.sku,
      variant_name: item.variant?.name,
      variant_sku: item.variant?.sku,
      category_name: item.product?.category?.name,
    })),
  }
}

export const addOrder = async (order: OrderFormValues) => {
  // Calculate total from items
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  // Add delivery fee if order type is delivery
  const deliveryFee = order.order_type === 'delivery' && order.delivery_fee
    ? order.delivery_fee
    : 0

  const total = itemsTotal + deliveryFee

  // Insert order - explicitly use the status from order object
  // This ensures the status passed from POS interface ('pending') is preserved
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: order.customer_name,
      status: order.status, // Use the status directly from the order object
      order_date: order.order_date,
      total: total,
      order_type: order.order_type || null,
      delivery_fee: order.order_type === 'delivery' ? (order.delivery_fee || 0) : null,
      payment_method: order.payment_method || null,
      notes: order.notes || null,
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Insert order items
  const itemsToInsert = order.items.map((item) => ({
    order_id: orderData.id,
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  return orderData
}

export const updateOrder = async ({
  id,
  ...order
}: OrderFormValues & { id: string }) => {
  // Calculate total from items
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  // Add delivery fee if order type is delivery
  const deliveryFee = order.order_type === 'delivery' && order.delivery_fee
    ? order.delivery_fee
    : 0

  const total = itemsTotal + deliveryFee

  // Update order
  const { data, error } = await supabase
    .from('orders')
    .update({
      customer_name: order.customer_name,
      status: order.status,
      order_date: order.order_date,
      total: total,
      order_type: order.order_type || null,
      delivery_fee: order.order_type === 'delivery' ? (order.delivery_fee || 0) : null,
      payment_method: order.payment_method || null,
      notes: order.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Delete existing order items
  await supabase.from('order_items').delete().eq('order_id', id)

  // Insert new order items
  const itemsToInsert = order.items.map((item) => ({
    order_id: id,
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  return data
}

export const deleteOrder = async (id: string) => {
  // Delete order items first (cascade should handle this, but being explicit)
  await supabase.from('order_items').delete().eq('order_id', id)

  // Delete order
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

