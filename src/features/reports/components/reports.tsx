import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalesReport } from './sales-report'
import { TopProductsReport } from './top-products-report'

export default function Reports() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View and export sales and product performance reports
        </p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-6">
          <SalesReport />
        </TabsContent>
        <TabsContent value="top-products" className="mt-6">
          <TopProductsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

