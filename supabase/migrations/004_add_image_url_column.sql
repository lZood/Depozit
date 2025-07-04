-- This script safely adds the 'image_url' column to the 'products' table if it does not already exist.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.products.image_url IS 'URL to the product image in Supabase Storage.';
