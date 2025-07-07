
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      created_at,
      completed_at,
      status,
      total_amount,
      suppliers (name, contact_person, email, phone),
      purchase_order_items ( id, quantity, cost_price, products (name, sku) )
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const getStatusVariant = (status: string | null): 'secondary' | 'outline' | 'destructive' => {
      switch(status) {
          case 'pending': return 'secondary';
          case 'completed': return 'outline';
          case 'cancelled': return 'destructive';
          default: return 'outline';
      }
  }

  const getStatusText = (status: string | null) => {
      switch(status) {
          case 'pending': return 'Pendiente';
          case 'completed': return 'Completada';
          case 'cancelled': return 'Cancelada';
          default: return 'N/A';
      }
  }
  
  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  return (
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a Órdenes</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Orden #{order.id.slice(0, 8)}
        </h1>
        <Badge variant={getStatusVariant(order.status)} className="ml-auto sm:ml-0">
            {getStatusText(order.status)}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Creación</span>
              <span className="text-right">{format(new Date(order.created_at), "d MMM, yyyy 'a las' HH:mm", { locale: es })}</span>
            </div>
             {order.completed_at && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de Recepción</span>
                    <span className="text-right">{format(new Date(order.completed_at), "d MMM, yyyy 'a las' HH:mm", { locale: es })}</span>
                </div>
            )}
             <Separator />
             <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount || 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <h3 className="font-semibold">{order.suppliers?.name || "No especificado"}</h3>
            {order.suppliers?.contact_person && <p className="text-muted-foreground">{order.suppliers.contact_person}</p>}
            {order.suppliers?.email && <p className="text-muted-foreground">{order.suppliers.email}</p>}
            {order.suppliers?.phone && <p className="text-muted-foreground">{order.suppliers.phone}</p>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Productos en la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[120px] text-center">Cantidad</TableHead>
                    <TableHead className="w-[150px] text-right">Costo Unitario</TableHead>
                    <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.purchase_order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.products?.name || "Producto no encontrado"}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.products?.sku || "N/A"}</div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.cost_price || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency((item.quantity || 0) * (item.cost_price || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {order.purchase_order_items.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <div className="flex flex-col gap-2">
                    <div>
                        <div className="font-medium">{item.products?.name || "Producto no encontrado"}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.products?.sku || "N/A"}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cantidad</span>
                        <span>{item.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Costo Unitario</span>
                        <span>{formatCurrency(item.cost_price || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                        <span>Subtotal</span>
                        <span>{formatCurrency((item.quantity || 0) * (item.cost_price || 0))}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
