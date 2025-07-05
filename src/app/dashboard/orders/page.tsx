
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PurchaseOrder = {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number | null;
  suppliers: {
    name: string;
  } | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogState, setDialogState] = React.useState<{ open: boolean, orderId: string | null }>({ open: false, orderId: null });
  const supabase = createClient();
  const { toast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, created_at, status, total_amount, suppliers(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de compra.",
        variant: "destructive",
      });
    } else {
      setOrders(data as PurchaseOrder[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReceiveOrder = async () => {
    if (!dialogState.orderId) return;

    const { error } = await supabase.rpc('receive_purchase_order', {
      p_order_id: dialogState.orderId
    });

    if (error) {
      toast({
        title: "Error al recibir la orden",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Orden recibida y stock actualizado.",
      });
      fetchOrders();
    }
    setDialogState({ open: false, orderId: null });
  };
  
  const getStatusVariant = (status: PurchaseOrder['status']): 'secondary' | 'outline' | 'destructive' => {
      switch(status) {
          case 'pending': return 'secondary';
          case 'completed': return 'outline';
          case 'cancelled': return 'destructive';
          default: return 'outline';
      }
  }

  const getStatusText = (status: PurchaseOrder['status']) => {
      switch(status) {
          case 'pending': return 'Pendiente';
          case 'completed': return 'Completada';
          case 'cancelled': return 'Cancelada';
          default: return status;
      }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground">
            Cree y gestione las órdenes a sus proveedores.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Orden
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Órden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 float-right" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full float-right" /></TableCell>
                    </TableRow>
                 ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/dashboard/orders/${order.id}`} className="font-medium hover:underline">
                        #...{order.id.slice(-6)}
                      </Link>
                    </TableCell>
                    <TableCell>{order.suppliers?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       {format(new Date(order.created_at), "d 'de' LLLL, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                       {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(order.total_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>Ver Detalles</Link>
                          </DropdownMenuItem>
                          {order.status === 'pending' && (
                            <DropdownMenuItem onSelect={() => setDialogState({open: true, orderId: order.id})}>
                               <CheckCircle className="mr-2 h-4 w-4" />
                               Marcar como Recibida
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron órdenes de compra.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar Recepción de Mercancía?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se marcará la orden como "Completada" y se añadirá la cantidad de productos correspondiente a su inventario.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDialogState({open: false, orderId: null})}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReceiveOrder}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    