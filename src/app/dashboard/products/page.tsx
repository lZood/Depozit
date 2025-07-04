"use client"
import * as React from "react"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
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

export default function ProductsPage() {
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
            <Dialog>
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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nombre
                    </Label>
                    <Input id="name" placeholder="Nombre del Producto" className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">
                      SKU
                    </Label>
                    <Input id="sku" placeholder="SKU-12345" className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barcode" className="text-right">
                      Código de Barras
                    </Label>
                    <Input id="barcode" placeholder="123456789012" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Descripción
                    </Label>
                    <Textarea id="description" placeholder="Descripción del producto..." className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Categoría</Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cat1">Categoría 1</SelectItem>
                        <SelectItem value="cat2">Categoría 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right">Precio de Costo</Label>
                    <Input id="cost" type="number" placeholder="10.00" className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sale" className="text-right">Precio de Venta</Label>
                    <Input id="sale" type="number" placeholder="20.00" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar producto</Button>
                </DialogFooter>
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
                {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Imagen del producto"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={`https://placehold.co/64x64/2D3748/F7FAFC?text=P${i+1}`}
                      width="64"
                      data-ai-hint="product photo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    Nombre del Producto {i+1}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Activo</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    $499.99
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {25 + i*5}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>1-10</strong> de <strong>32</strong>{" "}
              productos
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  )
}
