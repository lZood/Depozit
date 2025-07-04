-- supabase/migrations/002_add_product_image_url.sql

-- Este script de migración agrega una columna para almacenar la URL de la imagen del producto.
-- También se asegura de que la política de seguridad permita leer esta nueva columna.

-- Paso 1: Agregar la columna 'image_url' a la tabla de productos.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.products.image_url IS 'URL de la imagen del producto almacenada en Supabase Storage.';

-- Paso 2: (Opcional pero recomendado) Actualizar la política de lectura para incluir explícitamente la nueva columna.
-- La política existente "Allow read access to everyone" ya debería cubrir esto, pero ser explícito puede ser más claro.
-- No es estrictamente necesario ejecutar esto si la política ya es `using (true)`.

-- Nota para el desarrollador:
-- No olvides crear un Bucket en Supabase Storage llamado 'product_images'.
-- Ve a Storage -> Create new bucket.
-- Nombre del bucket: product_images
-- Permisos: Marca la casilla "Public bucket".
-- Esto es necesario para que el frontend pueda subir y mostrar las imágenes.
