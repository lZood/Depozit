"use client";

import {
  ScanLine,
  Search,
  Package,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function SellPage() {
  return (
    <div className="grid flex-1 auto-rows-max gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <div className="lg:col-span-2 xl:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle>Add Products to Sale</CardTitle>
            <CardDescription>
              Scan a barcode, search for a product, or use quick actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scan">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scan">Scan Barcode</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="quick">Quick Actions</TabsTrigger>
              </TabsList>
              <TabsContent value="scan" className="mt-4">
                <div className="relative">
                  <ScanLine className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Scan product barcode..." className="pl-8" autoFocus/>
                </div>
              </TabsContent>
              <TabsContent value="search" className="mt-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or SKU..." className="pl-8" />
                </div>
              </TabsContent>
              <TabsContent value="quick" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <Button key={i} variant="outline" className="h-24 flex-col gap-2">
                      <Package className="h-6 w-6" />
                      <span className="text-xs text-center">Quick Item {i + 1}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="px-4">
                <Badge>Customer: Walk-in</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-0"><span className="sr-only">Remove</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Premium Coffee Beans</TableCell>
                  <TableCell className="text-center">1</TableCell>
                  <TableCell className="text-right">$25.00</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Organic Tea Bags</TableCell>
                  <TableCell className="text-center">2</TableCell>
                  <TableCell className="text-right">$10.00</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Artisan Bread Loaf</TableCell>
                  <TableCell className="text-center">1</TableCell>
                  <TableCell className="text-right">$5.50</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4 border-t bg-muted/50 p-4 mt-auto">
             <div className="w-full space-y-2 text-sm">
               <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>$40.50</span>
               </div>
               <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>$2.03</span>
               </div>
               <Separator />
               <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>$42.53</span>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="outline">Hold Sale</Button>
              <Button>Process Payment</Button>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
