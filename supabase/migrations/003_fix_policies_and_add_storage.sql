-- 1. FIX PRODUCT POLICIES
-- Drop the old restrictive policy that only allowed admins to do anything.
DROP POLICY IF EXISTS "Allow full access for admins" ON public.products;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.products;


-- Create new, more specific policies for the products table.
-- Allow authenticated users (admins and employees) to create products.
CREATE POLICY "Allow insert for authenticated users" ON public.products
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow admins to update products.
CREATE POLICY "Allow update for admins" ON public.products
FOR UPDATE TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

-- Allow admins to delete products.
CREATE POLICY "Allow delete for admins" ON public.products
FOR DELETE TO authenticated
USING (public.get_my_role() = 'admin');


-- 2. ADD STORAGE BUCKET POLICIES
-- NOTE: Before running this, you must create a PUBLIC bucket named 'product-images' in the Supabase Storage UI.

-- Allow public read access to the bucket.
CREATE POLICY "Allow public read on product images" ON storage.objects
FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow authenticated users to upload product images.
CREATE POLICY "Allow insert for authenticated users on product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Allow admins to update product images.
CREATE POLICY "Allow update for admins on product images" ON storage.objects
FOR UPDATE TO authenticated
USING ( bucket_id = 'product-images' AND public.get_my_role() = 'admin' )
WITH CHECK ( bucket_id = 'product-images' AND public.get_my_role() = 'admin' );

-- Allow admins to delete product images.
CREATE POLICY "Allow delete for admins on product images" ON storage.objects
FOR DELETE TO authenticated
USING ( bucket_id = 'product-images' AND public.get_my_role() = 'admin' );
