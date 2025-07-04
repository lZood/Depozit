
-- Habilitar la extensión pgcrypto si no está habilitada
create extension if not exists "pgcrypto" with schema "public";

-- Crear un tipo personalizado para los roles de la aplicación
do $$
begin
    if not exists (select 1 from pg_type where typname = 'app_role') then
        create type public.app_role as enum ('admin', 'employee');
    end if;
end$$;


-- Tabla de perfiles de usuario para almacenar roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'employee'
);
comment on table public.profiles is 'Almacena datos específicos del usuario, como el rol.';

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
  image_url text, -- URL de la imagen del producto
  category_id uuid references public.categories(id),
  supplier_id uuid references public.suppliers(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.products is 'Almacena los productos del inventario.';
comment on column public.products.image_url is 'URL de la imagen del producto almacenada en Supabase Storage.';


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
drop trigger if exists on_product_update on public.products;
create trigger on_product_update
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- Función para manejar la creación de nuevos usuarios y poblar la tabla de perfiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'employee'); -- El rol por defecto es 'employee'
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para ejecutar la función handle_new_user después de que se inserte un nuevo usuario en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función para obtener el rol del usuario actual
create or replace function public.get_my_role()
returns text as $$
declare
    user_role text;
begin
    if auth.uid() is null then
        return null;
    end if;
    select role::text into user_role from public.profiles where id = auth.uid();
    return user_role;
end;
$$ language plpgsql security definer;


-- POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (RLS)

-- Habilitar RLS en todas las tablas
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.profiles enable row level security;

-- Limpiar políticas antiguas antes de crear las nuevas
-- (Esto asegura que no haya políticas duplicadas o conflictivas)
drop policy if exists "Allow all authenticated users" on public.categories;
drop policy if exists "Enable read access for all users" on public.categories;
drop policy if exists "Allow all authenticated users" on public.suppliers;
drop policy if exists "Allow all authenticated users" on public.products;
drop policy if exists "Enable read access for all users" on public.products;
drop policy if exists "Allow all authenticated users" on public.customers;
drop policy if exists "Allow all authenticated users" on public.sales;
drop policy if exists "Allow all authenticated users" on public.sale_items;
drop policy if exists "Allow all authenticated users" on public.purchase_orders;
drop policy if exists "Allow all authenticated users" on public.purchase_order_items;

drop policy if exists "Allow individual read access" on public.profiles;
drop policy if exists "Allow individual update access" on public.profiles;
drop policy if exists "Allow read access to everyone" on public.products;
drop policy if exists "Allow full access for admins" on public.products;
drop policy if exists "Allow read access to everyone" on public.categories;
drop policy if exists "Allow full access for admins on categories" on public.categories;
drop policy if exists "Allow full access for admins on suppliers" on public.suppliers;
drop policy if exists "Allow all access for authenticated users on customers" on public.customers;
drop policy if exists "Allow all access for authenticated users on sales" on public.sales;
drop policy if exists "Allow all access for authenticated users on sale_items" on public.sale_items;
drop policy if exists "Allow full access for admins on purchase_orders" on public.purchase_orders;
drop policy if exists "Allow full access for admins on purchase_order_items" on public.purchase_order_items;

-- NUEVAS POLÍTICAS BASADAS EN ROLES

-- Perfiles: Los usuarios solo pueden ver y editar su propio perfil.
create policy "Allow individual read access" on public.profiles for select using (auth.uid() = id);
create policy "Allow individual update access" on public.profiles for update using (auth.uid() = id);

-- Productos: Todos pueden ver, pero solo los administradores pueden crear/modificar/eliminar.
create policy "Allow read access to everyone" on public.products for select using (true);
create policy "Allow full access for admins" on public.products for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Categorías: Todos pueden ver, pero solo los administradores pueden crear/modificar/eliminar.
create policy "Allow read access to everyone" on public.categories for select using (true);
create policy "Allow full access for admins on categories" on public.categories for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Proveedores: Solo los administradores pueden gestionar proveedores.
create policy "Allow full access for admins on suppliers" on public.suppliers for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Clientes: Los empleados y administradores pueden gestionar clientes.
create policy "Allow all access for authenticated users on customers" on public.customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Ventas y Detalle de Ventas: Los empleados y administradores pueden crear y ver ventas.
create policy "Allow all access for authenticated users on sales" on public.sales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Allow all access for authenticated users on sale_items" on public.sale_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Órdenes de Compra: Solo los administradores pueden gestionar las órdenes de compra.
create policy "Allow full access for admins on purchase_orders" on public.purchase_orders for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');
create policy "Allow full access for admins on purchase_order_items" on public.purchase_order_items for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');
