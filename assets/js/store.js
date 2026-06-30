/* ─── CONFIG ────────────────────────────────────── */
const WA_NUMBER = '5492954589194'; // +54 9 2954 58-9194

/* ─── CONFIG SUPABASE ───────────────────────────── */
const SB_URL  = 'https://mqqwfphxqqnzqlgskjpm.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcXdmcGh4cXFuenFsZ3NranBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjE5NzUsImV4cCI6MjA5ODM5Nzk3NX0.dlbhxOn3pB-pdm6xQCWIBr-kaPSqjKoj5qkIhFetTjo';

const COLORS = [
  'linear-gradient(135deg,#2d2d2d,#1a1a1a)',
  'linear-gradient(135deg,#3d2b1f,#1a1008)',
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#2d1b2e,#1a0f1e)',
  'linear-gradient(135deg,#1a2a1a,#0f1a0f)',
  'linear-gradient(135deg,#2a2015,#1a1008)',
];

let cart = [];
let currentProduct = null;
let allProducts = [];

/* ─── FETCH SUPABASE ────────────────────────────── */
async function fetchProducts() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/productos?activo=eq.true&order=orden.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (e) {
    console.error('Supabase error:', e);
    return [];
  }
}

/* ─── RENDER PRODUCTS ───────────────────────────── */
function renderProducts(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Sin productos disponibles.</p>';
    return;
  }
  container.innerHTML = list.map((p, i) => `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="product-img">
        ${p.badge ? `<div class="product-badge ${p.badge_tipo || ''}">${p.badge}</div>` : ''}
        ${p.imagen_url
          ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover" />`
          : `<div class="product-placeholder" style="background:${COLORS[i % COLORS.length]}">
               <span style="opacity:.4;font-size:.65rem;letter-spacing:.1em">${p.categoria || ''}</span>
             </div>`
        }
        <div class="product-actions" onclick="event.stopPropagation()">
          <button onclick="quickAdd(${p.id})">+ Carrito</button>
          <button class="primary" onclick="openModal(${p.id})">Ver más</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-brand">${p.marca || 'Vanesa Lopez'}</div>
        <div class="product-name">${p.nombre}</div>
        <div class="product-prices">
          <span class="product-price">${fmt(p.precio)}</span>
          ${p.precio_original ? `<span class="product-original">${fmt(p.precio_original)}</span>` : ''}
          ${p.descuento ? `<span class="product-discount">${p.descuento}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

function getProduct(id) {
  return allProducts.find(p => p.id === id);
}

/* ─── MODAL ─────────────────────────────────────── */
function openModal(id) {
  const p = getProduct(id);
  if (!p) return;
  currentProduct = p;
  document.getElementById('modalBadge').textContent = p.categoria || '';
  document.getElementById('modalName').textContent = p.nombre;
  document.getElementById('modalPrice').textContent = fmt(p.precio);
  document.getElementById('modalOriginal').textContent = p.precio_original ? fmt(p.precio_original) : '';
  document.getElementById('modalDesc').textContent = p.descripcion || '';
  const img = document.getElementById('modalImg');
  if (p.imagen_url) {
    img.innerHTML = `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover" />`;
  } else {
    img.style.background = COLORS[id % COLORS.length];
    img.style.height = '400px';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.innerHTML = `<span style="color:rgba(255,255,255,.3);font-size:.7rem;letter-spacing:.1em;font-family:var(--font-sans)">${p.categoria || ''}</span>`;
  }
  // Talles dinámicos
  const sizesEl = document.querySelector('.sizes');
  const talles = (p.talles || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (talles.length) {
    sizesEl.innerHTML = talles.map((t,i) =>
      `<button class="size-btn${i===0?' active':''}" onclick="selectSize(this)">${t}</button>`
    ).join('');
    document.querySelector('.size-picker').style.display = '';
  } else {
    document.querySelector('.size-picker').style.display = 'none';
  }

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

/* ─── CART ──────────────────────────────────────── */
function addToCart() {
  if (!currentProduct) return;
  const size = document.querySelector('.size-btn.active')?.textContent || 'S';
  addItemToCart(currentProduct, size);
  closeModal();
  openCart();
}

function quickAdd(id) {
  const p = getProduct(id);
  if (p) { addItemToCart(p, 'M'); openCart(); }
}

function addItemToCart(p, size) {
  const key = `${p.id}-${size}`;
  const existing = cart.find(i => i.key === key);
  if (existing) { existing.qty++; }
  else { cart.push({ key, ...p, size, qty: 1 }); }
  updateCartUI();
  showToast(`${p.nombre} agregado al carrito`);
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  document.querySelector('.cart-count').textContent = count;
  document.getElementById('cartTotal').textContent = fmt(total);
  const el = document.getElementById('cartItems');
  if (cart.length === 0) {
    el.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
  } else {
    el.innerHTML = cart.map((i, idx) => `
      <div style="display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #eee">
        <div style="width:64px;height:80px;background:${COLORS[idx % COLORS.length]};border-radius:2px;flex-shrink:0;overflow:hidden">
          ${i.imagen_url ? `<img src="${i.imagen_url}" style="width:100%;height:100%;object-fit:cover">` : ''}
        </div>
        <div style="flex:1">
          <div style="font-size:.8rem;font-weight:500;margin-bottom:4px">${i.nombre}</div>
          <div style="font-size:.72rem;color:#888;margin-bottom:8px">Talle: ${i.size}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:8px">
              <button onclick="changeQty('${i.key}',-1)" style="width:24px;height:24px;border:1px solid #ddd;border-radius:2px;font-size:.9rem;cursor:pointer">−</button>
              <span style="font-size:.85rem">${i.qty}</span>
              <button onclick="changeQty('${i.key}',1)" style="width:24px;height:24px;border:1px solid #ddd;border-radius:2px;font-size:.9rem;cursor:pointer">+</button>
            </div>
            <span style="font-size:.9rem;font-weight:600">${fmt(i.precio * i.qty)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function changeQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.key !== key);
  updateCartUI();
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelector('.cart-btn').addEventListener('click', openCart);

/* ─── TOAST ─────────────────────────────────────── */
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
    background:#111;color:#fff;padding:12px 24px;border-radius:2px;
    font-size:.8rem;letter-spacing:.05em;z-index:300;
    opacity:0;transition:.3s ease;white-space:nowrap;
    border-bottom:2px solid #c9a84c;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
}

/* ─── NEWSLETTER ────────────────────────────────── */
function subscribeNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  showToast('¡Gracias! Te avisaremos de todas las novedades.');
  input.value = '';
}

/* ─── COUNTDOWN ─────────────────────────────────── */
function updateCountdown() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('cd-h').textContent = pad(h);
  document.getElementById('cd-m').textContent = pad(m);
  document.getElementById('cd-s').textContent = pad(s);
}
setInterval(updateCountdown, 1000);
updateCountdown();

/* ─── HEADER SCROLL ─────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 40);
});

/* ─── MOBILE NAV ────────────────────────────────── */
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('mainNav').classList.toggle('open');
});

/* ─── SKELETON LOADERS ──────────────────────────── */
function showSkeletons(containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = Array(4).fill(`
    <div class="product-card" style="pointer-events:none">
      <div class="product-img">
        <div style="width:100%;height:100%;background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);background-size:200%;animation:shimmer 1.4s infinite"></div>
      </div>
      <div class="product-info">
        <div style="height:10px;background:#eee;border-radius:4px;width:60%;margin-bottom:8px;animation:shimmer 1.4s infinite"></div>
        <div style="height:14px;background:#eee;border-radius:4px;width:85%;margin-bottom:12px;animation:shimmer 1.4s infinite"></div>
        <div style="height:12px;background:#eee;border-radius:4px;width:40%;animation:shimmer 1.4s infinite"></div>
      </div>
    </div>
  `).join('');
}

/* Add shimmer keyframe */
const style = document.createElement('style');
style.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(style);

/* ─── CONSULTA WHATSAPP ─────────────────────────── */
function abrirConsulta() {
  if (!currentProduct) return;
  const p = currentProduct;

  // Cerrar modal producto primero
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = 'hidden';

  // Inyectar imagen/nombre del producto
  const prodEl = document.getElementById('consultaProducto');
  const COLORS_REF = COLORS;
  prodEl.innerHTML = `
    ${p.imagen_url
      ? `<img src="${p.imagen_url}" alt="${p.nombre}" class="consulta-prod-img" />`
      : `<div class="consulta-prod-placeholder" style="background:${COLORS_REF[p.id % COLORS_REF.length]}"><span>${p.categoria || ''}</span></div>`
    }
    <div class="consulta-prod-nombre">${p.nombre}</div>
    <div class="consulta-prod-precio">${fmt(p.precio)}</div>
    ${p.categoria ? `<div class="consulta-prod-badge">${p.categoria}</div>` : ''}
  `;

  // Poblar provincias
  const selProv = document.getElementById('cProvincia');
  if (selProv.options.length <= 1) {
    Object.keys(PROVINCIAS_ARG).sort().forEach(prov => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = prov;
      selProv.appendChild(opt);
    });
  }
  document.getElementById('cCiudad').innerHTML = '<option value="">Primero elegí provincia</option>';
  document.getElementById('cCiudad').disabled = true;

  document.getElementById('consultaOverlay').classList.add('active');
}

function cerrarConsulta() {
  document.getElementById('consultaOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function cargarCiudades() {
  const prov = document.getElementById('cProvincia').value;
  const selCiudad = document.getElementById('cCiudad');
  if (!prov || !PROVINCIAS_ARG[prov]) {
    selCiudad.innerHTML = '<option value="">Primero elegí provincia</option>';
    selCiudad.disabled = true;
    return;
  }
  selCiudad.disabled = false;
  selCiudad.innerHTML = '<option value="">Elegí tu ciudad...</option>' +
    PROVINCIAS_ARG[prov].map(c => `<option value="${c}">${c}</option>`).join('');
}

async function enviarConsulta(e) {
  e.preventDefault();
  const nombre   = document.getElementById('cNombre').value.trim();
  const telefono = document.getElementById('cTelefono').value.trim();
  const provincia= document.getElementById('cProvincia').value;
  const ciudad   = document.getElementById('cCiudad').value;
  const consulta = document.getElementById('cConsulta').value.trim();

  if (!nombre || !telefono || !provincia || !ciudad || !consulta) {
    alert('Por favor completá todos los campos obligatorios.');
    return;
  }

  const p = currentProduct;
  const seccionLabel = { nuevos:'Nuevo Ingreso', promociones:'Promoción', ofertas:'Oferta', liquidacion:'Liquidación' }[p?.seccion] || '';

  // Registrar consulta en Supabase (sin bloquear)
  fetch(`${SB_URL}/rest/v1/consultas`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      producto_id: p?.id || null,
      producto_nombre: p?.nombre || 'Consulta general',
      nombre, telefono, provincia, ciudad, consulta
    })
  }).catch(() => {});

  let msg = `🛍️ *CONSULTA — Vanesa Lopez Tienda*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *Producto:* ${p?.nombre || 'Consulta general'}\n`;
  if (p?.categoria) msg += `🏷️ *Categoría:* ${p.categoria}\n`;
  if (seccionLabel)  msg += `✨ *Sección:* ${seccionLabel}\n`;
  msg += `💰 *Precio:* ${fmt(p?.precio || 0)}\n`;
  if (p?.precio_original) msg += `💸 *Precio original:* ${fmt(p.precio_original)} (${p.descuento || ''})\n`;
  if (p?.imagen_url) msg += `🖼️ *Imagen:* ${p.imagen_url}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Nombre:* ${nombre}\n`;
  msg += `📱 *Teléfono:* ${telefono}\n`;
  msg += `📍 *Ubicación:* ${ciudad}, ${provincia}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💬 *Consulta:* ${consulta}`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarConsulta();
  document.getElementById('consultaForm').reset();
  showToast('¡Redirigiendo a WhatsApp! 💬');
}

/* ─── INIT ──────────────────────────────────────── */
async function init() {
  ['nuevosGrid','promocionesGrid','ofertasGrid','liquidacionGrid'].forEach(showSkeletons);

  allProducts = await fetchProducts();

  const secciones = {
    nuevos:      'nuevosGrid',
    promociones: 'promocionesGrid',
    ofertas:     'ofertasGrid',
    liquidacion: 'liquidacionGrid',
  };

  for (const [sec, gridId] of Object.entries(secciones)) {
    renderProducts(allProducts.filter(p => p.seccion === sec), gridId);
  }
}

init();
