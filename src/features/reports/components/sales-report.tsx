import { useState, useCallback, useMemo } from 'react'
import { Download, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSalesReport } from '../hooks'
import { exportSalesReportToExcel } from '../utils'
import type { ReportFilters } from '../types'
import { format } from 'date-fns'

export function SalesReport() {
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'), // First day of current month
    date_to: format(new Date(), 'yyyy-MM-dd'), // Today
  })
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data: report, isLoading, error } = useSalesReport(filters, shouldFetch)

  const isValidDateRange = useMemo(() => {
    if (!filters.date_from || !filters.date_to) return false
    return filters.date_from <= filters.date_to
  }, [filters])

  const handleDateChange = useCallback(
    (field: 'date_from' | 'date_to', value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }))
      setShouldFetch(false) // Reset fetch state when filters change
    },
    [],
  )

  const handleGenerateReport = useCallback(() => {
    if (isValidDateRange) {
      setShouldFetch(true)
    }
  }, [isValidDateRange])

  const handleExport = useCallback(() => {
    if (report) {
      exportSalesReportToExcel(report)
    }
  }, [report])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">
                How to use this report:
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Select your desired date range (From and To dates)</li>
                <li>Click "Generate Report" to fetch the data</li>
                <li>Review the summary and daily breakdown</li>
                <li>Click "Export to Excel" to download the report</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>
            View sales data with expenses and net profit for a selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
                className="bg-white border-stone-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
                className="bg-white border-stone-300"
              />
            </div>
            <div className="grid gap-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleGenerateReport}
                disabled={!isValidDateRange}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
          {!isValidDateRange && (
            <p className="text-sm text-destructive mt-2">
              Please select a valid date range (From date must be before or equal to To date)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export Button - Only show when report is available */}
      {report && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleExport}
              className="w-full md:w-auto"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.total_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Gross Sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(report.total_gross)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(report.total_expenses)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Net Profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(report.total_net)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading report data...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              Error loading report: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown Table */}
      {report && report.daily_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>
              Sales and expenses breakdown by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Date</th>
                    <th className="text-right p-2 font-semibold">Orders</th>
                    <th className="text-right p-2 font-semibold">Gross Sales</th>
                    <th className="text-right p-2 font-semibold">Expenses</th>
                    <th className="text-right p-2 font-semibold">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily_data.map((day) => (
                    <tr key={day.date} className="border-b hover:bg-stone-50">
                      <td className="p-2">{format(new Date(day.date), 'MMM dd, yyyy')}</td>
                      <td className="p-2 text-right">{day.order_count}</td>
                      <td className="p-2 text-right text-green-600">
                        {formatCurrency(day.total_gross)}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {formatCurrency(day.total_expenses)}
                      </td>
                      <td className="p-2 text-right text-blue-600 font-semibold">
                        {formatCurrency(day.total_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {report && report.daily_data.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No data available for the selected period
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

