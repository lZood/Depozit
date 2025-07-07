
"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, PackagePlus, PackageMinus, CircleDollarSign, ShieldAlert, Users, CreditCard, Warehouse, LineChart, FileDown } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
import { InventoryMovementsChart } from "@/components/inventory-movements-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Type definitions
type SalesSummary = { total_sales: number; total_profit: number; transaction_count: number; average_sale: number; };
type SalesOverTime = { date: string; sales: number; };
type TopProduct = { product_name: string; total_quantity: number; total_revenue: number; };
type InventorySummary = { total_units_in: number; total_units_out: number; purchase_investment: number; adjustments_value_loss: number; };
type InventoryMovementsOverTime = { date: string; units_in: number; units_out: number; };
type TopAdjustedProduct = { product_name: string; reason: string; total_quantity_adjusted: number; };
type SalesByEmployee = { employee_email: string; total_sales: number; sales_count: number; };
type SalesByPaymentMethod = { payment_method: string; total_amount: number; transaction_count: number; };

export default function ReportsPage() {
  const [date, setDate] = React.useState<DateRange | undefined>();

  // States for all reports data
  const [salesSummary, setSalesSummary] = React.useState<SalesSummary | null>(null);
  const [salesOverTime, setSalesOverTime] = React.useState<SalesOverTime[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);
  const [inventorySummary, setInventorySummary] = React.useState<InventorySummary | null>(null);
  const [inventoryMovements, setInventoryMovements] = React.useState<InventoryMovementsOverTime[]>([]);
  const [topAdjustedProducts, setTopAdjustedProducts] = React.useState<TopAdjustedProduct[]>([]);
  const [salesByEmployee, setSalesByEmployee] = React.useState<SalesByEmployee[]>([]);
  const [salesByPaymentMethod, setSalesByPaymentMethod] = React.useState<SalesByPaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);

  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    // Set initial date range on client-side to prevent hydration mismatch
    setDate({
      from: startOfMonth(new Date()),
      to: new Date(),
    });
  }, []);

  React.useEffect(() => {
    const fetchReportData = async () => {
      if (!date?.from || !date?.to) return;
      setLoading(true);

      const startDate = date.from.toISOString();
      const endDate = addDays(date.to, 1).toISOString();
      const timezone = 'America/Mazatlan';

      const reportsToFetch = [
        supabase.rpc("get_sales_summary", { start_date: startDate, end_date: endDate, p_timezone: timezone }).single(),
        supabase.rpc("get_sales_over_time", { start_date: startDate, end_date: endDate, p_timezone: timezone }),
        supabase.rpc("get_top_selling_products", { start_date: startDate, end_date: endDate, limit_count: 5, p_timezone: timezone }),
        supabase.rpc("get_inventory_summary", { start_date: startDate, end_date: endDate, p_timezone: timezone }).single(),
        supabase.rpc("get_inventory_movements_over_time", { start_date: startDate, end_date: endDate, p_timezone: timezone }),
        supabase.rpc("get_top_adjusted_products", { start_date: startDate, end_date: endDate, limit_count: 5, p_timezone: timezone }),
        supabase.rpc("get_sales_by_employee", { start_date: startDate, end_date: endDate, p_timezone: timezone }),
        supabase.rpc("get_sales_by_payment_method", { start_date: startDate, end_date: endDate, p_timezone: timezone }),
      ];

      const [
          salesSummaryRes, salesOverTimeRes, topProductsRes,
          inventorySummaryRes, inventoryMovementsRes, topAdjustedProductsRes,
          salesByEmployeeRes, salesByPaymentMethodRes,
      ] = await Promise.all(reportsToFetch);
      
      if (salesByEmployeeRes.error) {
        console.error("Error fetching sales by employee:", salesByEmployeeRes.error);
        toast({ title: "Error de permisos", description: "No se pudo cargar el reporte de ventas por empleado.", variant: "destructive" });
      }

      setSalesSummary(salesSummaryRes.data as SalesSummary);
      setSalesOverTime((salesOverTimeRes.data as SalesOverTime[]) || []);
      setTopProducts((topProductsRes.data as TopProduct[]) || []);
      setInventorySummary(inventorySummaryRes.data as InventorySummary);
      setInventoryMovements((inventoryMovementsRes.data as InventoryMovementsOverTime[]) || []);
      setTopAdjustedProducts((topAdjustedProductsRes.data as TopAdjustedProduct[]) || []);
      setSalesByEmployee((salesByEmployeeRes.data as SalesByEmployee[]) || []);
      setSalesByPaymentMethod((salesByPaymentMethodRes.data as SalesByPaymentMethod[]) || []);

      setLoading(false);
    };

    if (date) {
      fetchReportData();
    }
  }, [date, supabase, toast]);
  
  const formatCurrency = (value: number | null | undefined) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  const formatNumber = (value: number | null | undefined) => new Intl.NumberFormat('es-MX').format(value || 0);

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const pageTitle = "Reporte de Desempeño";
    const dateRangeText = `Periodo: ${date?.from ? format(date.from, "P", { locale: es }) : ''} - ${date?.to ? format(date.to, "P", { locale: es }) : ''}`;

    doc.setFontSize(18);
    doc.text(pageTitle, 14, 22);
    doc.setFontSize(11);
    doc.text(dateRangeText, 14, 29);

    let yPos = 45;
    const addPageIfNeeded = () => {
        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }
    }
    
    // --- Sales Section ---
    if(salesSummary) {
        addPageIfNeeded();
        doc.setFontSize(14).text("Resumen de Ventas", 14, yPos); yPos += 8;
        doc.setFontSize(10).text(`- Ventas Totales: ${formatCurrency(salesSummary.total_sales)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- Ganancia Bruta: ${formatCurrency(salesSummary.total_profit)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- No. de Transacciones: ${formatNumber(salesSummary.transaction_count)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- Venta Promedio: ${formatCurrency(salesSummary.average_sale)}`, 14, yPos); yPos += 10;
    }
    if (topProducts && topProducts.length > 0) {
        addPageIfNeeded();
        autoTable(doc, { startY: yPos, head: [['Productos Más Vendidos', 'Cantidad', 'Ingresos']], body: topProducts.map(p => [p.product_name, formatNumber(p.total_quantity), formatCurrency(p.total_revenue)]) });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Inventory Section ---
    if(inventorySummary) {
        addPageIfNeeded();
        doc.setFontSize(14).text("Resumen de Inventario", 14, yPos); yPos += 8;
        doc.setFontSize(10).text(`- Unidades Entrantes: ${formatNumber(inventorySummary.total_units_in)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- Unidades Salientes: ${formatNumber(inventorySummary.total_units_out)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- Inversión en Compras: ${formatCurrency(inventorySummary.purchase_investment)}`, 14, yPos); yPos += 6;
        doc.setFontSize(10).text(`- Pérdida en Ajustes: ${formatCurrency(inventorySummary.adjustments_value_loss)}`, 14, yPos); yPos += 10;
    }
     if (topAdjustedProducts && topAdjustedProducts.length > 0) {
        addPageIfNeeded();
        autoTable(doc, { startY: yPos, head: [['Ajustes Principales', 'Motivo', 'Cantidad']], body: topAdjustedProducts.map(p => [p.product_name, p.reason, formatNumber(p.total_quantity_adjusted)]) });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Performance Section ---
    if (salesByEmployee && salesByEmployee.length > 0) {
        addPageIfNeeded();
        autoTable(doc, { startY: yPos, head: [['Ventas por Empleado', 'No. Ventas', 'Total Vendido']], body: salesByEmployee.map(e => [e.employee_email, formatNumber(e.sales_count), formatCurrency(e.total_sales)]) });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    if (salesByPaymentMethod && salesByPaymentMethod.length > 0) {
        addPageIfNeeded();
        autoTable(doc, { startY: yPos, head: [['Ventas por Método de Pago', 'No. Transacciones', 'Total']], body: salesByPaymentMethod.map(p => [p.payment_method, formatNumber(p.transaction_count), formatCurrency(p.total_amount)]) });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.save(`Reporte_Depozit_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu negocio en el período seleccionado.
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <Popover>
            <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (date.to ? (<>{format(date.from, "LLL dd", { locale: es })} - {format(date.to, "LLL dd", { locale: es })}</>) : (format(date.from, "LLL dd", { locale: es }))) : (<span>Selecciona un rango</span>)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} max={new Date()} />
            </PopoverContent>
            </Popover>
            <Button onClick={handleGeneratePdf} disabled={loading}>
                <FileDown className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Generar PDF</span>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales"><LineChart className="h-4 w-4 mr-2"/>Ventas</TabsTrigger>
          <TabsTrigger value="inventory"><Warehouse className="h-4 w-4 mr-2"/>Inventario</TabsTrigger>
          <TabsTrigger value="performance"><Users className="h-4 w-4 mr-2"/>Rendimiento</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : salesSummary ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader><CardTitle className="text-sm font-medium">Ventas Totales</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(salesSummary.total_sales)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(salesSummary.total_profit)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Transacciones</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatNumber(salesSummary.transaction_count)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Venta Promedio</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(salesSummary.average_sale)}</p></CardContent></Card>
            </div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>Resumen de Ventas</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-[350px] w-full" /> : <ReportsSalesChart data={salesOverTime} />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Productos Más Vendidos</CardTitle><CardDescription>Top 5 por ingresos en el período.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-center">Cant.</TableHead><TableHead className="text-right">Ingresos</TableHead></TableRow></TableHeader><TableBody>{loading ? ([...Array(5)].map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-3/4" /></TableCell><TableCell><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell><TableCell><Skeleton className="h-5 w-3/4 float-right" /></TableCell></TableRow>))) : topProducts && topProducts.length > 0 ? (topProducts.map(p => (<TableRow key={p.product_name}><TableCell className="font-medium">{p.product_name}</TableCell><TableCell className="text-center">{formatNumber(p.total_quantity)}</TableCell><TableCell className="text-right">{formatCurrency(p.total_revenue)}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No hay datos de ventas.</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="inventory" className="space-y-4 mt-4">
          {loading ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : inventorySummary ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Unidades Entrantes</CardTitle><PackagePlus className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{formatNumber(inventorySummary.total_units_in)}</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Unidades Salientes</CardTitle><PackageMinus className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{formatNumber(inventorySummary.total_units_out)}</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Inversión en Compras</CardTitle><CircleDollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(inventorySummary.purchase_investment)}</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pérdida en Ajustes</CardTitle><ShieldAlert className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(inventorySummary.adjustments_value_loss)}</p></CardContent></Card>
            </div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>Flujo de Inventario</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-[350px] w-full" /> : <InventoryMovementsChart data={inventoryMovements} />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Ajustes de Stock Principales</CardTitle><CardDescription>Top 5 (excl. ventas/compras).</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Motivo</TableHead><TableHead className="text-right">Cantidad</TableHead></TableRow></TableHeader><TableBody>{loading ? ([...Array(5)].map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-3/4" /></TableCell><TableCell><Skeleton className="h-5 w-1/2" /></TableCell><TableCell><Skeleton className="h-5 w-3/4 float-right" /></TableCell></TableRow>))) : topAdjustedProducts && topAdjustedProducts.length > 0 ? (topAdjustedProducts.map((p, i) => (<TableRow key={i}><TableCell className="font-medium">{p.product_name}</TableCell><TableCell>{p.reason}</TableCell><TableCell className="text-right"><Badge variant={p.total_quantity_adjusted > 0 ? "secondary" : "destructive"}>{formatNumber(p.total_quantity_adjusted)}</Badge></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No hay ajustes de stock.</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Ventas por Empleado</CardTitle>
                  </div>
                  <CardDescription>Rendimiento del equipo en el período seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-center">Ventas</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {loading ? ([...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-3/4 float-right" /></TableCell>
                        </TableRow>
                      ))) : salesByEmployee && salesByEmployee.length > 0 ? (
                        salesByEmployee.map(e => (
                          <TableRow key={e.employee_email}>
                            <TableCell className="font-medium">{e.employee_email}</TableCell>
                            <TableCell className="text-center">{formatNumber(e.sales_count)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(e.total_sales)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center">No hay ventas en este período.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                   <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Ventas por Método de Pago</CardTitle>
                  </div>
                  <CardDescription>Desglose de ingresos por método de pago.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Método</TableHead><TableHead className="text-center">Trans.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {loading ? ([...Array(2)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-3/4 float-right" /></TableCell>
                          </TableRow>
                        ))) : salesByPaymentMethod && salesByPaymentMethod.length > 0 ? (
                          salesByPaymentMethod.map(p => (
                            <TableRow key={p.payment_method}>
                              <TableCell className="font-medium capitalize">{p.payment_method}</TableCell>
                              <TableCell className="text-center">{formatNumber(p.transaction_count)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(p.total_amount)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={3} className="h-24 text-center">No hay transacciones.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
