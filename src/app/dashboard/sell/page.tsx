
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Minus,
  UserPlus,
  XCircle,
  DollarSign,
  CreditCard,
  UserX,
  User,
  Star,
} from "lucide-react"

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock: number;
  cost_price: number;
  image_url: string | null;
};

type CartItem = Product & {
  quantity: number;
};

type Customer = {
  id: string;
  full_name: string;
  notes: string | null;
};

const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}


export default function SellPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);

  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, sale_price, stock, cost_price, image_url")
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        toast({ title: "Error", description: "No se pudieron cargar los productos destacados.", variant: "destructive" });
      } else {
        setFeaturedProducts(data as Product[]);
      }
      setLoadingFeatured(false);
    }
    fetchFeatured();
  }, [supabase, toast]);

  // Product search logic
  const handleSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, sale_price, stock, cost_price, image_url")
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (searchResults.length === 1) {
        addToCart(searchResults[0]);
      } else if (searchQuery.trim().length > 0 && searchResults.length === 0) {
        toast({
          title: "No encontrado",
          description: "No se encontró ningún producto con ese código o nombre.",
          variant: "destructive",
        })
      }
    }
  };


  // Customer fetch logic
  React.useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, notes')
        .order('full_name', { ascending: true });
      if (error) {
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
      } else {
        setCustomers(data);
      }
    };
    fetchCustomers();
  }, [supabase, toast]);
  
  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDialogOpen(false);
    setCustomerSearch("");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
  };

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
  
  const total = React.useMemo(() => {
    return cart.reduce((acc, item) => acc + item.sale_price * item.quantity, 0);
  }, [cart]);

  const subtotal = total / 1.16;
  const tax = total - subtotal;

  const handleProcessSale = async (paymentMethod: 'efectivo' | 'tarjeta') => {
    if (cart.length === 0) {
        toast({ title: "Carrito vacío", description: "Agrega productos para procesar la venta.", variant: "destructive" });
        return;
    }
    setIsProcessing(true);

    const saleItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        sale_price: item.sale_price,
        cost_price: item.cost_price || 0
    }));

    const { data: saleId, error } = await supabase.rpc('process_sale', {
        p_cart_items: saleItems,
        p_total_amount: total,
        p_tax_amount: tax,
        p_subtotal_amount: subtotal,
        p_payment_method: paymentMethod,
        p_customer_id: selectedCustomer?.id || null,
    });

    if (error) {
        toast({
            title: "Error al procesar la venta",
            description: error.message,
            variant: "destructive"
        });
    } else {
        toast({
            title: "Venta completada",
            description: `Venta #${saleId.substring(0, 8)} registrada con éxito.`,
        });
        setCart([]);
        setSelectedCustomer(null);
    }
    setIsProcessing(false);
  };

  const handleCancelSale = () => {
    setCart([]);
    setSelectedCustomer(null);
  }

  return (
    <>
      <div className="grid flex-1 auto-rows-max gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <div className="lg:col-span-2 xl:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Agregar Productos a la Venta</CardTitle>
              <CardDescription>
                Busque un producto o use el acceso rápido para agregarlo a la venta.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                    placeholder="Escanear código de barras o buscar por nombre/SKU..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus 
                    />
                </div>
                <div className="mt-2 space-y-2">
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
                </div>
              <Separator className="my-4" />
                <div className="space-y-2 flex flex-col flex-1">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Star className="h-4 w-4" />
                        Acceso Rápido
                    </h3>
                    {loadingFeatured ? (
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                        </div>
                    ) : (
                        <ScrollArea className="flex-1">
                            {featuredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-4">
                                {featuredProducts.map((product) => (
                                    <Button
                                    key={product.id}
                                    variant="outline"
                                    className="h-auto aspect-square flex flex-col justify-center gap-2 p-2"
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock < 1}
                                    >
                                    <Image
                                        alt={product.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.image_url || `https://placehold.co/64x64.png`}
                                        width="64"
                                        data-ai-hint="product photo"
                                    />
                                    <p className="text-xs text-center font-medium line-clamp-2">{product.name}</p>
                                    </Button>
                                ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                    Marque productos con una estrella en la página de Productos para verlos aquí.
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 xl:col-span-2">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Venta Actual</CardTitle>
              <div className="flex justify-between items-center pt-2">
                  {selectedCustomer ? (
                      <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{selectedCustomer.full_name}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCustomer}>
                            <UserX className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                     <Button variant="outline" size="sm" onClick={() => setCustomerDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Asignar Cliente
                    </Button>
                  )}
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
                  <div className="w-full space-y-2">
                      <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                          <span>IVA (16% Incluido)</span>
                          <span>${tax.toFixed(2)}</span>
                      </div>
                  </div>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <div className="grid grid-cols-2 gap-2">
                      <Button 
                          onClick={() => handleProcessSale('efectivo')} 
                          disabled={isProcessing || cart.length === 0}
                          size="lg"
                      >
                          <DollarSign className="mr-2 h-5 w-5" />
                          {isProcessing ? 'Procesando...' : 'Efectivo'}
                      </Button>
                      <Button 
                          onClick={() => handleProcessSale('tarjeta')} 
                          disabled={isProcessing || cart.length === 0}
                          size="lg"
                      >
                          <CreditCard className="mr-2 h-5 w-5" />
                          {isProcessing ? 'Procesando...' : 'Tarjeta'}
                      </Button>
                  </div>
                  <Button 
                      variant="outline" 
                      onClick={handleCancelSale} 
                      disabled={isProcessing || cart.length === 0}
                  >
                    <XCircle className="mr-2" />
                    Cancelar Venta
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Asignar Cliente</DialogTitle>
                  <DialogDescription>
                      Busque y seleccione un cliente para esta venta.
                  </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Buscar cliente..."
                          className="pl-8"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                  </div>
                  <ScrollArea className="h-64">
                      <div className="space-y-1 pr-4">
                          {filteredCustomers.length > 0 ? (
                              filteredCustomers.map(customer => (
                                  <Button
                                      key={customer.id}
                                      variant="ghost"
                                      className="w-full justify-start h-auto"
                                      onClick={() => selectCustomer(customer)}
                                  >
                                      <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                              <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                                          </Avatar>
                                          <div className="text-left">
                                              <p className="text-sm font-medium">{customer.full_name}</p>
                                              {customer.notes && <p className="text-xs text-muted-foreground">{customer.notes}</p>}
                                          </div>
                                      </div>
                                  </Button>
                              ))
                          ) : (
                              <p className="text-center text-sm text-muted-foreground py-4">
                                  {customers.length === 0 ? "No hay clientes." : "No se encontraron clientes."}
                              </p>
                          )}
                      </div>
                  </ScrollArea>
              </div>
          </DialogContent>
      </Dialog>
    </>
  )
}
