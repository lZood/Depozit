
import Link from "next/link"
import {
  DollarSign,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  AlertCircle,
  BarChart,
  ArrowRight,
} from "lucide-react"
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SalesChart } from "@/components/sales-chart"
import { createClient } from "@/lib/supabase/server"
import { Button } from "./ui/button";

const getInitials = (name: string) => {
  if (!name || name === 'Cliente General') return "CG";
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.substring(0, 2).toUpperCase();
}

const formatCurrency = (value: number | null | undefined) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
}

const formatNumber = (value: number | null | undefined) => {
  return new Intl.NumberFormat('es-MX').format(value || 0);
}

export default async function AdminDashboard() {
  const supabase = createClient();
  const timezone = 'America/Mazatlan'; // Define the target timezone

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    salesSummaryRes,
    salesOverTimeRes,
    recentSalesRes,
    lowStockProductsRes,
    topProductsRes
  ] = await Promise.all([
    supabase.rpc("get_sales_summary", { start_date: today.toISOString(), end_date: tomorrow.toISOString(), p_timezone: timezone }).single(),
    supabase.rpc("get_sales_over_time", { start_date: sevenDaysAgo.toISOString(), end_date: tomorrow.toISOString(), p_timezone: timezone }),
    supabase.rpc('get_recent_sales', { limit_count: 5 }),
    supabase.from('products').select('name, stock').lt('stock', 10).order('stock', { ascending: true }).limit(5),
    supabase.rpc('get_top_selling_products', { start_date: thirtyDaysAgo.toISOString(), end_date: tomorrow.toISOString(), limit_count: 5, p_timezone: timezone })
  ]);
  
  const salesSummary = salesSummaryRes.data;
  const salesOverTime = salesOverTimeRes.data;
  const recentSales = recentSalesRes.data;
  const lowStockProducts = lowStockProductsRes.data;
  const topProducts = topProductsRes.data;

  const summaryCards = [
    { title: "Ventas de Hoy", value: formatCurrency(salesSummary?.total_sales), description: "Ventas totales del día", icon: DollarSign },
    { title: "Ganancia Bruta", value: formatCurrency(salesSummary?.total_profit), description: "Ganancia estimada del día", icon: TrendingUp },
    { title: "Transacciones", value: `+${formatNumber(salesSummary?.transaction_count)}`, description: "Número de ventas realizadas", icon: CreditCard },
    { title: "Venta Promedio", value: formatCurrency(salesSummary?.average_sale), description: "Valor promedio por transacción", icon: BarChart },
  ];

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Ventas (Últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={salesOverTime || []} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>
              Las últimas 5 ventas realizadas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentSales && recentSales.length > 0 ? recentSales.map(sale => (
               <div className="flex items-center" key={sale.id}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(sale.customer_name)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{sale.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.employee_email}
                  </p>
                </div>
                <div className="ml-auto font-medium">{formatCurrency(sale.total_amount)}</div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No hay ventas recientes.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Alertas de Inventario
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/inventory">
                        Ver Todo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Existencias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts && lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">{product.stock}</Badge></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">No hay productos con bajo inventario.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                Productos Principales (Últimos 30 días)
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/reports">
                        Ver Reporte <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Ventas (Cant.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts && topProducts.length > 0 ? topProducts.map(product => (
                  <TableRow key={product.product_name}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(product.total_quantity)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">No hay datos de ventas suficientes.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
