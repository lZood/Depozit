"use client";

import Link from "next/link";
import {
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Truck,
  Warehouse,
  Building,
  Settings,
  PanelLeft,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayoutClient({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole: "admin" | "employee";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    console.log('[DashboardLayoutClient] Logging out...');
    await supabase.auth.signOut();
    console.log('[DashboardLayoutClient] Logout complete. Redirecting to login page.');
    // Pushing to the root will trigger the middleware, which will handle
    // the user being logged out and ensure they stay on the login page.
    router.push('/');
  };

  const allNavItems = [
    { href: "/dashboard", icon: Home, label: "Panel", roles: ['admin', 'employee'] },
    { href: "/dashboard/sell", icon: ShoppingCart, label: "Vender", roles: ['admin', 'employee'] },
    { href: "/dashboard/products", icon: Package, label: "Productos", roles: ['admin', 'employee'] },
    { href: "/dashboard/orders", icon: Truck, label: "Órdenes de Compra", roles: ['admin'] },
    { href: "/dashboard/inventory", icon: Warehouse, label: "Inventario", roles: ['admin', 'employee'] },
    { href: "/dashboard/reports", icon: LineChart, label: "Reportes", roles: ['admin'] },
    { href: "/dashboard/customers", icon: Users, label: "Clientes", roles: ['admin', 'employee'] },
    { href: "/dashboard/suppliers", icon: Building, label: "Proveedores", roles: ['admin'] },
  ];

  const settingsNav = {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Configuración",
    roles: ['admin']
  };

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));
  const showSettings = settingsNav.roles.includes(userRole);
  
  const pageTitle = [...navItems, ...(showSettings ? [settingsNav] : [])].find(item => pathname === item.href)?.label || "Panel";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Depozit</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          {showSettings && (
            <Link
              href={settingsNav.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                pathname.startsWith(settingsNav.href) &&
                  "bg-accent text-accent-foreground"
              )}
            >
              <settingsNav.icon className="h-5 w-5" />
              <span className="sr-only">{settingsNav.label}</span>
            </Link>
          )}
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Alternar Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Depozit</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                      pathname === item.href && "text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 {showSettings && (
                    <Link
                        href={settingsNav.href}
                        className={cn(
                        "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                        pathname.startsWith(settingsNav.href) && "text-foreground"
                        )}
                    >
                        <settingsNav.icon className="h-5 w-5" />
                        {settingsNav.label}
                    </Link>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold hidden md:flex">{pageTitle}</h1>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Image
                    src="https://placehold.co/36x36.png"
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="rounded-full"
                    data-ai-hint="person avatar"
                  />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {userRole === 'admin' ? 'Cuenta de Administrador' : 'Cuenta de Empleado'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showSettings && <DropdownMenuItem asChild><Link href="/dashboard/settings">Configuración</Link></DropdownMenuItem>}
              <DropdownMenuItem>Soporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
