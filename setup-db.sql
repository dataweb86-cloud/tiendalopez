-- ════════════════════════════════════════
-- VANESA LOPEZ TIENDA — Setup Base de Datos
--
-- IMPORTANTE: Antes de ejecutar este SQL,
-- crear el bucket de Storage en Supabase:
-- Storage → New bucket → Nombre: "productos" → Public ✓
-- ════════════════════════════════════════
-- Ejecutar en Supabase SQL Editor
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS productos (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  marca         TEXT DEFAULT 'Vanesa Lopez',
  categoria     TEXT,
  precio        INTEGER NOT NULL,
  precio_original INTEGER,
  descuento     TEXT,
  badge         TEXT,
  badge_tipo    TEXT DEFAULT '',       -- '' | 'red' | 'black'
  descripcion   TEXT,
  imagen_url    TEXT,
  seccion       TEXT NOT NULL,         -- 'nuevos' | 'promociones' | 'ofertas' | 'liquidacion'
  activo        BOOLEAN DEFAULT TRUE,
  orden         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública" ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admin full access" ON productos FOR ALL USING (auth.role() = 'service_role');

-- Datos de ejemplo
INSERT INTO productos (nombre, categoria, precio, descripcion, seccion, orden) VALUES
('Vestido Noir Élégant',  'Vestidos',    28900, 'Corte midi impecable, tejido premium.',          'nuevos',      1),
('Blusa Satén Dorado',    'Blusas',      14500, 'Satén de primera calidad con caída perfecta.',    'nuevos',      2),
('Pantalón Palazzo',      'Pantalones',  18900, 'Corte ancho y fluido. Tiro alto.',                'nuevos',      3),
('Cardigan Luxe',         'Tejidos',     22000, 'Tejido suave y cálido. Entretiempo.',             'nuevos',      4);

INSERT INTO productos (nombre, categoria, precio, precio_original, descuento, badge, badge_tipo, descripcion, seccion, orden) VALUES
('Set Coordinado Lino',   'Sets',        32000, 42000, '-24%', 'PROMO', '',      'Lino premium. Comodidad y estilo.',       'promociones', 1),
('Vestido Floral Midi',   'Vestidos',    19500, 26000, '-25%', 'PROMO', '',      'Estampado floral exclusivo.',             'promociones', 2),
('Camisa Oversize',       'Camisas',     11900, 16500, '-28%', 'PROMO', '',      'Clásico renovado. Corte moderno.',        'promociones', 3),
('Falda Midi Plisada',    'Faldas',      16800, 22000, '-24%', 'PROMO', '',      'Plisado elegante.',                       'promociones', 4),
('Blazer Estructurado',   'Sacos',       34900, 45000, '-22%', 'OFERTA','red',   'Confección impecable. Silueta definida.', 'ofertas',     1),
('Jumpsuit Clásico',      'Jumpsuits',   26500, 36000, '-26%', 'OFERTA','red',   'Un solo look completo y sofisticado.',    'ofertas',     2),
('Top Broderie',          'Tops',         9800, 13500, '-27%', 'OFERTA','red',   'Bordado artesanal.',                      'ofertas',     3),
('Pantalón Sastre',       'Pantalones',  21500, 28000, '-23%', 'OFERTA','red',   'Línea recta y corte impecable.',          'ofertas',     4),
('Vestido Lencero',       'Vestidos',     8900, 24000, '-63%', 'LIQUIDACIÓN','black','Satén suave. Stock limitado.',        'liquidacion', 1),
('Abrigo Clásico',        'Abrigos',     29900, 68000, '-56%', 'LIQUIDACIÓN','black','Paño premium. ¡Últimas unidades!',   'liquidacion', 2),
('Set Deportivo Chic',    'Deportivo',   12500, 32000, '-61%', 'LIQUIDACIÓN','black','Comodidad máxima con estilo.',        'liquidacion', 3),
('Vestido Cóctel',        'Vestidos',    18900, 48000, '-61%', 'LIQUIDACIÓN','black','Tul y encaje. Para eventos.',         'liquidacion', 4);
