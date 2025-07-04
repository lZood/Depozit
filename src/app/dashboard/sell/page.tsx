
"use client";

import * as React from "react";
import {
  ScanLine,
  Search,
  Package,
  X,
  Plus,
  Minus,
  UserPlus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock: number;
};

type CartItem = Product & {
  quantity: number;
};

export default function SellPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  const handleSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, sale_price, stock")
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .eq('status', 'active')
      .limit(10);
    
    if (error) {
      toast({ title: "Error de búsqueda", description: error.message, variant: "destructive" });
    } else {
      setSearchResults(data as Product[]);
    }
    setLoadingSearch(false);
  }, [supabase, toast]);
  
  React.useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({ title: "Stock insuficiente", description: `No puedes agregar más de ${product.stock} unidades.`, variant: "destructive" });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
         if (product.stock < 1) {
          toast({ title: "Sin stock", description: `${product.name} no tiene existencias.`, variant: "destructive" });
          return prevCart;
         }
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
       const itemToUpdate = prevCart.find(item => item.id === productId);
       if (!itemToUpdate) return prevCart;

       if (newQuantity > itemToUpdate.stock) {
         toast({ title: "Stock insuficiente", description: `No puedes agregar más de ${itemToUpdate.stock} unidades.`, variant: "destructive" });
         return prevCart;
       }

       if (newQuantity <= 0) {
         return prevCart.filter(item => item.id !== productId);
       }
       return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
    })
  }
  
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const subtotal = React.useMemo(() => {
    return cart.reduce((acc, item) => acc + item.sale_price * item.quantity, 0);
  }, [cart]);

  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  return (
    <div className="grid flex-1 auto-rows-max gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <div className="lg:col-span-2 xl:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle>Agregar Productos a la Venta</CardTitle>
            <CardDescription>
              Busque un producto por nombre o SKU para agregarlo a la venta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o SKU..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus 
              />
            </div>
            <div className="mt-4 space-y-2">
              {loadingSearch && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}
              {searchResults.length > 0 && !loadingSearch && (
                <Card>
                  <CardContent className="p-2">
                    {searchResults.map((product) => (
                       <Button 
                          key={product.id} 
                          variant="ghost" 
                          className="w-full justify-start h-auto p-2 text-left"
                          onClick={() => addToCart(product)}
                          disabled={product.stock < 1}
                        >
                          <div className="flex justify-between w-full items-center">
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku || 'N/A'} - 
                                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                  Existencias: {product.stock}
                                </span>
                              </p>
                            </div>
                            <p className="font-bold text-lg">${product.sale_price.toFixed(2)}</p>
                          </div>
                       </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
              {searchQuery.length > 1 && searchResults.length === 0 && !loadingSearch && (
                <div className="text-center text-muted-foreground py-4">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Venta Actual</CardTitle>
             <div className="flex justify-between items-center">
                <Badge>Cliente: Sin registrar</Badge>
                <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Asignar Cliente
                </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center w-[120px]">Cant</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length > 0 ? (
                  cart.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">${item.sale_price.toFixed(2)} c/u</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-12 h-8 text-center" 
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.sale_price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-48 text-muted-foreground">
                      El carrito está vacío
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex-col items-start gap-4 border-t bg-muted/50 p-4 mt-auto">
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>IVA (16%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="outline">Pausar Venta</Button>
                <Button>Procesar Pago</Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
