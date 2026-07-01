/* ─── CONFIG ────────────────────────────────────── */
const WA_NUMBER = '5492954589194'; // +54 9 2954 58-9194
const MP_ALIAS  = 'mpvanelopez';

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
let currentColor = null;
let allProducts = [];

/* ─── FETCH SUPABASE ────────────────────────────── */
async function fetchProducts() {
  try {
    // intenta traer con variantes embebidas
    const res = await fetch(
      `${SB_URL}/rest/v1/productos?activo=eq.true&select=*,producto_variantes(color,talle,stock)&order=orden.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (res.ok) return await res.json();
    // fallback sin variantes (antes de ejecutar setup-db-v4.sql)
    const res2 = await fetch(
      `${SB_URL}/rest/v1/productos?activo=eq.true&order=orden.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!res2.ok) throw new Error(await res2.text());
    return await res2.json();
  } catch (e) {
    console.error('Supabase error:', e);
    return [];
  }
}

function getVariantes(p) { return p.producto_variantes || []; }
function getColores(p)   { return [...new Set(getVariantes(p).map(v=>v.color))]; }
function getTallesForColor(p, color) {
  return getVariantes(p).filter(v=>v.color===color);
}
function getStock(p, color, talle) {
  const v = getVariantes(p).find(v=>v.color===color&&v.talle===talle);
  return v ? v.stock : null;
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
        <button class="share-btn" onclick="shareProduct(${p.id},event)" aria-label="Compartir" title="Compartir">
          <svg viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
        </button>
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
  const thumbs = document.getElementById('modalThumbs');
  const images = [p.imagen_url, p.imagen_url2, p.imagen_url3].filter(Boolean);
  if (images.length) {
    img.innerHTML = `<img src="${images[0]}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover" />`;
  } else {
    img.style.background = COLORS[id % COLORS.length];
    img.style.height = '400px';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.innerHTML = `<span style="color:rgba(255,255,255,.3);font-size:.7rem;letter-spacing:.1em;font-family:var(--font-sans)">${p.categoria || ''}</span>`;
  }
  if (images.length > 1) {
    thumbs.style.display = '';
    thumbs.innerHTML = images.map((src, i) =>
      `<img src="${src}" class="${i === 0 ? 'active' : ''}" onclick="selectModalImg('${src.replace(/'/g, "\\'")}', this)" />`
    ).join('');
  } else {
    thumbs.style.display = 'none';
    thumbs.innerHTML = '';
  }
  // Color picker desde variantes
  currentColor = null;
  const colores = getColores(p);
  const colorPicker = document.getElementById('modalColorPicker');
  const modalColors = document.getElementById('modalColors');
  if (colores.length) {
    modalColors.innerHTML = colores.map((c,i) =>
      `<button class="color-btn${i===0?' active':''}" onclick="selectColor(this,'${c.replace(/'/g,"\\'")}')"> ${c}</button>`
    ).join('');
    colorPicker.style.display = '';
    currentColor = colores[0];
    renderTallesForColor(p, colores[0]);
  } else {
    colorPicker.style.display = 'none';
    // fallback a talles del campo texto
    const talles = (p.talles||'').split(',').map(s=>s.trim()).filter(Boolean);
    const sp = document.getElementById('modalSizePicker');
    const se = document.getElementById('modalSizes');
    if (talles.length) {
      se.innerHTML = talles.map((t,i)=>`<button class="size-btn${i===0?' active':''}" onclick="selectSize(this)">${t}</button>`).join('');
      sp.style.display='';
    } else { sp.style.display='none'; }
  }

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function renderTallesForColor(p, color) {
  const varsForColor = getTallesForColor(p, color);
  const sp = document.getElementById('modalSizePicker');
  const se = document.getElementById('modalSizes');
  if (!varsForColor.length) { sp.style.display='none'; return; }
  sp.style.display='';
  se.innerHTML = varsForColor.map((v)=>{
    const noStock = v.stock === 0;
    const colorSafe = color.replace(/'/g,"\\'");
    const talleSafe = v.talle.replace(/'/g,"\\'");
    return `<button class="size-btn${noStock?' sin-stock':''}"
      onclick="${noStock?`abrirSinStock('${colorSafe}','${talleSafe}')`:`selectSize(this)`}"
      title="${noStock?'Sin stock':'Talle disponible'}">
      ${v.talle}${v.stock>0&&v.stock<=3?`<span style="font-size:.55rem;display:block;color:var(--gold)">¡Últimos!</span>`:''}
    </button>`;
  }).join('');
  const firstBtn = se.querySelector('.size-btn:not(.sin-stock)');
  firstBtn?.classList.add('active');
}

function selectColor(btn, color) {
  document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentColor = color;
  renderTallesForColor(currentProduct, color);
}

function selectModalImg(src, thumbEl) {
  const img = document.getElementById('modalImg').querySelector('img');
  if (img) img.src = src;
  document.querySelectorAll('.modal-thumbs img').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
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
  const sizeBtn = document.querySelector('#modalSizes .size-btn.active');
  const size = sizeBtn?.textContent?.trim().split('\n')[0].trim() || '';
  const color = currentColor || '';
  // verificar stock
  if (color && size) {
    const stock = getStock(currentProduct, color, size);
    if (stock !== null && stock === 0) { abrirSinStock(color, size); return; }
  }
  addItemToCart(currentProduct, size, color);
  closeModal();
  openCart();
}

function quickAdd(id) {
  const p = getProduct(id);
  if (!p) return;
  const colores = getColores(p);
  const color = colores[0] || '';
  const varForColor = color ? getTallesForColor(p, color) : [];
  const firstAvail = varForColor.find(v=>v.stock>0);
  const talle = firstAvail?.talle || (p.talles||'').split(',')[0]?.trim() || '';
  addItemToCart(p, talle, color);
  openCart();
}

function addItemToCart(p, size, color='') {
  const key = `${p.id}-${color}-${size}`;
  const existing = cart.find(i => i.key === key);
  if (existing) { existing.qty++; }
  else { cart.push({ key, producto_id: p.id, ...p, size, color, qty: 1 }); }
  updateCartUI();
  showToast(`${p.nombre} agregado al carrito`);
}

function updateCartUI() {
  const count  = cart.reduce((s, i) => s + i.qty, 0);
  const total  = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const pct    = getDescuento();
  const totalDesc = pct > 0 ? Math.round(total * (1 - pct/100)) : total;
  document.querySelector('.cart-count').textContent = count;
  const totalEl = document.getElementById('cartTotal');
  if (pct > 0 && currentClient) {
    totalEl.innerHTML = `<span style="text-decoration:line-through;color:#aaa;font-size:.8rem">${fmt(total)}</span> <span style="color:#16a34a">${fmt(totalDesc)}</span> <span style="background:#16a34a;color:#fff;border-radius:4px;font-size:.7rem;padding:1px 6px">${pct}% OFF</span>`;
  } else {
    totalEl.textContent = fmt(total);
  }
  const el = document.getElementById('cartItems');
  if (cart.length === 0) {
    el.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
  } else {
    el.innerHTML = cart.map((i, idx) => {
      const precioItem  = i.precio * i.qty;
      const precioDesc  = pct > 0 && currentClient ? Math.round(precioItem * (1-pct/100)) : precioItem;
      const precioHtml  = pct > 0 && currentClient
        ? `<span style="text-decoration:line-through;color:#aaa;font-size:.78rem">${fmt(precioItem)}</span> <span style="color:#16a34a;font-weight:600">${fmt(precioDesc)}</span>`
        : `<span style="font-size:.9rem;font-weight:600">${fmt(precioItem)}</span>`;
      return `
      <div style="display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #eee">
        <div style="width:64px;height:80px;background:${COLORS[idx % COLORS.length]};border-radius:2px;flex-shrink:0;overflow:hidden">
          ${i.imagen_url ? `<img src="${i.imagen_url}" style="width:100%;height:100%;object-fit:cover">` : ''}
        </div>
        <div style="flex:1">
          <div style="font-size:.8rem;font-weight:500;margin-bottom:2px">${i.nombre}</div>
          <div style="font-size:.72rem;color:#888;margin-bottom:8px">${i.color?`${i.color} — `:''}Talle ${i.size||'—'}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:8px">
              <button onclick="changeQty('${i.key}',-1)" style="width:24px;height:24px;border:1px solid #ddd;border-radius:2px;font-size:.9rem;cursor:pointer">−</button>
              <span style="font-size:.85rem">${i.qty}</span>
              <button onclick="changeQty('${i.key}',1)" style="width:24px;height:24px;border:1px solid #ddd;border-radius:2px;font-size:.9rem;cursor:pointer">+</button>
            </div>
            ${precioHtml}
          </div>
        </div>
      </div>`;
    }).join('');
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

/* ─── CHECKOUT ──────────────────────────────────── */
function abrirCheckout() {
  if (!cart.length) { showToast('Tu carrito está vacío'); return; }
  if (!currentClient) {
    window._pendingCheckout = true;
    document.getElementById('noRegistradoOverlay').classList.add('active');
    return;
  }
  _abrirCheckoutReal();
}
function _abrirCheckoutReal() {
  document.getElementById('checkoutOverlay').classList.add('active');
}

function cerrarCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
}

function copiarAlias() {
  navigator.clipboard?.writeText(MP_ALIAS);
  showToast('Alias copiado: ' + MP_ALIAS);
}

let _metodoPedido = '';

function finalizarConMetodo(metodo) {
  _metodoPedido = metodo;
  cerrarCheckout();
  abrirEntrega();
}

/* ─── ENTREGA ────────────────────────────────────── */
function abrirEntrega() {
  document.getElementById('entregaOverlay').classList.add('active');
}
function cerrarEntrega() {
  document.getElementById('entregaOverlay').classList.remove('active');
}
document.getElementById('entregaOverlay')?.addEventListener('click', e => {
  if (e.target===document.getElementById('entregaOverlay')) cerrarEntrega();
});

function elegirEntrega(tipo) {
  cerrarEntrega();
  abrirPedidoForm(tipo);
}

/* ─── PEDIDO FORM ────────────────────────────────── */
async function abrirPedidoForm(tipo) {
  document.getElementById('pTipoEntrega').value = tipo;
  document.getElementById('pMetodoPago').value = _metodoPedido;
  document.getElementById('pDireccionWrap').style.display = tipo==='envio' ? '' : 'none';
  if (tipo==='envio') document.getElementById('pDireccion').required = true;
  else document.getElementById('pDireccion').required = false;
  document.getElementById('pedidoFormTitulo').textContent = tipo==='retiro' ? 'Datos para el retiro' : 'Datos para el envío';
  document.getElementById('pedidoFormSub').textContent = tipo==='retiro'
    ? 'Completá tus datos y elegí cuándo venís a buscar tu pedido.'
    : 'Completá tus datos y elegí el horario en que estás en casa para recibir el envío. (+$3.000)';
  await loadHorariosStore();
  document.getElementById('pedidoFormOverlay').classList.add('active');
}
function cerrarPedidoForm() {
  document.getElementById('pedidoFormOverlay').classList.remove('active');
}
document.getElementById('pedidoFormOverlay')?.addEventListener('click', e => {
  if (e.target===document.getElementById('pedidoFormOverlay')) cerrarPedidoForm();
});
function toggleContactoLabel() {}

async function loadHorariosStore() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/horarios_local?activo=eq.true&order=dia.asc`,
      {headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`}});
    const horarios = await res.json();
    const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const sel = document.getElementById('pHorario');
    if (!horarios.length) {
      sel.innerHTML = '<option value="">A coordinar por WhatsApp</option>';
      document.getElementById('pHorarioInfo').textContent = '';
      return;
    }
    sel.innerHTML = '<option value="">Elegí un horario</option>' +
      horarios.flatMap(h => {
        const slots = [];
        let [hA,mA] = h.apertura.split(':').map(Number);
        const [hC] = h.cierre.split(':').map(Number);
        while (hA < hC) {
          slots.push(`${DIAS[h.dia]} ${String(hA).padStart(2,'0')}:${String(mA).padStart(2,'0')} hs`);
          hA++; mA=0;
        }
        return slots;
      }).map(s=>`<option value="${s}">${s}</option>`).join('');
    document.getElementById('pHorarioInfo').textContent = '* Horario sujeto a confirmación.';
  } catch(e) {
    document.getElementById('pHorario').innerHTML = '<option value="">A coordinar por WhatsApp</option>';
  }
}

async function submitPedido(e) {
  e.preventDefault();
  const tipo   = document.getElementById('pTipoEntrega').value;
  const metodo = document.getElementById('pMetodoPago').value;
  const nombre = document.getElementById('pNombreCliente').value.trim();
  const tipoC  = document.getElementById('pTipoContacto').value;
  const contacto = document.getElementById('pContactoCliente').value.trim();
  const horario= document.getElementById('pHorario').value;
  const dir    = document.getElementById('pDireccion').value.trim();
  const totalOriginal = cart.reduce((s,i)=>s+i.precio*i.qty,0);
  const pct    = getDescuento();
  const totalConDesc = pct > 0 ? Math.round(totalOriginal*(1-pct/100)) : totalOriginal;
  const envio  = tipo==='envio' ? 3000 : 0;
  const items  = cart.map(i=>({nombre:i.nombre,color:i.color||'',talle:i.size||'',cantidad:i.qty,precio:i.precio,producto_id:i.producto_id||null}));
  const detalle= cart.map(i=>`• ${i.nombre}${i.color?` (${i.color})`:''}${i.size?` talle ${i.size}`:''} x${i.qty} — ${fmt(i.precio*i.qty)}`).join('\n');

  // guardar pedido en Supabase
  try {
    await fetch(`${SB_URL}/rest/v1/pedidos`,{
      method:'POST',
      headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        items, total:totalConDesc+envio, metodo_pago:metodo, tipo_entrega:tipo,
        nombre, contacto, tipo_contacto:tipoC, horario, direccion:dir||null, costo_envio:envio,
        cliente_id: currentClient?.id || null,
        descuento_aplicado: pct,
        total_original: totalOriginal+envio
      })
    });
  } catch(err){ console.warn('Error guardando pedido',err); }

  // mensaje WhatsApp
  const metodoTxt = metodo==='mp' ? `Mercado Pago — alias *${MP_ALIAS}*` : 'Efectivo';
  const entregaTxt = tipo==='retiro' ? `🏪 Retiro en el local a las *${horario}*`
    : `🚚 Envío a domicilio a las *${horario}*${dir?` — ${dir}`:''} (+$3.000)`;
  let msg = `🛍️ *Pedido — Vanesa Lopez Tienda*\n\n${detalle}\n\n`;
  msg += `*Subtotal:* ${fmt(totalOriginal)}`;
  if (pct > 0 && currentClient) msg += `\n🎁 *Descuento ${pct}%:* −${fmt(totalOriginal - totalConDesc)}`;
  if (envio) msg += `\n🚚 *Envío:* ${fmt(envio)}`;
  msg += `\n*Total: ${fmt(totalConDesc+envio)}*\n💳 *Pago:* ${metodoTxt}\n${entregaTxt}\n`;
  msg += `\n👤 *Nombre:* ${nombre}\n📱 *Contacto:* ${contacto}`;
  if (currentClient) msg += `\n🌟 *Cliente registrado* — ${currentClient.nombre} ${currentClient.apellido}`;
  if (metodo==='mp') msg += `\n\nEnvío el comprobante de la transferencia.`;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`,'_blank');
  cerrarPedidoForm(); closeCart();
  cart=[]; updateCartUI();
  mostrarSuccess('¡Pedido confirmado!',
    tipo==='retiro'
      ? `Genial ${nombre}! Te esperamos en el local a las ${horario}. Te confirmamos por WhatsApp.`
      : `Genial ${nombre}! Te enviamos el pedido a las ${horario}. Te confirmamos por WhatsApp.`);
}

/* ─── MODAL ÉXITO ───────────────────────────────── */
function mostrarSuccess(titulo, mensaje) {
  document.getElementById('successTitle').textContent = titulo;
  document.getElementById('successMsg').textContent = mensaje;
  document.getElementById('successOverlay').classList.add('active');
}

function cerrarSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
}

document.getElementById('successOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('successOverlay')) cerrarSuccess();
});

/* ─── COMPARTIR PRODUCTO ────────────────────────── */
function shareProduct(id, ev) {
  if (ev) ev.stopPropagation();
  const p = getProduct(id);
  if (!p) return;
  const url = `${location.origin}${location.pathname}?producto=${id}`;
  const text = `Mirá esto en Vanesa Lopez Tienda: ${p.nombre} — ${fmt(p.precio)}`;
  if (navigator.share) {
    navigator.share({ title: p.nombre, text, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(`${text}\n${url}`);
    showToast('Link copiado para compartir');
  }
}

document.getElementById('checkoutOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('checkoutOverlay')) cerrarCheckout();
});

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

/* ─── SIN STOCK ──────────────────────────────────── */
function abrirSinStock(color, talle) {
  const p = currentProduct;
  document.getElementById('ssProductoId').value = p?.id || '';
  document.getElementById('ssColor').value = color;
  document.getElementById('ssTalle').value = talle;
  document.getElementById('sinStockMsg').textContent =
    `"${p?.nombre || 'Este producto'}" en color ${color}, talle ${talle} no está disponible ahora, pero ya le avisamos a Vanesa. Dejanos tu contacto y te avisamos cuando llegue.`;
  document.getElementById('sinStockForm').reset();
  document.getElementById('ssProductoId').value = p?.id || '';
  document.getElementById('ssColor').value = color;
  document.getElementById('ssTalle').value = talle;
  document.getElementById('sinStockOverlay').classList.add('active');
}
function cerrarSinStock() {
  document.getElementById('sinStockOverlay').classList.remove('active');
}
async function submitSolicitudStock(e) {
  e.preventDefault();
  const productoId = parseInt(document.getElementById('ssProductoId').value)||null;
  const color    = document.getElementById('ssColor').value;
  const talle    = document.getElementById('ssTalle').value;
  const nombre   = document.getElementById('ssNombre').value.trim();
  const tipo     = document.getElementById('ssTipo').value;
  const contacto = document.getElementById('ssContacto').value.trim();
  try {
    await fetch(`${SB_URL}/rest/v1/solicitudes_stock`, {
      method:'POST',
      headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({producto_id:productoId,producto_nombre:currentProduct?.nombre||'',
        color,talle,nombre,contacto,tipo_contacto:tipo})
    });
  } catch(err){ console.warn('Error guardando solicitud',err); }
  cerrarSinStock();
  mostrarSuccess('¡Anotado!',
    `Gracias ${nombre}! Cuando tengamos "${currentProduct?.nombre}" en ${color} talle ${talle} te avisamos por ${tipo==='whatsapp'?'WhatsApp':'email'}. 💛`);
}

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
  mostrarSuccess('¡Consulta enviada!', 'Gracias por escribirnos. Te vamos a responder por WhatsApp a la brevedad.');
}

/* ─── INIT ──────────────────────────────────────── */
/* ─── SISTEMA DE CLIENTES ───────────────────────── */
let currentClient = null;
let globalDescuentoPct = 10;

async function initClientSession() {
  // Cargar config de descuento
  try {
    const cfg = await fetch(`${SB_URL}/rest/v1/config_tienda?clave=eq.descuento_clientes_pct`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    const rows = await cfg.json();
    if (rows[0]) globalDescuentoPct = parseInt(rows[0].valor) || 10;
  } catch(e) {}

  // Restaurar sesión desde localStorage
  const tel = localStorage.getItem('vl_cliente_tel');
  if (tel) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/clientes?telefono=eq.${encodeURIComponent(tel)}&activo=eq.true`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
      const rows = await res.json();
      if (rows[0]) { currentClient = rows[0]; mostrarBarraCliente(); }
    } catch(e) {}
  }

  // Actualizar % en popup no-registrado
  document.querySelectorAll('#noRegDescPct,#noRegDescPct2').forEach(el => el.textContent = globalDescuentoPct);
}

function getDescuento() {
  if (!currentClient) return 0;
  return currentClient.descuento_pct != null ? currentClient.descuento_pct : globalDescuentoPct;
}

function aplicarDescuento(precio) {
  const pct = getDescuento();
  return pct > 0 ? Math.round(precio * (1 - pct / 100)) : precio;
}

function mostrarBarraCliente() {
  if (!currentClient) return;
  const bar  = document.getElementById('clienteBar');
  const msg  = document.getElementById('clienteBarMsg');
  const desc = document.getElementById('clienteBarDesc');
  const pct  = getDescuento();
  msg.textContent  = `✦ Hola, ${currentClient.nombre}! Gracias por seguir eligiendo nuestra tienda. 💛`;
  desc.textContent = pct > 0 ? `${pct}% OFF aplicado` : '';
  if (bar) { bar.style.display = 'flex'; }
  const btn = document.getElementById('miCuentaBtn');
  if (btn) btn.style.color = 'var(--gold)';
  updateCartUI();
}

function logoutCliente() {
  currentClient = null;
  localStorage.removeItem('vl_cliente_tel');
  const bar = document.getElementById('clienteBar');
  if (bar) bar.style.display = 'none';
  const btn = document.getElementById('miCuentaBtn');
  if (btn) btn.style.color = '';
  updateCartUI();
  showToast('Sesión cerrada');
}

// ── Login ──
function abrirLoginCliente() {
  document.getElementById('loginClienteOverlay').classList.add('active');
  switchToLogin();
}
function cerrarLoginCliente() {
  document.getElementById('loginClienteOverlay').classList.remove('active');
}
function switchToLogin()   { document.getElementById('loginForm').style.display=''; document.getElementById('registroForm').style.display='none'; }
function switchToRegistro(){ document.getElementById('loginForm').style.display='none'; document.getElementById('registroForm').style.display=''; }

async function loginCliente() {
  const tel = document.getElementById('loginTelefono').value.trim();
  if (!tel) { showToast('Ingresá tu número'); return; }
  try {
    const res = await fetch(`${SB_URL}/rest/v1/clientes?telefono=eq.${encodeURIComponent(tel)}&activo=eq.true`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    const rows = await res.json();
    if (!rows[0]) { showToast('No encontramos una cuenta con ese teléfono. ¿Querés registrarte?'); switchToRegistro(); return; }
    currentClient = rows[0];
    localStorage.setItem('vl_cliente_tel', tel);
    cerrarLoginCliente();
    cerrarNoRegistrado();
    mostrarBarraCliente();
    showToast(`Bienvenida, ${currentClient.nombre}! 💛`);
    // Si había un checkout pendiente, continuarlo
    if (window._pendingCheckout) { window._pendingCheckout = false; abrirCheckout(); }
  } catch(e) { showToast('Error al ingresar. Intentá de nuevo.'); }
}

// ── Registro ──
async function registrarCliente(e) {
  e.preventDefault();
  const btn = document.getElementById('regSubmitBtn');
  btn.textContent = 'Registrando...'; btn.disabled = true;
  const data = {
    nombre:    document.getElementById('regNombre').value.trim(),
    apellido:  document.getElementById('regApellido').value.trim(),
    telefono:  document.getElementById('regTelefono').value.trim(),
    mail:      document.getElementById('regMail').value.trim(),
    provincia: document.getElementById('regProvincia').value.trim(),
    ciudad:    document.getElementById('regCiudad').value.trim(),
    direccion: document.getElementById('regDireccion').value.trim(),
    acepta_notif: document.getElementById('regNotif').checked,
  };
  try {
    const res = await fetch(`${SB_URL}/rest/v1/clientes`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.code === '23505') { showToast('Ya existe una cuenta con ese teléfono. Ingresá.'); switchToLogin(); }
      else showToast('Error al registrarse: ' + (err.message || 'Intentá de nuevo'));
      return;
    }
    const rows = await res.json();
    currentClient = rows[0] || { ...data };
    localStorage.setItem('vl_cliente_tel', data.telefono);
    cerrarLoginCliente();
    cerrarNoRegistrado();
    mostrarBarraCliente();
    mostrarSuccess('¡Bienvenida! 🎉', `Hola ${data.nombre}! Tu cuenta fue creada. Ahora tenés un ${getDescuento()}% de descuento en todos tus pedidos. ¡Disfrutá tu compra!`);
    if (window._pendingCheckout) { window._pendingCheckout = false; setTimeout(() => abrirCheckout(), 1800); }
  } catch(e) { showToast('Error al registrarse. Intentá de nuevo.'); }
  finally { btn.textContent = 'Registrarme y obtener descuento'; btn.disabled = false; }
}

// ── Popup no registrado ──
function cerrarNoRegistrado() { document.getElementById('noRegistradoOverlay').classList.remove('active'); }
function abrirRegistroDesdePopup() { cerrarNoRegistrado(); abrirLoginCliente(); switchToRegistro(); }
function abrirLoginDesdePopup()    { cerrarNoRegistrado(); abrirLoginCliente(); switchToLogin(); }
function continuarSinDescuento()   { cerrarNoRegistrado(); _abrirCheckoutReal(); }

/* ─── FILTROS CATÁLOGO ──────────────────────────── */
function getFilterChecked(filterName) {
  return [...document.querySelectorAll(`[data-filter="${filterName}"]:checked`)].map(cb => cb.value);
}

function toggleFilterSection(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector('.fs-arrow');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function abrirFiltros() {
  document.getElementById('filterSidebar').classList.add('open');
  document.getElementById('filterOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function cerrarFiltros() {
  document.getElementById('filterSidebar')?.classList.remove('open');
  document.getElementById('filterOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

function limpiarFiltros() {
  const busq = document.getElementById('filterBusqueda');
  if (busq) busq.value = '';
  document.querySelectorAll('[data-filter]:checked').forEach(cb => cb.checked = false);
  const cat = document.getElementById('filterCategoria');
  if (cat) cat.value = '';
  const pMin = document.getElementById('filterPrecioMin');
  if (pMin) pMin.value = '';
  const pMax = document.getElementById('filterPrecioMax');
  if (pMax) pMax.value = '';
  const nov = document.getElementById('filterNovedades');
  if (nov) nov.checked = false;
  const of = document.getElementById('filterOfertas');
  if (of) of.checked = false;
  renderCatalog();
}

function buildFilterOptions(products) {
  const colores = [...new Set(products.flatMap(p => getColores(p)))].filter(Boolean).sort();
  const talles  = [...new Set(products.flatMap(p => {
    const vTalles = getVariantes(p).map(v => v.talle);
    const tText   = (p.talles || '').split(',').map(t => t.trim()).filter(Boolean);
    return [...vTalles, ...tText];
  }))].filter(Boolean).sort((a,b) => {
    const num = (s) => parseFloat(s);
    if (!isNaN(num(a)) && !isNaN(num(b))) return num(a) - num(b);
    return a.localeCompare(b, 'es');
  });

  const colWrap = document.getElementById('filterColoresWrap');
  if (colWrap) colWrap.innerHTML = colores.length
    ? colores.map(c => `<label class="filter-check"><input type="checkbox" data-filter="color" value="${c}" onchange="renderCatalog()" /> ${c}</label>`).join('')
    : '<span class="filter-empty-hint">Sin colores cargados</span>';

  const talWrap = document.getElementById('filterTallesWrap');
  if (talWrap) talWrap.innerHTML = talles.length
    ? talles.map(t => `<label class="filter-check"><input type="checkbox" data-filter="talle" value="${t}" onchange="renderCatalog()" /> ${t}</label>`).join('')
    : '<span class="filter-empty-hint">Sin talles cargados</span>';
}

function renderFilterChips(state) {
  const chips = document.getElementById('filterChips');
  if (!chips) return;
  const items = [
    ...(state.busqueda ? [{ label: `"${state.busqueda}"`, key: 'busqueda' }] : []),
    ...state.generos.map(g   => ({ label: g, key: 'genero', val: g })),
    ...(state.categoria ? [{ label: state.categoria, key: 'categoria' }] : []),
    ...state.talles.map(t    => ({ label: `Talle ${t}`, key: 'talle', val: t })),
    ...state.colores.map(c   => ({ label: c, key: 'color', val: c })),
    ...(state.precioMin > 0  ? [{ label: `Desde ${fmt(state.precioMin)}`, key: 'precioMin' }] : []),
    ...(state.precioMax > 0  ? [{ label: `Hasta ${fmt(state.precioMax)}`, key: 'precioMax' }] : []),
    ...state.temporadas.map(t=> ({ label: t, key: 'temporada', val: t })),
    ...state.estilos.map(t   => ({ label: t, key: 'estilo', val: t })),
    ...state.ocasiones.map(t => ({ label: t, key: 'ocasion', val: t })),
    ...(state.novedades ? [{ label: '✨ Novedades', key: 'novedades' }] : []),
    ...(state.ofertas   ? [{ label: '🔥 Ofertas', key: 'ofertas' }] : []),
  ];
  window._chipClears = items.map(item => () => {
    if (item.key === 'busqueda')   { document.getElementById('filterBusqueda').value=''; }
    else if (item.key === 'categoria') { document.getElementById('filterCategoria').value=''; }
    else if (item.key === 'precioMin') { document.getElementById('filterPrecioMin').value=''; }
    else if (item.key === 'precioMax') { document.getElementById('filterPrecioMax').value=''; }
    else if (item.key === 'novedades') { document.getElementById('filterNovedades').checked=false; }
    else if (item.key === 'ofertas')   { document.getElementById('filterOfertas').checked=false; }
    else {
      const el = document.querySelector(`[data-filter="${item.key}"][value="${item.val}"]`);
      if (el) el.checked = false;
    }
    renderCatalog();
  });
  chips.innerHTML = items.map((item, i) =>
    `<span class="filter-chip">${item.label}<button onclick="filterChipClear(${i})" aria-label="Quitar">✕</button></span>`
  ).join('');
}

function filterChipClear(i) {
  if (window._chipClears && window._chipClears[i]) window._chipClears[i]();
}

function renderCatalog() {
  const busqueda  = document.getElementById('filterBusqueda')?.value?.toLowerCase().trim() || '';
  const generos   = getFilterChecked('genero');
  const categoria = document.getElementById('filterCategoria')?.value || '';
  const talles    = getFilterChecked('talle');
  const colores   = getFilterChecked('color');
  const precioMin = parseFloat(document.getElementById('filterPrecioMin')?.value) || 0;
  const precioMax = parseFloat(document.getElementById('filterPrecioMax')?.value) || 0;
  const temporadas= getFilterChecked('temporada');
  const estilos   = getFilterChecked('estilo');
  const ocasiones = getFilterChecked('ocasion');
  const novedades = document.getElementById('filterNovedades')?.checked || false;
  const ofertas   = document.getElementById('filterOfertas')?.checked || false;
  const sort      = document.getElementById('catalogoSort')?.value || '';

  let filtered = allProducts.filter(p => {
    if (busqueda && !p.nombre?.toLowerCase().includes(busqueda) && !p.descripcion?.toLowerCase().includes(busqueda) && !p.categoria?.toLowerCase().includes(busqueda)) return false;
    if (generos.length && !generos.includes(p.genero)) return false;
    if (categoria && p.categoria !== categoria) return false;
    if (talles.length) {
      const pv = getVariantes(p).map(v => v.talle);
      const pt = (p.talles || '').split(',').map(t => t.trim());
      if (!talles.some(t => pv.includes(t) || pt.includes(t))) return false;
    }
    if (colores.length) {
      if (!colores.some(c => getColores(p).includes(c))) return false;
    }
    if (precioMin > 0 && p.precio < precioMin) return false;
    if (precioMax > 0 && p.precio > precioMax) return false;
    if (temporadas.length && !temporadas.includes(p.temporada)) return false;
    if (estilos.length && !estilos.includes(p.estilo)) return false;
    if (ocasiones.length && !ocasiones.includes(p.ocasion)) return false;
    if (novedades && !p.es_novedad) return false;
    if (ofertas && !p.es_oferta) return false;
    return true;
  });

  if (sort === 'precio_asc')  filtered.sort((a,b) => a.precio - b.precio);
  else if (sort === 'precio_desc') filtered.sort((a,b) => b.precio - a.precio);
  else if (sort === 'nombre_az')  filtered.sort((a,b) => (a.nombre||'').localeCompare(b.nombre||'','es'));
  else if (sort === 'nombre_za')  filtered.sort((a,b) => (b.nombre||'').localeCompare(a.nombre||'','es'));
  else filtered.sort((a,b) => (a.orden||999) - (b.orden||999));

  renderProducts(filtered, 'catalogoGrid');

  const countEl = document.getElementById('catalogoCount');
  if (countEl) countEl.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

  const state = { busqueda, generos, categoria, talles, colores, precioMin, precioMax, temporadas, estilos, ocasiones, novedades, ofertas };
  renderFilterChips(state);

  const activeCount = [busqueda, ...generos, categoria, ...talles, ...colores,
    precioMin > 0 ? 'min' : '', precioMax > 0 ? 'max' : '',
    ...temporadas, ...estilos, ...ocasiones,
    novedades ? 'nov' : '', ofertas ? 'of' : ''].filter(Boolean).length;
  const badge = document.getElementById('filterCountBadge');
  if (badge) { badge.textContent = activeCount; badge.style.display = activeCount ? '' : 'none'; }
}

/* ─── INIT ──────────────────────────────────────── */
async function init() {
  ['catalogoGrid','nuevosGrid','promocionesGrid','ofertasGrid','liquidacionGrid'].forEach(showSkeletons);

  await initClientSession();
  allProducts = await fetchProducts();

  buildFilterOptions(allProducts);
  renderCatalog();

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
