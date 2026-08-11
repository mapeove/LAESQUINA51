-- Agregar campos de medios adicionales a la tabla de productos

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS secondary_image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;
