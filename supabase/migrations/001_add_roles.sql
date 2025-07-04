-- Migration Script: Add Roles and Update RLS Policies
-- This script can be run on the existing database to introduce the role system.

-- Create the custom app_role type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'employee');
    END IF;
END
$$;

-- 1. Create profiles table to store user roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'employee'
);
comment on table public.profiles is 'Almacena datos específicos del usuario, como el rol.';
alter table public.profiles enable row level security;

-- 2. Create a function to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'employee'); -- Default role is 'employee'
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create a trigger to call the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create a helper function to get the current user's role
create or replace function public.get_my_role()
returns text as $$
declare
    user_role text;
begin
    select role::text into user_role from public.profiles where id = auth.uid();
    return user_role;
end;
$$ language plpgsql security definer;

-- 5. Clean up old permissive policies
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

-- 6. Apply new, role-based RLS policies

-- Profiles: Users can only see and edit their own profile.
drop policy if exists "Allow individual read access" on public.profiles;
create policy "Allow individual read access" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Allow individual update access" on public.profiles;
create policy "Allow individual update access" on public.profiles for update using (auth.uid() = id);

-- Products: Everyone can read, but only admins can do everything else.
drop policy if exists "Allow read access to everyone" on public.products;
create policy "Allow read access to everyone" on public.products for select using (true);

drop policy if exists "Allow full access for admins" on public.products;
create policy "Allow full access for admins" on public.products for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Categories: Everyone can read, admins can do everything else.
drop policy if exists "Allow read access to everyone" on public.categories;
create policy "Allow read access to everyone" on public.categories for select using (true);

drop policy if exists "Allow full access for admins on categories" on public.categories;
create policy "Allow full access for admins on categories" on public.categories for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Suppliers: Only admins can manage.
drop policy if exists "Allow full access for admins on suppliers" on public.suppliers;
create policy "Allow full access for admins on suppliers" on public.suppliers for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Customers: Authenticated users (admins and employees) can manage.
drop policy if exists "Allow all access for authenticated users on customers" on public.customers;
create policy "Allow all access for authenticated users on customers" on public.customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Sales & Sale Items: Authenticated users can manage.
drop policy if exists "Allow all access for authenticated users on sales" on public.sales;
create policy "Allow all access for authenticated users on sales" on public.sales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Allow all access for authenticated users on sale_items" on public.sale_items;
create policy "Allow all access for authenticated users on sale_items" on public.sale_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Purchase Orders: Only admins can manage.
drop policy if exists "Allow full access for admins on purchase_orders" on public.purchase_orders;
create policy "Allow full access for admins on purchase_orders" on public.purchase_orders for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

drop policy if exists "Allow full access for admins on purchase_order_items" on public.purchase_order_items;
create policy "Allow full access for admins on purchase_order_items" on public.purchase_order_items for all using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Backfill profiles for existing users
-- This will insert a profile for any user in auth.users that doesn't have one yet.
insert into public.profiles (id, role)
select id, 'employee' from auth.users
where id not in (select id from public.profiles);
