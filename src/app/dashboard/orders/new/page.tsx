
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type Supplier = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  cost_price: number | null;
};

const poItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  cost_price: z.coerce.number().min(0, "El costo no puede ser negativo."),
});

const poFormSchema = z.object({
  supplier_id: z.string().min(1, "Debe seleccionar un proveedor."),
  items: z.array(poItemSchema).min(1, "Debe agregar al menos un producto a la orden."),
});

type POFormValues = z.infer<typeof poFormSchema>;
type POItem = z.infer<typeof poItemSchema>;

export default function NewOrderPage() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = React.useState(true);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      supplier_id: "",
      items: [],
    },
  });
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  React.useEffect(() => {
    async function fetchSuppliers() {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
      if (data) setSuppliers(data);
      setLoadingSuppliers(false);
    }
    fetchSuppliers();
  }, [supabase]);

  const handleProductSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, cost_price")
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
    setLoadingSearch(false);
  }, [supabase]);

  React.useEffect(() => {
    const debounce = setTimeout(() => handleProductSearch(productSearch), 300);
    return () => clearTimeout(debounce);
  }, [productSearch, handleProductSearch]);

  const addProductToOrder = (product: Product) => {
    const existingItem = fields.find(item => item.product_id === product.id);
    if (existingItem) {
      toast({ title: "Producto ya agregado", description: "Este producto ya se encuentra en la orden.", variant: 'destructive' });
      return;
    }
    append({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      cost_price: product.cost_price || 0,
    });
    setProductSearch("");
    setSearchResults([]);
  };

  const total = React.useMemo(() => {
    return form.getValues('items').reduce((acc, item) => acc + item.quantity * item.cost_price, 0);
  }, [form.watch('items')]);

  const onSubmit = async (values: POFormValues) => {
    setIsSubmitting(true);
    const po_items = values.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost_price
    }));

    const { data, error } = await supabase.rpc('create_purchase_order', {
        p_supplier_id: values.supplier_id,
        p_po_items: po_items
    });

    if (error) {
        toast({ title: "Error al crear la orden", description: error.message, variant: 'destructive' });
        setIsSubmitting(false);
    } else {
        toast({ title: "Éxito", description: "Orden de compra creada correctamente." });
        router.push(`/dashboard/orders/${data}`);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Nueva Orden de Compra
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Orden"}
          </Button>
        </div>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="grid auto-rows-max items-start gap-4 md:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>Añada productos a la orden de compra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  className="pl-8"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              {loadingSearch && <Skeleton className="h-12 w-full" />}
              {searchResults.length > 0 && (
                <Card>
                    <CardContent className="p-2 space-y-1">
                        {searchResults.map(p => (
                            <Button key={p.id} variant="ghost" className="w-full justify-start h-auto" onClick={() => addProductToOrder(p)}>
                                <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-sm text-muted-foreground">SKU: {p.sku || 'N/A'}</p>
                                </div>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[100px]">Cantidad</TableHead>
                    <TableHead className="w-[120px]">Costo Unit.</TableHead>
                    <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Eliminar</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length > 0 ? (
                    fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`items.${index}.quantity`)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register(`items.${index}.cost_price`)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ${(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.cost_price`)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-red-500"/>
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Aún no se han agregado productos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
                <Controller
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingSuppliers ? (
                                <SelectItem value="loading" disabled>Cargando...</SelectItem>
                            ) : (
                                suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                            )}
                        </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.supplier_id && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.supplier_id.message}</p>
                )}
            </CardContent>
          </Card>
           <Card>
               <CardHeader>
                   <CardTitle>Resumen del Pedido</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                   <div className="flex justify-between text-lg font-semibold">
                       <span>Total</span>
                       <span>${total.toFixed(2)}</span>
                   </div>
               </CardContent>
           </Card>
        </div>
      </form>
       <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Orden"}
          </Button>
        </div>
    </div>
  );
}

    