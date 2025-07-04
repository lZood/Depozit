
"use client"
import * as React from "react"
import {
  File,
  MoreHorizontal,
  PlusCircle,
  Image as ImageIcon,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
  status: z.enum(['active', 'draft', 'archived'], { required_error: "El estado es obligatorio." }),
  image_file: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type Product = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  status: 'active' | 'draft' | 'archived';
  sale_price: number;
  cost_price: number | null;
  stock: number;
  image_url: string | null;
  category_id: string | null;
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
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
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
      status: 'active',
      image_file: undefined,
    },
  });

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener productos:', error);
      toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, [supabase, toast, activeTab, searchQuery]);


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
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  React.useEffect(() => {
    if (!productDialogOpen) {
      setEditingProduct(null);
      form.reset();
      setImagePreview(null);
    }
  }, [productDialogOpen, form]);

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
    let finalImageUrl: string | null = editingProduct?.image_url || null;
    let oldImagePath: string | null = null;
    
    // 1. Handle image upload if a new file is provided
    if (values.image_file && values.image_file instanceof window.File) {
      const file = values.image_file;
      const filePath = `${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Error al subir la imagen", description: uploadError.message, variant: "destructive" });
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      finalImageUrl = publicUrl;

      // If we are editing and there was an old image, mark it for deletion
      if (editingProduct?.image_url) {
        oldImagePath = editingProduct.image_url.split('/').pop()!;
      }
    }

    // 2. Prepare product data for upsert
    const payload = {
      name: values.name,
      sku: values.sku,
      barcode: values.barcode || null,
      description: values.description || null,
      category_id: values.category_id || null,
      cost_price: values.cost_price || 0,
      sale_price: values.sale_price,
      stock: values.stock,
      status: values.status,
      image_url: finalImageUrl,
    };

    // 3. Insert or Update product in the database
    let error;
    if (editingProduct) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('products').insert([payload]);
        error = insertError;
    }

    if (error) {
      toast({
        title: `Error al guardar el producto`,
        description: error.message,
        variant: "destructive",
      });
       // If upsert failed but we uploaded a new image, delete it
       if (finalImageUrl && !editingProduct?.image_url) {
         const newFilePath = finalImageUrl.split('/').pop();
         if(newFilePath) await supabase.storage.from('product-images').remove([newFilePath]);
       }
    } else {
      toast({
        title: `Producto ${editingProduct ? 'actualizado' : 'guardado'}`,
        description: `El producto ha sido ${editingProduct ? 'actualizado' : 'agregado'} con éxito.`,
      });

      // If update was successful and we have an old image path, delete it
      if (oldImagePath) {
        await supabase.storage.from('product-images').remove([oldImagePath]);
      }
      
      setProductDialogOpen(false);
      await fetchProducts();
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      ...product,
      cost_price: product.cost_price ?? 0,
      description: product.description ?? "",
      barcode: product.barcode ?? "",
      category_id: product.category_id ?? "",
      image_file: undefined,
    });
    setImagePreview(product.image_url);
    setProductDialogOpen(true);
  };
  
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
  
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productToDelete.id);
  
    if (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    } else {
      // If product is deleted, also delete its image from storage
      if (productToDelete.image_url) {
        const imagePath = productToDelete.image_url.split("/").pop();
        if (imagePath) {
          await supabase.storage.from("product-images").remove([imagePath]);
        }
      }
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente.",
      });
      await fetchProducts();
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

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
      <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value)}>
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
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={() => setEditingProduct(null)}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Agregar Producto
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Modifique los detalles de su producto." : "Agregue un nuevo producto a su inventario."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onProductSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
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
                             <Select onValueChange={field.onChange} value={field.value}>
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
                           <FormLabel className="text-right">Existencias</FormLabel>
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
                            <Input type="number" step="0.01" placeholder="10.00" className="col-span-3" {...field} />
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
                            <Input type="number" step="0.01" placeholder="20.00" className="col-span-3" {...field} />
                          </FormControl>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                           <FormLabel className="text-right">Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="draft">Borrador</SelectItem>
                                    <SelectItem value="archived">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                           <FormMessage className="col-span-4 text-right" />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pt-4 border-t -mx-6 px-6 pb-0 bg-background sticky bottom-0">
                      <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
                        <Skeleton className="h-8 w-8 rounded-full float-right" />
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
                         <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
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
                      <TableCell className="text-right">
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
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-red-600 focus:text-red-600 focus:bg-red-50">Eliminar</DropdownMenuItem>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el
                    producto y su imagen del almacenamiento.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                    Continuar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

    