import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
               <Logo />
            </div>
            <CardTitle className="text-2xl font-bold">Depozit</CardTitle>
            <CardDescription>
              ¡Bienvenido de nuevo! Por favor, ingrese sus datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="nombre@ejemplo.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="#" className="text-sm font-medium text-primary hover:underline">
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/dashboard">Iniciar sesión</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
