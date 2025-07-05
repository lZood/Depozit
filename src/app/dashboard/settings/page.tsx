
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
} from "lucide-react";

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
    DialogTrigger,
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

export default function SettingsPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserWithRole | null>(null);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [userToUpdate, setUserToUpdate] = React.useState<UserWithRole | null>(null);


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

  const handleDeleteClick = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const handlePasswordChangeClick = (user: UserWithRole) => {
    setUserToUpdate(user);
    passwordForm.reset();
    setPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    const { error } = await supabase.rpc('delete_app_user', {
        p_user_id_to_delete: userToDelete.id
    });

    if (error) {
        toast({ title: "Error al eliminar usuario", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Usuario Eliminado", description: "El usuario ha sido eliminado correctamente."});
        await fetchUsers();
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  async function onPasswordSubmit(values: PasswordFormValues) {
    if (!userToUpdate) return;
    
    const { error } = await supabase.rpc('update_user_password', {
        p_user_id: userToUpdate.id,
        p_new_password: values.password,
    });

    if (error) {
        toast({ title: "Error al cambiar contraseña", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Contraseña actualizada", description: `La contraseña para ${userToUpdate.email} ha sido cambiada.` });
        setPasswordDialogOpen(false);
    }
  }


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
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Usuario
                        </Button>
                    </DialogTrigger>
                </div>
             </div>
          </CardHeader>
          <CardContent>
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
                                    <DropdownMenuItem onSelect={() => handlePasswordChangeClick(user)}>
                                        Cambiar Contraseña
                                    </DropdownMenuItem>
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
                                    <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                        Eliminar Usuario
                                    </DropdownMenuItem>
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
          </CardContent>
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
                                    <Input type="email" placeholder="nombre@ejemplo.com" {...field} />
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
                                    <Input type="password" placeholder="••••••••" {...field} />
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del usuario
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

       <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                    Establezca una nueva contraseña para {userToUpdate?.email}.
                </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
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
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting ? "Guardando..." : "Guardar Contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
