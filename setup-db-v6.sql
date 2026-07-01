-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup DB v6
-- Clientes registrados + Config tienda
-- Ejecutar en Supabase SQL Editor
-- ════════════════════════════════════════

-- Clientes registrados
CREATE TABLE IF NOT EXISTS clientes (
  id              SERIAL PRIMARY KEY,
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  telefono        TEXT UNIQUE NOT NULL,
  mail            TEXT,
  provincia       TEXT,
  ciudad          TEXT,
  direccion       TEXT,
  descuento_pct   INTEGER DEFAULT NULL,  -- NULL = usa config global
  acepta_notif    BOOLEAN DEFAULT TRUE,
  fecha_registro  TIMESTAMPTZ DEFAULT NOW(),
  activo          BOOLEAN DEFAULT TRUE
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes publico lectura"  ON clientes FOR SELECT USING (true);
CREATE POLICY "Clientes publico insertar" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin clientes"            ON clientes FOR ALL USING (auth.role() = 'service_role');

-- Configuración de la tienda (clave-valor)
CREATE TABLE IF NOT EXISTS config_tienda (
  id    SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT
);
ALTER TABLE config_tienda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config lectura publica" ON config_tienda FOR SELECT USING (true);
CREATE POLICY "Admin config"           ON config_tienda FOR ALL USING (auth.role() = 'service_role');

-- Valores por defecto
INSERT INTO config_tienda (clave, valor) VALUES
  ('descuento_clientes_pct', '10'),
  ('rifa_activa',   'false'),
  ('rifa_link',     ''),
  ('rifa_titulo',   ''),
  ('rifa_descripcion', ''),
  ('rifa_numeros',  '')
ON CONFLICT (clave) DO NOTHING;

-- Agregar cliente_id a pedidos (si no existe)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS descuento_aplicado INTEGER DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total_original  INTEGER DEFAULT 0;

-- Estado cobrado en pedidos: no requiere cambio en columna (ya es TEXT)
-- Los posibles estados son: pendiente | aceptado | rechazado | cobrado
