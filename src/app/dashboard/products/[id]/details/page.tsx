
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Hash,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Clock,
  User,
  Barcode,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0);
const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-MX").format(value || 0);

const getStatusVariant = (status: string) => {
  switch (status) {
    case "active": return "outline";
    case "draft": return "secondary";
    case "archived": return "destructive";
    default: return "default";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active": return "Activo";
    case "draft": return "Borrador";
    case "archived": return "Archivado";
    default: return status;
  }
};

const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary";
    return "outline";
};

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data, error } = await supabase
    .rpc("get_product_details", { p_product_id: id })
    .single();

  if (error || !data) {
    console.error("Error fetching product details:", error);
    notFound();
  }

  const { product, category, sales_summary, recent_sales, stock_movements } = data;

  if (!product) {
      notFound();
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a Productos</span>
          </Link>
        </Button>
        <div className="flex-1 overflow-hidden">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:grow-0">
                {product.name}
            </h1>
        </div>
        <Badge variant={getStatusVariant(product.status)} className="ml-auto sm:ml-0">
          {getStatusText(product.status)}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle>Imagen del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <Image
              alt={product.name}
              className="aspect-square w-full rounded-md object-cover"
              height="300"
              src={product.image_url || `https://placehold.co/300x300.png`}
              width="300"
              data-ai-hint="product photo"
            />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-1 xl:col-span-3 lg:grid lg:grid-cols-1 xl:grid-cols-3 lg:gap-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Detalles Principales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-muted-foreground">Precio de Venta</p>
                        <p className="font-semibold text-2xl">{formatCurrency(product.sale_price)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Precio de Costo</p>
                        <p className="font-semibold text-2xl">{formatCurrency(product.cost_price)}</p>
                    </div>
                </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Existencias</p>
                    <p className="font-semibold">{formatNumber(product.stock)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">SKU</p>
                    <p className="font-semibold">{product.sku || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Cód. Barras</p>
                    <p className="font-semibold">{product.barcode || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Categoría</p>
                    <p className="font-semibold">{category?.name || "Sin categoría"}</p>
                  </div>
                </div>
              </div>
              {product.description && (
                <>
                    <Separator />
                    <div>
                        <p className="text-muted-foreground">Descripción</p>
                        <p className="font-normal">{product.description}</p>
                    </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Mini-Reporte de Ventas</CardTitle>
              <CardDescription>Rendimiento histórico.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Unidades Vendidas</span>
                <span className="font-bold">{formatNumber(sales_summary?.total_quantity_sold)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> Ingresos Totales</span>
                <span className="font-bold">{formatCurrency(sales_summary?.total_revenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Ganancia Total</span>
                <span className="font-bold">{formatCurrency(sales_summary?.total_profit)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_sales?.length > 0 ? (
                  recent_sales.map((sale: any) => (
                    <TableRow key={sale.sale_id}>
                      <TableCell>{format(new Date(sale.created_at), "d MMM, yy", { locale: es })}</TableCell>
                      <TableCell>{sale.customer_name}</TableCell>
                      <TableCell className="text-center">{sale.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.sale_price)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No se han registrado ventas para este producto.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Movimientos de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {stock_movements?.length > 0 ? (
                  stock_movements.map((move: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(move.created_at), "d MMM, yy HH:mm", { locale: es })}</TableCell>
                      <TableCell>
                        <div>{move.reason}</div>
                        {move.user_email && <div className="text-xs text-muted-foreground">{move.user_email}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={move.quantity > 0 ? 'secondary' : 'destructive'}>
                            {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No hay movimientos de stock para este producto.</TableCell>
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
