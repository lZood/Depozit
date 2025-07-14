
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
  LayoutGrid,
  LoaderCircle,
  Shield,
  Briefcase,
  LifeBuoy,
} from "lucide-react";
import * as React from "react";

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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback } from "./ui/avatar";

type SearchResult = {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
};

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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // State for global product search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleSearch = React.useCallback(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsPopoverOpen(false);
        return;
      }
      setIsSearching(true);
      setIsPopoverOpen(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, image_url')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(5);

      setSearchResults(data || []);
      setIsSearching(false);
  }, [supabase]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleProductSelection = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsPopoverOpen(false);
  };
  
  // Close popover if we click outside
  React.useEffect(() => {
    if (!pathname.includes('/products/')) {
        handleProductSelection();
    }
  }, [pathname]);

  const allNavItems = [
    { href: "/dashboard", icon: Home, label: "Panel", roles: ['admin', 'employee'] },
    { href: "/dashboard/sell", icon: ShoppingCart, label: "Vender", roles: ['admin', 'employee'] },
    { href: "/dashboard/products", icon: Package, label: "Productos", roles: ['admin', 'employee'] },
    { href: "/dashboard/categories", icon: LayoutGrid, label: "Categorías", roles: ['admin', 'employee'] },
    { href: "/dashboard/orders", icon: Truck, label: "Órdenes de Compra", roles: ['admin'] },
    { href: "/dashboard/inventory", icon: Warehouse, label: "Inventario", roles: ['admin', 'employee'] },
    { href: "/dashboard/reports", icon: LineChart, label: "Reportes", roles: ['admin'] },
    { href: "/dashboard/customers", icon: Users, label: "Clientes", roles: ['admin', 'employee'] },
    { href: "/dashboard/suppliers", icon: Building, label: "Proveedores", roles: ['admin'] },
    { href: "/dashboard/support", icon: LifeBuoy, label: "Soporte", roles: ['admin', 'employee'] },
  ];

  const settingsNav = {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Configuración",
    roles: ['admin']
  };

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));
  const showSettings = settingsNav.roles.includes(userRole);
  
  const pageTitle = [...navItems, ...(showSettings ? [settingsNav] : [])].find(item => pathname.startsWith(item.href) && item.href !== '/dashboard')?.label || "Panel";

  const renderSearchPopover = () => (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
            <div className="relative ml-auto flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </PopoverAnchor>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
            {isSearching && (
                <div className="flex items-center justify-center p-4">
                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
            {!isSearching && searchResults.length === 0 && searchQuery.length > 1 && (
                 <div className="py-6 text-center text-sm text-muted-foreground">
                    No se encontraron productos.
                </div>
            )}
            {!isSearching && searchResults.length > 0 && (
                <div className="flex flex-col gap-1">
                {searchResults.map(product => (
                    <Link
                        key={product.id}
                        href={`/dashboard/products/${product.id}/details`}
                        className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-accent"
                        onClick={handleProductSelection}
                    >
                        <Avatar className="h-8 w-8">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} width={32} height={32} className="object-cover" />
                            ) : (
                                <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">SKU: {product.sku || 'N/A'}</p>
                        </div>
                    </Link>
                ))}
                </div>
            )}
        </PopoverContent>
    </Popover>
  );

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
          {navItems.map((item) => {
             const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
             return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
             )
            })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          {showSettings && (() => {
            const isActive = pathname.startsWith(settingsNav.href);
            return (
              <Link
                href={settingsNav.href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  isActive &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <settingsNav.icon className="h-5 w-5" />
                <span className="sr-only">{settingsNav.label}</span>
              </Link>
            )
          })()}
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Alternar Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 px-2.5 text-primary font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package2 className="h-6 w-6" />
                  <span>Depozit</span>
                </Link>
                {navItems.map((item) => {
                  const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                        isActive && "text-foreground font-semibold"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
                 {showSettings && (() => {
                    const isActive = pathname.startsWith(settingsNav.href);
                    return (
                      <Link
                          href={settingsNav.href}
                          className={cn(
                          "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                          isActive && "text-foreground font-semibold"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                      >
                          <settingsNav.icon className="h-5 w-5" />
                          {settingsNav.label}
                      </Link>
                    )
                 })()}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="hidden font-semibold md:flex md:items-center md:gap-2">
              <Package2 className="h-6 w-6" />
              <span className="text-lg">Depozit</span>
          </div>
          
          {renderSearchPopover()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="overflow-hidden rounded-full ml-2"
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
              <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                {userRole === 'admin' ? (
                  <Shield className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  {userRole === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showSettings && <DropdownMenuItem asChild><Link href="/dashboard/settings">Configuración</Link></DropdownMenuItem>}
              <DropdownMenuItem asChild><Link href="/dashboard/support">Soporte</Link></DropdownMenuItem>
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
