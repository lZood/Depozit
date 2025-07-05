
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, CheckCircle, Search, Filter, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { DateRange } from "react-day-picker";

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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type PurchaseOrder = {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number | null;
  suppliers: {
    name: string;
  } | null;
};

type Supplier = {
  id: string;
  name: string;
};

export default function OrdersPage() {
  const [allOrders, setAllOrders] = React.useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [receiveDialogState, setReceiveDialogState] = React.useState<{ open: boolean, orderId: string | null }>({ open: false, orderId: null });
  const [cancelDialogState, setCancelDialogState] = React.useState<{ open: boolean, orderId: string | null }>({ open: false, orderId: null });

  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<string[]>([]);
  const [date, setDate] = React.useState<DateRange | undefined>();

  const supabase = createClient();
  const { toast } = useToast();

  const fetchSuppliersForFilter = React.useCallback(async () => {
    const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los proveedores para el filtro.", variant: "destructive" });
    } else {
      setSuppliers(data);
    }
  }, [supabase, toast]);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("purchase_orders")
      .select("id, created_at, status, total_amount, suppliers(name)");

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }
    if (selectedSuppliers.length > 0) {
      query = query.in('supplier_id', selectedSuppliers);
    }
    if (date?.from) {
      query = query.gte('created_at', date.from.toISOString());
    }
    if (date?.to) {
      // addDays to include the entire 'to' day
      query = query.lte('created_at', addDays(date.to, 1).toISOString());
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de compra.",
        variant: "destructive",
      });
      setAllOrders([]);
    } else {
      setAllOrders(data as PurchaseOrder[]);
    }
    setLoading(false);
  }, [supabase, toast, activeTab, selectedSuppliers, date]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    fetchSuppliersForFilter();
  }, [fetchSuppliersForFilter]);

  React.useEffect(() => {
    let ordersToFilter = [...allOrders];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      ordersToFilter = ordersToFilter.filter(order =>
        order.id.slice(-8).toLowerCase().includes(lowercasedQuery) ||
        (order.suppliers && order.suppliers.name.toLowerCase().includes(lowercasedQuery))
      );
    }
    setFilteredOrders(ordersToFilter);
  }, [searchQuery, allOrders]);

  const handleReceiveOrder = async () => {
    if (!receiveDialogState.orderId) return;

    const { error } = await supabase.rpc('receive_purchase_order', {
      p_order_id: receiveDialogState.orderId
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
    setReceiveDialogState({ open: false, orderId: null });
  };
  
  const handleCancelOrder = async () => {
    if (!cancelDialogState.orderId) return;

    const { error } = await supabase.rpc('cancel_purchase_order', {
        p_order_id: cancelDialogState.orderId
    });

    if (error) {
      toast({
        title: "Error al cancelar la orden",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Orden de compra cancelada correctamente.",
      });
      fetchOrders();
    }
    setCancelDialogState({ open: false, orderId: null });
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

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mt-4">
        <div className="flex items-center gap-2 pb-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all">Todo</TabsTrigger>
            <TabsTrigger value="pending">Pendiente</TabsTrigger>
            <TabsTrigger value="completed">Completada</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelada</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
                placeholder="Buscar por ID o proveedor..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-[150px] lg:w-[250px]"
            />
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "h-9 w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccionar fecha</span>
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
                />
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Proveedor
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por proveedor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <DropdownMenuCheckboxItem
                      key={supplier.id}
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = checked
                          ? [...selectedSuppliers, supplier.id]
                          : selectedSuppliers.filter((id) => id !== supplier.id);
                        setSelectedSuppliers(newSelected);
                      }}
                    >
                      {supplier.name}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No hay proveedores</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
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
                              <>
                                <DropdownMenuItem onSelect={() => setReceiveDialogState({open: true, orderId: order.id})}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Marcar como Recibida
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onSelect={() => setCancelDialogState({open: true, orderId: order.id})}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar Orden
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron órdenes de compra que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      <AlertDialog open={receiveDialogState.open} onOpenChange={(open) => setReceiveDialogState({ ...receiveDialogState, open })}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar Recepción de Mercancía?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se marcará la orden como "Completada" y se añadirá la cantidad de productos correspondiente a su inventario.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setReceiveDialogState({open: false, orderId: null})}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReceiveOrder}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogState.open} onOpenChange={(open) => setCancelDialogState({ ...cancelDialogState, open })}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de que desea cancelar esta orden?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción no se puede deshacer. La orden se marcará como "Cancelada" y no se podrá recibir mercancía de ella. El stock no será afectado.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setCancelDialogState({open: false, orderId: null})}>Cerrar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-red-600 hover:bg-red-700">
                      Confirmar Cancelación
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    