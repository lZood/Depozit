
"use client";

import * as React from "react";
import {
  Search,
  ArrowRightLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 12;

type Product = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  image_url: string | null;
  categories: {
    name: string;
  } | null;
};

const adjustmentFormSchema = z.object({
  type: z.enum(["addition", "subtraction"], { required_error: "Debe seleccionar un tipo de movimiento." }),
  quantity: z.coerce.number().int("La cantidad debe ser un número entero.").positive("La cantidad debe ser un número positivo."),
  reason: z.string().min(1, "Debe seleccionar un motivo."),
}).refine(data => data.quantity > 0, {
  message: "La cantidad debe ser mayor que cero.",
  path: ["quantity"],
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [dialogState, setDialogState] = React.useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  const supabase = createClient();
  const { toast } = useToast();

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      type: "addition",
      quantity: 1,
      reason: "Compra a proveedor",
    },
  });
  
  const fetchProducts = React.useCallback(async (currentPage: number, search: string) => {
    const isSearch = search.trim().length > 0;

    if (currentPage === 0) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from("products")
      .select("id, name, sku, stock, image_url, categories(name)")
      .order("name", { ascending: true });

    if (isSearch) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.eq.${search}`);
    } else {
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive",
        });
    } else if (data) {
        setProducts(prev => currentPage === 0 ? data : [...prev, ...data]);
        setHasMore(isSearch ? false : data.length === PAGE_SIZE);
        if (!isSearch) {
          setPage(currentPage + 1);
        }
    }
    
    if (currentPage === 0) setLoading(false);
    else setLoadingMore(false);
  }, [supabase, toast]);

  // Initial load and search handling
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0); // Reset page for new search/initial load
      fetchProducts(0, searchQuery);
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(page, searchQuery);
    }
  };


  const handleAdjustStockClick = (product: Product) => {
    form.reset();
    setDialogState({ open: true, product });
  };

  const onDialogClose = (open: boolean) => {
    if (!open) {
      setDialogState({ open: false, product: null });
      form.reset();
    }
  }

  async function onSubmit(values: AdjustmentFormValues) {
    const { product } = dialogState;
    if (!product) return;

    const quantityChange = values.type === 'addition' ? values.quantity : -values.quantity;

    if (values.type === 'subtraction' && product.stock < values.quantity) {
      form.setError("quantity", {
        type: "manual",
        message: `No puedes restar más de las existencias actuales (${product.stock}).`,
      });
      return;
    }

    const { error } = await supabase.rpc('handle_stock_adjustment', {
      p_product_id: product.id,
      p_quantity_change: quantityChange,
      p_reason: values.reason,
    });


    if (error) {
      toast({
        title: "Error al ajustar stock",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const newStock = product.stock + quantityChange;
      toast({
        title: "Éxito",
        description: `Stock para ${product.name} actualizado a ${newStock}.`,
      });
      setDialogState({ open: false, product: null });
      
      const updatedProducts = products.map(p =>
        p.id === product.id ? { ...p, stock: newStock } : p
      );
      setProducts(updatedProducts);
    }
  }
  
  const getStockBadgeVariant = (stock: number): 'destructive' | 'secondary' | 'outline' => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary"; 
    return "outline"; 
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>
            Gestiona las existencias de tus productos. Realiza entradas y salidas para mantener tu inventario actualizado.
          </CardDescription>
          <div className="pt-4">
             <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o SKU..."
                className="pl-8 sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    Imagen
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="text-center">Existencias Actuales</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && products.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-16 w-16 rounded-md" />
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-9 w-32 rounded-md float-right" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={product.image_url || `https://placehold.co/64x64.png`}
                          width="64"
                          data-ai-hint="product photo"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                        <div className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.categories?.name || "Sin Categoría"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStockBadgeVariant(product.stock)} className="text-base font-bold px-3 py-1">
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleAdjustStockClick(product)}>
                          <ArrowRightLeft className="mr-2" />
                          Ajustar Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No se encontraron productos que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Card List */}
           <div className="grid gap-4 md:hidden">
              {loading && products.length === 0 ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
              ) : products.length > 0 ? (
                  products.map(product => (
                      <div key={product.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                          <div className="flex gap-4">
                              <Image
                                alt={product.name}
                                className="aspect-square rounded-md object-cover"
                                height="80"
                                src={product.image_url || `https://placehold.co/80x80.png`}
                                width="80"
                                data-ai-hint="product photo"
                              />
                              <div className="flex-1 space-y-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{product.categories?.name || "Sin Categoría"}</p>
                              </div>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-center justify-between">
                              <div className="flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground">Existencias</span>
                                  <Badge variant={getStockBadgeVariant(product.stock)} className="text-base font-bold px-3 py-1 mt-1">
                                      {product.stock}
                                  </Badge>
                              </div>
                              <Button size="sm" onClick={() => handleAdjustStockClick(product)}>
                                <ArrowRightLeft className="mr-2" />
                                Ajustar
                              </Button>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-48">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No se encontraron productos</h3>
                        <p className="text-sm text-muted-foreground">Intenta ajustar la búsqueda.</p>
                    </div>
                </div>
              )}
          </div>
          {/* Load More Section */}
          <div className="mt-6 flex items-center justify-center">
            {!loading && hasMore && (
              <Button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? "Cargando..." : "Cargar más"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogState.open} onOpenChange={onDialogClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock de {dialogState.product?.name}</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de movimiento, la cantidad y el motivo. Las existencias actuales son {dialogState.product?.stock}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
               <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                          <RadioGroupItem value="addition" className="sr-only" />
                          Entrada
                        </Label>
                         <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                          <RadioGroupItem value="subtraction" className="sr-only" />
                          Salida
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" min="1" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un motivo para el ajuste" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Compra a proveedor">Compra a proveedor</SelectItem>
                        <SelectItem value="Ajuste por caducidad">Ajuste por caducidad</SelectItem>
                        <SelectItem value="Producto dañado">Producto dañado</SelectItem>
                        <SelectItem value="Venta externa">Venta externa</SelectItem>
                        <SelectItem value="Devolución de cliente">Devolución de cliente</SelectItem>
                        <SelectItem value="Corrección de inventario">Corrección de inventario</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <div className="w-full grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => onDialogClose(false)} size="lg">Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                    {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
                    </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
