import { useQuery } from '@tanstack/react-query'
import type { ReportFilters } from '../types'
import { getSalesReport, getTopProductsReport } from '../services'

export const useSalesReport = (
  filters: ReportFilters | null,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['sales-report', filters],
    queryFn: () => getSalesReport(filters!),
    enabled:
      enabled &&
      !!filters &&
      !!filters.date_from &&
      !!filters.date_to &&
      filters.date_from <= filters.date_to,
  })
}

export const useTopProductsReport = (
  filters: ReportFilters | null,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['top-products-report', filters],
    queryFn: () => getTopProductsReport(filters!),
    enabled:
      enabled &&
      !!filters &&
      !!filters.date_from &&
      !!filters.date_to &&
      filters.date_from <= filters.date_to,
  })
}

