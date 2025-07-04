
"use client"
import * as React from "react"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Image as ImageIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const productFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  sku: z.string().min(1, "El SKU es obligatorio."),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  cost_price: z.coerce.number().min(0, "El precio debe ser positivo.").optional(),
  sale_price: z.coerce.number().min(0.01, "El precio de venta es obligatorio y debe ser mayor a 0."),
  stock: z.coerce.number().int("Las existencias deben ser un número entero.").min(0, "Las existencias no pueden ser negativas."),
  image_file: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type Product = {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'archived';
  sale_price: number;
  stock: number;
  image_url: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = React.useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      category_id: "",
      cost_price: 0,
      sale_price: 0,
      stock: 0,
      image_file: undefined,
    },
  });

  const fetchProducts = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, status, sale_price, stock, image_url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener productos:', error);
      toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
    } else if (data) {
      setProducts(data as Product[]);
    }
  }, [supabase, toast]);

  const fetchCategories = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
      
    if (error) {
      console.error('Error al obtener categorías:', error);
      toast({ title: "Error", description: "No se pudieron cargar las categorías.", variant: "destructive" });
    } else if (data) {
      setCategories(data as Category[]);
    }
  }, [supabase, toast]);

  React.useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchProducts(), fetchCategories()]);
        setLoading(false);
    }
    
    loadData();
  }, [fetchProducts, fetchCategories]);
  
  React.useEffect(() => {
    if (!addProductDialogOpen) {
      form.reset();
      setImagePreview(null);
    }
  }, [addProductDialogOpen, form]);

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCategoryName.trim()) {
        toast({ title: "Error", description: "El nombre no puede estar vacío.", variant: "destructive" });
        return;
    }

    const { error } = await supabase.from("categories").insert([{ name: newCategoryName }]);

    if (error) {
      toast({ 
        title: "Error al crear", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Éxito", 
        description: "Categoría creada." 
      });
      setAddCategoryDialogOpen(false);
      setNewCategoryName("");
      await fetchCategories();
    }
  };

  async function onProductSubmit(values: ProductFormValues) {
    let imageUrl: string | null = null;

    // 1. Handle image upload if a file is provided
    if (values.image_file && values.image_file instanceof window.File) {
      const file = values.image_file;
      const filePath = `public/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Error al subir la imagen",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrl;
    }

    // 2. Prepare product data for insertion
    const payload = {
      name: values.name,
      sku: values.sku,
      barcode: values.barcode || null,
      description: values.description || null,
      category_id: values.category_id || null,
      cost_price: values.cost_price || 0,
      sale_price: values.sale_price,
      stock: values.stock,
      status: 'active',
      image_url: imageUrl,
    };

    // 3. Insert product into the database
    const { error } = await supabase.from('products').insert([payload]);

    if (error) {
      toast({
        title: "Error al guardar el producto",
        description: error.message,
        variant: "destructive",
      });
       // Optional: Attempt to delete the orphaned image if product insertion fails
       if (imageUrl) {
         const filePath = imageUrl.split('/').pop();
         if(filePath) await supabase.storage.from('product-images').remove([`public/${filePath}`]);
       }
    } else {
      toast({
        title: "Producto guardado",
        description: "El nuevo producto ha sido agregado a tu inventario.",
      });
      setAddProductDialogOpen(false);
      await fetchProducts();
    }
  }

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'outline';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activo</TabsTrigger>
            <TabsTrigger value="draft">Borrador</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archivado
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filtrar
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Activo
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Borrador</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Archivado
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Agregar Producto
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Agregar Producto</DialogTitle>
                  <DialogDescription>
                    Agregue un nuevo producto a su inventario. Haga clic en guardar cuando haya terminado.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onProductSubmit)} className="grid gap-4 py-4">
                     <FormField
                        control={form.control}
                        name="image_file"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-start gap-4">
                            <FormLabel className="text-right pt-2">Imagen</FormLabel>
                            <div className="col-span-3">
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <div className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center">
                                    {imagePreview ? (
                                       <Image src={imagePreview} alt="Vista previa" width={96} height={96} className="aspect-square rounded-md object-cover" />
                                    ) : (
                                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                    )}
                                  </div>
                                  <Label htmlFor="image-upload" className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
                                    Subir un archivo
                                    <Input 
                                      id="image-upload"
                                      type="file" 
                                      className="sr-only" 
                                      accept="image/*"
                                      capture="environment"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          field.onChange(file);
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setImagePreview(reader.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </Label>
                                </div>
                              </FormControl>
                              <FormMessage className="pt-2" />
                            </div>
                          </FormItem>
                        )}
                      />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del Producto" className="col-span-3" {...field} />
                          </FormControl>
                          <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">SKU</FormLabel>
                           <FormControl>
                              <Input placeholder="SKU-12345" className="col-span-3" {...field} />
                           </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Código de Barras</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789012" className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descripción del producto..." className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Categoría</FormLabel>
                           <div className="col-span-3 flex items-center gap-2">
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                               </FormControl>
                                <SelectContent>
                                  {categories.length > 0 ? (
                                    categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="loading" disabled>
                                      {loading ? "Cargando..." : "Sin categorías"}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                             </Select>
                             <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
                               <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                                     <PlusCircle className="h-4 w-4" />
                                     <span className="sr-only">Agregar Nueva Categoría</span>
                                 </Button>
                               </DialogTrigger>
                               <DialogContent>
                                 <form onSubmit={handleAddCategory}>
                                     <DialogHeader>
                                         <DialogTitle>Agregar Nueva Categoría</DialogTitle>
                                         <DialogDescription>
                                             Ingrese el nombre para la nueva categoría.
                                         </DialogDescription>
                                     </DialogHeader>
                                     <div className="grid gap-4 py-4">
                                         <Label htmlFor="new-category-name">Nombre</Label>
                                         <Input 
                                             id="new-category-name" 
                                             value={newCategoryName}
                                             onChange={(e) => setNewCategoryName(e.target.value)}
                                             placeholder="Ej. Bebidas"
                                             required
                                         />
                                     </div>
                                     <DialogFooter>
                                         <Button type="submit">Guardar Categoría</Button>
                                     </DialogFooter>
                                 </form>
                               </DialogContent>
                             </Dialog>
                           </div>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">Existencias Iniciales</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">Precio de Costo</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10.00" className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sale_price"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">Precio de Venta</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="20.00" className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Guardando..." : "Guardar producto"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Gestione sus productos y vea su rendimiento de ventas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Imagen</span>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Precio
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Existencias
                  </TableHead>
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
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={product.name || "Imagen del producto"}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={product.image_url || `https://placehold.co/64x64.png`}
                          width="64"
                          data-ai-hint="product photo"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.status)}>{getStatusText(product.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ${product.sale_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.stock}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Alternar menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No se encontraron productos. Comience agregando uno nuevo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{products.length}</strong> de <strong>{products.length}</strong>{" "}
              productos
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  )
}
