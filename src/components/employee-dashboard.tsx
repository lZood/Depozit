import Link from "next/link"
import {
  Activity,
  ArrowRight,
  ShoppingCart,
  DollarSign
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback } from "./ui/avatar"

const formatCurrency = (value: number | null | undefined) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
}

const getInitials = (name: string | null) => {
  if (!name || name === 'Cliente General') return "CG";
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.substring(0, 2).toUpperCase();
}


export default async function EmployeeDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
        <Card>
            <CardHeader><CardTitle>Error</CardTitle></CardHeader>
            <CardContent><p>No se pudo cargar la información del usuario.</p></CardContent>
        </Card>
    )
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [salesTodayRes, recentSalesRes] = await Promise.all([
     supabase
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    supabase
      .from('sales')
      .select('id, total_amount, customers(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const salesTodayCount = salesTodayRes.count || 0;
  const recentSales = recentSalesRes.data;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">¡Bienvenido de nuevo, {user.email?.split('@')[0]}!</CardTitle>
                <CardDescription>
                    Estás listo para empezar a vender. Haz clic en el botón de abajo para ir a la pantalla de ventas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild size="lg">
                    <Link href="/dashboard/sell">
                        Ir a Vender <ShoppingCart className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Realizadas Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{salesTodayCount}</div>
            <p className="text-sm text-muted-foreground">
              Ventas procesadas por ti hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tus Ventas Recientes</CardTitle>
            <CardDescription>
              Aquí están las últimas ventas que has procesado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {recentSales && recentSales.length > 0 ? (
                recentSales.map(sale => (
                    <div key={sale.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(sale.customers?.full_name || 'Cliente General')}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{sale.customers?.full_name || 'Cliente General'}</p>
                        </div>
                        <div className="ml-auto font-medium">{formatCurrency(sale.total_amount)}</div>
                    </div>
                ))
             ) : (
                <div className="flex flex-col items-start gap-4">
                    <p className="text-sm text-muted-foreground">No has realizado ventas todavía.</p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/sell">
                            Registrar una Venta <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
