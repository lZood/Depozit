
"use client";

import * as React from "react";
import {
  Search,
  PackagePlus,
} from "lucide-react";

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
import Image from "next/image";

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

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [quantityToAdd, setQuantityToAdd] = React.useState(1);

  const supabase = createClient();
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, stock, image_url, categories(name)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos.",
        variant: "destructive",
      });
    } else if (data) {
      setProducts(data as Product[]);
      setFilteredProducts(data as Product[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  React.useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchQuery, products]);

  const handleAddStockClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantityToAdd(1);
    setDialogOpen(true);
  };

  const handleSubmitStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct || quantityToAdd <= 0) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un producto e ingrese una cantidad válida.",
        variant: "destructive",
      });
      return;
    }

    const newStock = selectedProduct.stock + Number(quantityToAdd);

    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (error) {
      toast({
        title: "Error al añadir stock",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Stock para ${selectedProduct.name} actualizado a ${newStock}.`,
      });
      setDialogOpen(false);
      // Actualización optimista del estado para una mejor UX
      const updatedProducts = products.map(p =>
        p.id === selectedProduct.id ? { ...p, stock: newStock } : p
      );
      setProducts(updatedProducts);
    }
  };
  
  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary"; // Se usa 'secondary' para un estado de 'advertencia' (amarillo/gris claro)
    return "outline"; // Se usa 'outline' para un estado normal
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>
            Gestiona las existencias de tus productos. Añade nuevas entradas para mantener tu inventario actualizado.
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
              {loading ? (
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
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
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
                      <Button size="sm" onClick={() => handleAddStockClick(product)}>
                        <PackagePlus className="mr-2" />
                        Añadir Stock
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmitStock}>
            <DialogHeader>
              <DialogTitle>Añadir Stock a {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Ingresa la cantidad de unidades que deseas agregar al inventario. Las existencias actuales son {selectedProduct?.stock}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(parseInt(e.target.value, 10) || 0)}
                  className="col-span-3"
                  min="1"
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Entrada</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

