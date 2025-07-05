
"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserWithRole = {
  id: string;
  email: string | null;
  role: "admin" | "employee";
};

const getInitials = (email: string | null) => {
  if (!email) return "??";
  return email.substring(0, 2).toUpperCase();
};

export default function SettingsPage() {
  const [users, setUsers] = React.useState<UserWithRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{ id: string } | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

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
        description: "No se pudieron obtener los datos de los usuarios. Asegúrese de que las funciones de Supabase estén implementadas.",
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
    
    // Optimistic UI update
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

    const { error } = await supabase.rpc("update_user_role", {
      p_user_id: userId,
      p_new_role: newRole,
    });

    if (error) {
      toast({
        title: "Error al actualizar rol",
        description: error.message,
        variant: "destructive",
      });
      // Revert optimistic update on error
      setUsers(originalUsers);
    } else {
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido cambiado exitosamente.",
      });
      // Optional: refetch to ensure data is in sync
      // fetchUsers(); 
    }
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los roles y permisos de los usuarios de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="w-[180px]">Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
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
                       {user.id === currentUser?.id ? (
                           <Badge variant="secondary" className="text-base font-medium">
                            {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                           </Badge>
                       ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "employee") =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="employee">Empleado</SelectItem>
                          </SelectContent>
                        </Select>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
