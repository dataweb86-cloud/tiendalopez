-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup DB v2
-- Ejecutar en Supabase SQL Editor
-- (después de haber ejecutado setup-db.sql)
-- ════════════════════════════════════════

-- Agregar columnas a productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS costo INTEGER DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS margen_pct NUMERIC(5,2);

-- Tabla consultas (registra cada consulta WhatsApp)
CREATE TABLE IF NOT EXISTS consultas (
  id           SERIAL PRIMARY KEY,
  producto_id  INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT,
  nombre       TEXT,
  telefono     TEXT,
  provincia    TEXT,
  ciudad       TEXT,
  consulta     TEXT,
  fecha        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insertar consultas" ON consultas FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin lee consultas" ON consultas FOR SELECT USING (auth.role() = 'service_role');

-- Tabla ventas
CREATE TABLE IF NOT EXISTS ventas (
  id           SERIAL PRIMARY KEY,
  producto_id  INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT,
  cantidad     INTEGER DEFAULT 1,
  precio_venta INTEGER,
  costo_venta  INTEGER,
  ganancia     INTEGER,
  notas        TEXT,
  fecha        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin ventas" ON ventas FOR ALL USING (auth.role() = 'service_role');

-- Tabla proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  contacto     TEXT,
  telefono     TEXT,
  email        TEXT,
  web_url      TEXT,
  categorias   TEXT,
  precio_promedio TEXT,
  tiene_oferta BOOLEAN DEFAULT FALSE,
  oferta_detalle TEXT,
  notas        TEXT,
  activo       BOOLEAN DEFAULT TRUE,
  ultima_revision TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin proveedores" ON proveedores FOR ALL USING (auth.role() = 'service_role');
