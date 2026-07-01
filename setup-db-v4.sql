-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup DB v4
-- Ejecutar en Supabase SQL Editor
-- (después de setup-db.sql, v2 y v3)
-- ════════════════════════════════════════

-- Variantes de producto: color + talle + stock
CREATE TABLE IF NOT EXISTS producto_variantes (
  id          SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  color       TEXT NOT NULL,
  talle       TEXT NOT NULL,
  stock       INTEGER DEFAULT 0,
  UNIQUE(producto_id, color, talle)
);
ALTER TABLE producto_variantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura variantes" ON producto_variantes FOR SELECT USING (true);
CREATE POLICY "Admin variantes"   ON producto_variantes FOR ALL USING (auth.role() = 'service_role');

-- Solicitudes de aviso de stock (clientes que quieren ser notificados)
CREATE TABLE IF NOT EXISTS solicitudes_stock (
  id              SERIAL PRIMARY KEY,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT,
  color           TEXT,
  talle           TEXT,
  nombre          TEXT,
  contacto        TEXT,
  tipo_contacto   TEXT,   -- 'whatsapp' | 'email'
  notificado      BOOLEAN DEFAULT FALSE,
  fecha           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE solicitudes_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insertar solicitudes" ON solicitudes_stock FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin solicitudes"    ON solicitudes_stock FOR ALL  USING (auth.role() = 'service_role');

-- Pedidos (carrito confirmado con datos de entrega)
CREATE TABLE IF NOT EXISTS pedidos (
  id            SERIAL PRIMARY KEY,
  items         JSONB,     -- [{nombre, color, talle, cantidad, precio}]
  total         INTEGER,
  metodo_pago   TEXT,      -- 'mp' | 'efectivo'
  tipo_entrega  TEXT,      -- 'retiro' | 'envio'
  nombre        TEXT,
  contacto      TEXT,
  tipo_contacto TEXT,      -- 'whatsapp' | 'email'
  horario       TEXT,
  direccion     TEXT,
  estado        TEXT DEFAULT 'pendiente',  -- pendiente | aceptado | rechazado
  costo_envio   INTEGER DEFAULT 0,
  notas         TEXT,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insertar pedidos" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin pedidos"    ON pedidos FOR ALL   USING (auth.role() = 'service_role');

-- Horarios del local (un registro por día)
CREATE TABLE IF NOT EXISTS horarios_local (
  id       SERIAL PRIMARY KEY,
  dia      INTEGER UNIQUE,  -- 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
  apertura TEXT,            -- 'HH:MM'
  cierre   TEXT,
  activo   BOOLEAN DEFAULT FALSE
);
ALTER TABLE horarios_local ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura horarios" ON horarios_local FOR SELECT USING (true);
CREATE POLICY "Admin horarios"   ON horarios_local FOR ALL   USING (auth.role() = 'service_role');

-- Insertar los 7 días si no existen
INSERT INTO horarios_local (dia, apertura, cierre, activo)
VALUES (0,'09:00','18:00',false),(1,'09:00','18:00',true),(2,'09:00','18:00',true),
       (3,'09:00','18:00',true),(4,'09:00','18:00',true),(5,'09:00','18:00',true),(6,'09:00','13:00',false)
ON CONFLICT (dia) DO NOTHING;
