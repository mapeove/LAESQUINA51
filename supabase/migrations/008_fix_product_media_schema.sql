-- Migration 008: Fix Product Media Schema
-- Adds the secondary_image_url column which was missing in production

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
