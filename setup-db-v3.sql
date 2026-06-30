-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup DB v3
-- Ejecutar en Supabase SQL Editor
-- (después de haber ejecutado setup-db.sql y setup-db-v2.sql)
-- Agrega soporte para hasta 3 fotos por producto
-- ════════════════════════════════════════

ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url2 TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url3 TEXT;
