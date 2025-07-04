
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  AlertTriangle,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ProductInfo = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
};

type CategoryWithProducts = {
  id: string;
  name: string;
  products: ProductInfo[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryWithProducts | null>(null);
  const [categoryName, setCategoryName] = React.useState("");
  const supabase = createClient();
  const { toast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, products(id, name, sku, stock)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error al obtener categorías:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías.",
        variant: "destructive",
      });
    } else if (data) {
      setCategories(data as CategoryWithProducts[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (category: CategoryWithProducts) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingCategory(null);
    setCategoryName("");
    setDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la categoría. Es posible que esté en uso por algún producto.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente.",
      });
      fetchCategories();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) {
        toast({ title: "Error", description: "El nombre no puede estar vacío.", variant: "destructive" });
        return;
    }

    const mutation = editingCategory
      ? supabase.from("categories").update({ name: categoryName }).eq("id", editingCategory.id)
      : supabase.from("categories").insert([{ name: categoryName }]).select();

    const { error } = await mutation;

    if (error) {
      toast({ 
        title: `Error al ${editingCategory ? 'actualizar' : 'crear'}`, 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Éxito", 
        description: `Categoría ${editingCategory ? 'actualizada' : 'creada'}.` 
      });
      setDialogOpen(false);
      fetchCategories();
    }
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center">
        <div className="space-y-1">
            <h1 className="text-lg font-semibold md:text-2xl">Categorías</h1>
            <p className="text-sm text-muted-foreground">
                Expanda una categoría para ver los productos que contiene.
            </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" onClick={handleAddNewClick}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Agregar Categoría
            </span>
          </Button>
        </div>
      </div>
      
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-2 p-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
      ) : categories.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => (
            <AccordionItem value={category.id} key={category.id} className="border rounded-md mb-2 bg-card">
              <AccordionTrigger className="flex w-full items-center px-4 py-3 hover:no-underline">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-lg">{category.name}</span>
                      <Badge variant="secondary">{category.products.length} Productos</Badge>
                      {category.products.some(p => p.stock < 10) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Algunos productos tienen bajo inventario.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-1" 
                    onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling when clicking actions
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(category)}>
                          Editar
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">Eliminar</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente la
                                      categoría. Los productos en esta categoría no se eliminarán, pero se quedarán sin categoría.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-red-600 hover:bg-red-700">
                                      Continuar
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="px-4 pb-4">
                  {category.products.length > 0 ? (
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Existencias</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {category.products.map(product => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">{product.sku || 'N/A'}</TableCell>
                                <TableCell className="text-right">{product.stock}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm py-2">
                      No hay productos asignados a esta categoría.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-48">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">No se encontraron categorías</h3>
                <p className="text-sm text-muted-foreground">Comience agregando una nueva para organizar sus productos.</p>
            </div>
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar Categoría" : "Agregar Nueva Categoría"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Cambie el nombre de la categoría." : "Ingrese el nombre para la nueva categoría."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ej. Bebidas"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
