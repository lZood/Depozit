
"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MoreHorizontal,
  PlusCircle,
  KeyRound,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";


type UserWithRole = {
  id: string;
  email: string | null;
  role: "admin" | "employee";
};

const newUserFormSchema = z.object({
  email: z.string().email("Debe ser un correo electrónico válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  role: z.enum(["admin", "employee"], { required_error: "Debe seleccionar un rol."}),
});
type NewUserFormValues = z.infer<typeof newUserFormSchema>;

const passwordFormSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;


const getInitials = (email: string | null) => {
  if (!email) return "??";
  return email.substring(0, 2).toUpperCase();
};

const timezones = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Cancun", label: "Cancún (GMT-5)" },
  { value: "America/Tijuana", label: "Tijuana (GMT-7)" },
  { value: "America/Mazatlan", label: "Mazatlán (GMT-7)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Caracas", label: "Caracas (GMT-4)" },
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/La_Paz", label: "La Paz (GMT-4)" },
];

export default function SettingsPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [timezone, setTimezone] = React.useState("America/Mazatlan");
  
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserWithRole | null>(null);
  
  const supabase = createClient();
  const { toast } = useToast();
  
  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserFormSchema),
    defaultValues: { email: "", password: "", role: "employee" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });


  const fetchUsers = React.useCallback(async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if(userError) {
        toast({ title: "Error", description: "No se pudo obtener el usuario actual.", variant: "destructive" });
    } else {
        setCurrentUser(userData.user);
    }

    const { data, error } = await supabase.rpc("get_users_with_roles");

    if (error) {
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsers(data as UserWithRole[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: "admin" | "employee") => {
    const originalUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

    const { error } = await supabase.rpc("update_user_role", {
      p_user_id: userId,
      p_new_role: newRole,
    });

    if (error) {
      toast({ title: "Error al actualizar rol", description: error.message, variant: "destructive" });
      setUsers(originalUsers);
    } else {
      toast({ title: "Rol actualizado", description: "El rol del usuario ha sido cambiado." });
    }
  };

  async function onCreateUserSubmit(values: NewUserFormValues) {
    setIsSubmitting(true);
    const { error } = await supabase.rpc('create_new_user', {
        p_email: values.email,
        p_password: values.password,
        p_role: values.role
    });

    if (error) {
        toast({ title: "Error al crear usuario", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Usuario creado", description: "El nuevo usuario ha sido agregado." });
        setCreateDialogOpen(false);
        newUserForm.reset();
        await fetchUsers();
    }
    setIsSubmitting(false);
  }

  const handlePasswordChangeClick = (user: UserWithRole) => {
    setSelectedUser(user);
    passwordForm.reset();
    setPasswordDialogOpen(true);
  };
  
  const handleDeleteClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const onPasswordChangeSubmit = async (values: PasswordFormValues) => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    
    const { error } = await supabase.rpc('change_user_password', {
        user_id: selectedUser.id,
        new_password: values.password
    });

    if (error) {
        toast({ title: "Error al cambiar contraseña", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Contraseña actualizada", description: `La contraseña para ${selectedUser.email} ha sido cambiada.` });
        setPasswordDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    const { error } = await supabase.rpc('delete_other_user', {
        user_id_to_delete: selectedUser.id
    });

    if (error) {
        toast({ title: "Error al eliminar usuario", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Usuario Eliminado", description: "El usuario ha sido eliminado correctamente."});
        await fetchUsers();
    }
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSaveSettings = () => {
    // In a real app, you would save this to localStorage or a database
    // For now, we'll just show a confirmation toast
    toast({
        title: "Ajustes Guardados",
        description: `La zona horaria se ha establecido a ${timezone}. Este cambio se aplicará en futuros reportes.`,
    });
  };

  return (
    <>
      <div className="grid flex-1 items-start gap-4 md:gap-8">
         <Card>
          <CardHeader>
             <div className="flex items-center">
                <div>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                        Administra los roles y permisos de los usuarios de la aplicación.
                    </CardDescription>
                </div>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Usuario
                    </Button>
                </div>
             </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1"><Skeleton className="h-4 w-48" /></div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full float-right" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{user.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id !== currentUser?.id && (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button aria-haspopup="true" size="icon" variant="ghost">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Alternar menú</span>
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                      <DropdownMenuSub>
                                          <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                              <DropdownMenuRadioGroup value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as "admin" | "employee")}>
                                                  <DropdownMenuRadioItem value="admin">Administrador</DropdownMenuRadioItem>
                                                  <DropdownMenuRadioItem value="employee">Empleado</DropdownMenuRadioItem>
                                              </DropdownMenuRadioGroup>
                                          </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuSub>
                                          <DropdownMenuSubTrigger>Seguridad</DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                              <DropdownMenuItem onClick={() => handlePasswordChangeClick(user)}>
                                                  <KeyRound className="mr-2 h-4 w-4" />
                                                  Cambiar Contraseña
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                  <Trash2 className="mr-2 h-4 w-4" />
                                                  Eliminar Usuario
                                              </DropdownMenuItem>
                                          </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No se encontraron usuarios.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
               {loading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                ) : users.length > 0 ? (
                    users.map(user => (
                        <Card key={user.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="font-medium truncate text-sm">{user.email}</p>
                                        <p className="text-sm capitalize text-muted-foreground">
                                            {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                                        </p>
                                    </div>
                                </div>
                                {user.id !== currentUser?.id && (
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Alternar menú</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuRadioGroup value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as "admin" | "employee")}>
                                                        <DropdownMenuRadioItem value="admin">Administrador</DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="employee">Empleado</DropdownMenuRadioItem>
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Seguridad</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => handlePasswordChangeClick(user)}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Cambiar Contraseña
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar Usuario
                                                    </DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No se encontraron usuarios.</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Configuración de la Tienda</CardTitle>
                <CardDescription>
                    Ajustes generales de la aplicación como la zona horaria para los reportes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:max-w-sm">
                    <div className="grid gap-2">
                        <Label htmlFor="timezone">Zona Horaria</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Seleccionar zona horaria" />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveSettings}>Guardar Cambios</Button>
            </CardFooter>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                    Complete el formulario para agregar un nuevo miembro al equipo.
                </DialogDescription>
            </DialogHeader>
            <Form {...newUserForm}>
                <form onSubmit={newUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
                    <FormField
                        control={newUserForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="nombre@ejemplo.com" {...field} autoComplete="email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={newUserForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={newUserForm.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rol</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar un rol" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="employee">Empleado</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creando..." : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                    Establezca una nueva contraseña para {selectedUser?.email}.
                </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar Contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta de
                    <span className="font-bold"> {selectedUser?.email} </span>
                    y todos sus datos asociados.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                    Confirmar Eliminación
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
