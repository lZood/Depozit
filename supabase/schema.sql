-- Habilitar la extensión pgcrypto si no está habilitada
create extension if not exists "pgcrypto" with schema "public";

-- Tabla para Categorías de Productos
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.categories is 'Almacena las categorías de los productos.';

-- Tabla para Proveedores
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.suppliers is 'Almacena información sobre los proveedores.';

-- Tabla para Productos
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  sku text unique,
  barcode text unique,
  cost_price numeric(10, 2) default 0.00 not null,
  sale_price numeric(10, 2) not null,
  stock integer default 0 not null,
  status text default 'active'::text not null, -- 'active', 'draft', 'archived'
  category_id uuid references public.categories(id),
  supplier_id uuid references public.suppliers(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.products is 'Almacena los productos del inventario.';

-- Tabla para Clientes
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text unique,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.customers is 'Almacena la información de los clientes.';

-- Tabla para Ventas (o transacciones)
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers(id), -- puede ser nulo para ventas sin registrar
  subtotal numeric(10, 2) not null,
  tax_amount numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  payment_method text, -- 'cash', 'card', etc.
  status text default 'completed'::text not null, -- 'completed', 'paused', 'cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.sales is 'Registra cada transacción de venta.';

-- Tabla de Detalle de Venta (artículos vendidos)
create table if not exists public.sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references public.sales(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  price_at_sale numeric(10, 2) not null, -- Precio del producto al momento de la venta
  cost_price_at_sale numeric(10, 2) not null -- Costo del producto para calcular ganancia
);
comment on table public.sale_items is 'Almacena los productos individuales de cada venta.';

-- Tabla para Órdenes de Compra
create table if not exists public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) not null,
  status text default 'pending'::text not null, -- 'pending', 'completed', 'cancelled'
  total_amount numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);
comment on table public.purchase_orders is 'Registra las órdenes de compra a proveedores.';

-- Tabla de Detalle de Órdenes de Compra
create table if not exists public.purchase_order_items (
    id uuid default gen_random_uuid() primary key,
    purchase_order_id uuid references public.purchase_orders(id) on delete cascade not null,
    product_id uuid references public.products(id) not null,
    quantity integer not null,
    cost_price numeric(10, 2) not null -- Costo del producto en esta compra específica
);
comment on table public.purchase_order_items is 'Almacena los productos de una orden de compra.';

-- Función para actualizar el campo updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Trigger para actualizar updated_at en la tabla de productos
create trigger on_product_update
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- Políticas de Seguridad a Nivel de Fila (RLS)
-- Es una buena práctica habilitar RLS en todas las tablas y definir políticas explícitas.
-- Por ahora, solo habilitaremos RLS, asumiendo que el acceso será a través de la clave de servicio (service_role)
-- que omite RLS. Se deben definir políticas más granulares para el acceso del lado del cliente.

alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

-- Políticas permisivas para empezar (permitir todo a usuarios autenticados)
-- **¡ADVERTENCIA!** Estas son políticas muy permisivas. Para producción, debes restringirlas
-- según los roles y permisos de tu aplicación.

create policy "Allow all authenticated users" on public.categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.suppliers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.sales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.sale_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.purchase_orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all authenticated users" on public.purchase_order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Permitir acceso de lectura (select) a todos los usuarios, incluyendo no autenticados, para ciertas tablas.
create policy "Enable read access for all users" on public.products for select using (true);
create policy "Enable read access for all users" on public.categories for select using (true);
