import Link from "next/link"
import {
  Activity,
  ArrowRight,
  ShoppingCart
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function EmployeeDashboard() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">¡Bienvenido de nuevo!</CardTitle>
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
              Carritos Abiertos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+5</div>
            <p className="text-sm text-muted-foreground">
              +2 desde la última hora
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tus Ventas Recientes</CardTitle>
            <CardDescription>
              Aquí verás las últimas ventas que has procesado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center">
                <p className="text-sm text-muted-foreground">No has realizado ventas todavía.</p>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard/sell">
                    Registrar una Venta <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
