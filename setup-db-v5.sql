-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup DB v5
-- Campos de categorización para filtros
-- Ejecutar en Supabase SQL Editor
-- ════════════════════════════════════════

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS genero        TEXT,
  ADD COLUMN IF NOT EXISTS temporada     TEXT,
  ADD COLUMN IF NOT EXISTS material      TEXT,
  ADD COLUMN IF NOT EXISTS estilo        TEXT,
  ADD COLUMN IF NOT EXISTS ocasion       TEXT,
  ADD COLUMN IF NOT EXISTS marca         TEXT,
  ADD COLUMN IF NOT EXISTS coleccion     TEXT,
  ADD COLUMN IF NOT EXISTS es_novedad    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS es_oferta     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_oferta INTEGER;
