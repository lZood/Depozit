
"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ReportsSalesChart } from "@/components/reports-sales-chart";

type SalesSummary = {
  total_sales: number;
  total_profit: number;
  transaction_count: number;
  average_sale: number;
};

type SalesOverTime = {
  date: string;
  sales: number;
};

type TopProduct = {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
};

export default function ReportsPage() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [summary, setSummary] = React.useState<SalesSummary | null>(null);
  const [salesOverTime, setSalesOverTime] = React.useState<SalesOverTime[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchReportData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);

      const startDate = date.from.toISOString();
      const endDate = addDays(date.to, 1).toISOString(); // Include the entire end day

      // Fetch all reports in parallel
      const [summaryRes, salesOverTimeRes, topProductsRes] = await Promise.all([
        supabase.rpc("get_sales_summary", { start_date: startDate, end_date: endDate }).single(),
        supabase.rpc("get_sales_over_time", { start_date: startDate, end_date: endDate }),
        supabase.rpc("get_top_selling_products", { start_date: startDate, end_date: endDate, limit_count: 5 }),
      ]);

      if (summaryRes.error) {
        toast({ title: "Error", description: "No se pudo cargar el resumen de ventas.", variant: "destructive" });
        console.error("Summary Error:", summaryRes.error.message);
      } else {
        setSummary(summaryRes.data as SalesSummary);
      }

      if (salesOverTimeRes.error) {
        toast({ title: "Error", description: "No se pudieron cargar los datos del gráfico.", variant: "destructive" });
        console.error("Sales Over Time Error:", salesOverTimeRes.error.message);
      } else {
        setSalesOverTime(salesOverTimeRes.data as SalesOverTime[]);
      }

      if (topProductsRes.error) {
        toast({ title: "Error", description: "No se pudieron cargar los productos más vendidos.", variant: "destructive" });
        console.error("Top Products Error:", topProductsRes.error.message);
      } else {
        setTopProducts(topProductsRes.data as TopProduct[]);
      }

      setLoading(false);
    };

    fetchReportData();
  }, [date, supabase, toast]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes de Ventas</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu negocio en el período seleccionado.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                    {format(date.to, "LLL dd, y", { locale: es })}
                  </>
                ) : (
                  format(date.from, "LLL dd, y", { locale: es })
                )
              ) : (
                <span>Selecciona un rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={es}
              max={new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_profit)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">No. de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.transaction_count}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Venta Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(summary.average_sale)}</p>
                </CardContent>
            </Card>
        </div>
      ) : null }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Resumen de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[350px] w-full" /> : <ReportsSalesChart data={salesOverTime} />}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Top 5 por ingresos en el período.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cant.</TableHead>
                            <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-3/4 float-right" /></TableCell>
                                </TableRow>
                            ))
                        ) : topProducts.length > 0 ? (
                           topProducts.map(product => (
                               <TableRow key={product.product_name}>
                                   <TableCell className="font-medium">{product.product_name}</TableCell>
                                   <TableCell className="text-center">{product.total_quantity}</TableCell>
                                   <TableCell className="text-right">{formatCurrency(product.total_revenue)}</TableCell>
                               </TableRow>
                           ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No hay datos de ventas en este período.</TableCell>
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
