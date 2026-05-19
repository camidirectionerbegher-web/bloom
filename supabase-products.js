// supabase-products.js
// Functions to load/save/delete products in Supabase and provide a simple admin UI override.
// This file expects SUPABASE_URL and SUPABASE_KEY to be defined on the page (they are in index.html).

window.BLOOM_PRODUCTS = window.BLOOM_PRODUCTS || [];

async function loadProductsFromSupabase() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/bloom_products?is_deleted=eq.false&select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // Map columns to the format used by the page
    window.BLOOM_PRODUCTS = data.map(p => ({
      id: p.id,
      name: p.name,
      cat: p.category,
      price: p.price,
      priceOld: p.price_old,
      rating: p.rating,
      ratingCount: p.rating_count,
      img: p.img,
      badge: p.badge,
      desc: p.desc
    }));
    // Try to call existing render functions if available
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderCats === 'function') renderCats();
    if (typeof updateHeroStats === 'function') updateHeroStats();
    if (document.getElementById('admProdList')) renderAdminProducts();
  } catch (err) {
    console.error('loadProductsFromSupabase error:', err);
    if (typeof toast === 'function') toast('❌','Error cargando productos');
  }
}

async function saveProductToSupabase(product) {
  try {
    const payload = {
      id: product.id,
      name: product.name,
      category: product.cat,
      price: product.price,
      price_old: product.priceOld,
      rating: product.rating,
      rating_count: product.ratingCount,
      img: product.img,
      badge: product.badge,
      desc: product.desc,
      is_deleted: false
    };

    // Use upsert via on_conflict (PostgREST supports ?on_conflict=col)
    const url = `${SUPABASE_URL}/rest/v1/bloom_products?on_conflict=id`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify([payload])
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('saveProductToSupabase failed:', txt);
      if (typeof toast === 'function') toast('❌','Error guardando producto');
      return false;
    }

    const returned = await res.json();
    // returned is an array with the upserted row
    const row = Array.isArray(returned) && returned[0] ? returned[0] : null;
    // Update local cache
    const idx = window.BLOOM_PRODUCTS.findIndex(p => p.id === product.id);
    const localProd = Object.assign({}, product);
    if (idx === -1) window.BLOOM_PRODUCTS.unshift(localProd);
    else window.BLOOM_PRODUCTS[idx] = localProd;

    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderAdminProducts === 'function') renderAdminProducts();
    if (typeof toast === 'function') toast('✅','Producto guardado');
    return true;
  } catch (err) {
    console.error('saveProductToSupabase error:', err);
    if (typeof toast === 'function') toast('❌','Error guardando producto');
    return false;
  }
}

async function deleteProductFromSupabase(productId) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/bloom_products?id=eq.${productId}`;
    // Use PATCH to soft-delete
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ is_deleted: true })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('deleteProductFromSupabase failed:', txt);
      if (typeof toast === 'function') toast('❌','Error eliminando producto');
      return false;
    }
    // Remove locally
    window.BLOOM_PRODUCTS = window.BLOOM_PRODUCTS.filter(p => p.id !== productId);
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderAdminProducts === 'function') renderAdminProducts();
    if (typeof toast === 'function') toast('✅','Producto eliminado');
    return true;
  } catch (err) {
    console.error('deleteProductFromSupabase error:', err);
    if (typeof toast === 'function') toast('❌','Error eliminando producto');
    return false;
  }
}

// Admin UI helpers: these override (or provide) admin panel behavior without modifying large index.html
function renderAdminProducts() {
  const list = document.getElementById('admProdList');
  if (!list) return;
  if (!window.BLOOM_PRODUCTS || window.BLOOM_PRODUCTS.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--text3)">No hay productos</p>';
    return;
  }
  list.innerHTML = window.BLOOM_PRODUCTS.map(p => `
    <div class="prod-admin-item">
      <img src="${p.img}" alt="${p.name}" class="prod-admin-img" onerror="this.src='https://via.placeholder.com/52'">
      <div class="prod-admin-info">
        <div class="prod-admin-name">${p.name}</div>
        <div class="prod-admin-meta">$${p.price} · ${p.cat}</div>
      </div>
      <div class="prod-admin-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')">Editar</button>
        <button class="btn-del" onclick="confirmDeleteProduct('${p.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function confirmDeleteProduct(id) {
  if (confirm('¿Eliminar este producto?')) deleteProductFromSupabase(id);
}

function editProduct(id) {
  const p = window.BLOOM_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  // open admin modal and fill fields
  const adminModal = document.getElementById('adminModal');
  const adminBody = document.getElementById('adminBody');
  if (!adminModal || !adminBody) {
    alert('Admin modal no encontrado');
    return;
  }
  // Reuse openAdminPanel that we will render below if needed
  openAdminPanel();
  // Fill values (inputs created by openAdminPanel)
  setTimeout(() => {
    document.getElementById('adm_prod_id').value = p.id;
    document.getElementById('adm_prod_name').value = p.name;
    document.getElementById('adm_prod_cat').value = p.cat;
    document.getElementById('adm_prod_price').value = p.price;
    document.getElementById('adm_prod_price_old').value = p.priceOld || '';
    document.getElementById('adm_prod_rating').value = p.rating || '';
    document.getElementById('adm_prod_rating_count').value = p.ratingCount || '';
    document.getElementById('adm_prod_img').value = p.img || '';
    document.getElementById('adm_prod_badge').value = p.badge || '';
    document.getElementById('adm_prod_desc').value = p.desc || '';
    document.getElementById('adm_save_btn').dataset.editing = 'true';
    document.getElementById('adm_prod_id').disabled = true; // id not editable when editing
    document.getElementById('adm_save_btn').textContent = 'Actualizar producto';
  }, 120);
}

async function saveNewProductFromForm() {
  const idEl = document.getElementById('adm_prod_id');
  const id = (idEl && idEl.value || '').trim();
  const name = (document.getElementById('adm_prod_name').value || '').trim();
  const cat = (document.getElementById('adm_prod_cat').value || '').trim();
  const price = parseFloat(document.getElementById('adm_prod_price').value) || 0;
  const priceOld = parseFloat(document.getElementById('adm_prod_price_old').value) || null;
  const rating = parseFloat(document.getElementById('adm_prod_rating').value) || 0;
  const ratingCount = parseInt(document.getElementById('adm_prod_rating_count').value) || 0;
  const img = (document.getElementById('adm_prod_img').value || '').trim();
  const badge = (document.getElementById('adm_prod_badge').value || '').trim();
  const desc = (document.getElementById('adm_prod_desc').value || '').trim();

  if (!id || !name || !img) {
    if (typeof toast === 'function') toast('❌','Completa: ID, Nombre e Imagen');
    return;
  }

  const product = { id, name, cat, price, priceOld, rating, ratingCount, img, badge, desc };
  const ok = await saveProductToSupabase(product);
  if (ok) {
    // reset form
    document.getElementById('adm_prod_id').disabled = false;
    document.getElementById('adm_save_btn').dataset.editing = '';
    document.getElementById('adm_save_btn').textContent = 'Guardar en Supabase 🔒';
    document.getElementById('adm_prod_id').value = '';
    document.getElementById('adm_prod_name').value = '';
    document.getElementById('adm_prod_price').value = '';
    document.getElementById('adm_prod_price_old').value = '';
    document.getElementById('adm_prod_rating').value = '';
    document.getElementById('adm_prod_rating_count').value = '';
    document.getElementById('adm_prod_img').value = '';
    document.getElementById('adm_prod_badge').value = '';
    document.getElementById('adm_prod_desc').value = '';
  }
}

// Provide a lightweight admin panel rendering if openAdminPanel is called (overrides earlier definition if present)
function openAdminPanel() {
  const adminModal = document.getElementById('adminModal');
  const adminBody = document.getElementById('adminBody');
  if (!adminModal || !adminBody) return;
  adminBody.innerHTML = `
    <div class="admin-wrap">
      <div class="admin-form">
        <div class="admin-form-title">➕ Agregar / Editar Producto</div>
        <div class="fg"><label>ID Único</label><input type="text" id="adm_prod_id" placeholder="ej: prod-001"></div>
        <div class="fg"><label>Nombre</label><input type="text" id="adm_prod_name" placeholder="Nombre del producto"></div>
        <div class="form-row">
          <div class="fg"><label>Categoría</label><select id="adm_prod_cat"><option>Tecnología</option><option>Hogar</option><option>Accesorios</option><option>Deporte</option><option>Belleza</option></select></div>
          <div class="fg"><label>Precio</label><input type="number" id="adm_prod_price" placeholder="0.00"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Precio Anterior (opcional)</label><input type="number" id="adm_prod_price_old" placeholder="0.00"></div>
          <div class="fg"><label>Badge (new/hot/sale/top)</label><input type="text" id="adm_prod_badge" placeholder="ej: new"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Rating</label><input type="number" id="adm_prod_rating" placeholder="4.5" min="0" max="5" step="0.1"></div>
          <div class="fg"><label>Cantidad de Reviews</label><input type="number" id="adm_prod_rating_count" placeholder="0"></div>
        </div>
        <div class="fg"><label>URL de Imagen</label><input type="text" id="adm_prod_img" placeholder="https://..."></div>
        <div class="fg"><label>Descripción</label><textarea id="adm_prod_desc" placeholder="Descripción del producto" style="min-height:80px"></textarea></div>
        <button id="adm_save_btn" data-editing="" onclick="saveNewProductFromForm()" style="width:100%;padding:0.85rem;background:var(--green);color:#fff;border:none;border-radius:var(--radius-sm);font-weight:600;cursor:pointer">Guardar en Supabase 🔒</button>
      </div>

      <div class="admin-form">
        <div class="admin-form-title">📦 Productos Guardados</div>
        <div id="admProdList" class="prod-admin-list"></div>
      </div>

      <div class="admin-form">
        <div class="admin-form-title">📋 Órdenes Recientes</div>
        <div id="admOrdersList" class="admin-orders-list"></div>
      </div>
    </div>
  `;
  adminModal.classList.add('show');
  // render product list
  renderAdminProducts();
}

// Initialize on load
window.addEventListener('load', () => {
  // If page already has PRODUCTS variable, map into BLOOM_PRODUCTS
  try {
    if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length) {
      window.BLOOM_PRODUCTS = window.PRODUCTS.map(p => ({
        id: p.id || p.sku || ('p-'+Math.random().toString(36).slice(2,9)),
        name: p.name || p.title || 'Producto',
        cat: p.cat || p.category || 'Todos',
        price: p.price || p.p || 0,
        priceOld: p.priceOld || p.price_old || null,
        rating: p.rating || 0,
        ratingCount: p.ratingCount || 0,
        img: p.img || p.image || '',
        badge: p.badge || '',
        desc: p.desc || p.description || ''
      }));
    }
  } catch(e){/* ignore */}
  // Load remote products and merge/replace local
  loadProductsFromSupabase();
});
