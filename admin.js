/**
 * admin.js — Admin Panel Controller
 * Firebase Auth login, full Firestore CRUD for products/categories/orders/settings.
 * Image upload to Firebase Storage.
 */

import {
  initFirebase, signIn, signOut, onAuthState,
  fetchCollection, fetchDoc, setDoc, addDoc, updateDoc, deleteDoc, uploadFile
} from './firebase.js';

/* ════════════════════════════════
   // ===== EDIT HERE: Firebase Config =====
   FIREBASE CONFIG
   ════════════════════════════════ */
const FIREBASE_CONFIG = window.__FIREBASE_CONFIG__ || {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};



/* ════════════════════════════════
   STATE
════════════════════════════════ */
let _currentUser  = null;
let _products     = [];
let _categories   = [];
let _orders       = [];
let _settings     = {};
let _editingProduct  = null; // id of product being edited
let _editingCategory = null;

/* ════════════════════════════════
   BOOTSTRAP
════════════════════════════════ */

async function init() {
  await initFirebase(FIREBASE_CONFIG);

  onAuthState(user => {
    _currentUser = user;
    if (user) {
      showAdminUI();
      loadAll();
    } else {
      showLoginUI();
    }
  });

  _bindLoginForm();
  _bindLogout();
  _bindNav();
  _bindProductForm();
  _bindCategoryForm();
  _bindSettingsForm();
  _bindOrderFilters();
  _bindImageUploads();
}

/* ════════════════════════════════
   AUTH UI
════════════════════════════════ */

function showLoginUI() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-app').classList.add('hidden');
}
function showAdminUI() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  const nameEl = document.getElementById('admin-user-name');
  if (nameEl) nameEl.textContent = _currentUser?.email || 'Admin';
}

function _bindLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('click', async e => {
    if (!e.target.matches('#login-btn')) return;
    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const errEl    = document.getElementById('login-error');
    if (!email || !password) { if (errEl) errEl.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = '...جاري الدخول';

    // Support demo mode bypass if Firebase Config is placeholder or if credentials match admin@luxury.com / admin123
    const isFirebaseConfigured = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';
    if (!isFirebaseConfigured || (email === 'admin@luxury.com' && password === 'admin123')) {
      setTimeout(async () => {
        adminToast('دخول تجريبي ناجح ✓');
        _currentUser = { email: email || 'admin@luxury.com' };
        showAdminUI();
        await loadAll();
        btn.disabled = false; btn.textContent = 'دخول';
      }, 600);
      return;
    }

    try {
      await signIn(email, password);
    } catch (err) {
      if (errEl) errEl.textContent = _authErrorMsg(err.code);
      btn.disabled = false; btn.textContent = 'دخول';
    }
  });
}

function _bindLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut();
  });
}

function _authErrorMsg(code) {
  const map = {
    'auth/user-not-found':  'البريد الإلكتروني غير مسجل',
    'auth/wrong-password':  'كلمة المرور غير صحيحة',
    'auth/invalid-email':   'البريد الإلكتروني غير صالح',
    'auth/too-many-requests': 'محاولات كثيرة. حاول لاحقاً',
  };
  return map[code] || 'خطأ في تسجيل الدخول';
}

/* ════════════════════════════════
   NAVIGATION
════════════════════════════════ */

function _bindNav() {
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const tab = link.dataset.tab;
      _switchTab(tab);
    });
  });
}

function _switchTab(tab) {
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.toggle('active', l.dataset.tab === tab));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('hidden', t.dataset.tab !== tab));
}

/* ════════════════════════════════
   LOAD ALL DATA
════════════════════════════════ */

async function loadAll() {
  showGlobalLoading(true);
  try {
    [_products, _categories, _orders, _settings] = await Promise.all([
      fetchCollection('products'),
      fetchCollection('categories'),
      fetchCollection('orders'),
      fetchDoc('settings', 'store').then(s => s || {}),
    ]);



    _renderStats();
    _renderProductsTable();
    _renderCategoriesTable();
    _renderOrdersTable();
    _renderSettingsForm();
  } catch (err) {
    console.error('[Admin] loadAll failed:', err);
    adminToast('فشل تحميل البيانات', 'error');
  }
  showGlobalLoading(false);
}

function showGlobalLoading(on) {
  document.getElementById('admin-loader')?.classList.toggle('hidden', !on);
}

/* ════════════════════════════════
   DASHBOARD STATS
════════════════════════════════ */

function _renderStats() {
  setAdminText('stat-products',  _products.length);
  setAdminText('stat-categories', _categories.length);
  setAdminText('stat-orders',    _orders.length);

  const revenue = _orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  setAdminText('stat-revenue', revenue.toLocaleString('ar-EG') + ' EGP');

  _renderLatestOrders();
}

function _renderLatestOrders() {
  const el = document.getElementById('latest-orders-list');
  if (!el) return;
  const latest = [..._orders]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  if (!latest.length) { el.innerHTML = '<p class="admin-empty">لا توجد طلبات بعد</p>'; return; }

  el.innerHTML = latest.map(o => `
    <div class="order-row">
      <div class="order-row-info">
        <span class="order-row-name">${o.customerName || '—'}</span>
        <span class="order-row-phone">${o.phone || ''}</span>
      </div>
      <span class="order-status status-${o.status || 'pending'}">${_statusLabel(o.status)}</span>
      <span class="order-row-total">${(o.total || 0).toLocaleString?.() || o.total} EGP</span>
    </div>
  `).join('');
}

/* ════════════════════════════════
   PRODUCTS TABLE
════════════════════════════════ */

function _renderProductsTable(filter = '') {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  const filtered = filter
    ? _products.filter(p => p.name.toLowerCase().includes(filter) || (p.brand || '').toLowerCase().includes(filter))
    : _products;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-empty">لا توجد منتجات</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr data-id="${p.id}">
      <td><img src="${p.imageUrl || ''}" alt="" class="admin-product-thumb" onerror="this.src=''" /></td>
      <td class="td-name">
        <strong>${p.name}</strong>
        <span class="td-brand">${p.brand || ''}</span>
      </td>
      <td>${p.category || '—'}</td>
      <td class="td-price">${Number(p.price).toLocaleString('ar-EG')} EGP</td>
      <td>${p.discount ? p.discount + '%' : '—'}</td>
      <td>
        <span class="product-visibility ${p.hidden ? 'vis-hidden' : 'vis-visible'}">
          ${p.hidden ? 'مخفي' : 'ظاهر'}
        </span>
      </td>
      <td class="td-actions">
        <button class="admin-btn-sm btn-edit"   data-id="${p.id}">تعديل</button>
        <button class="admin-btn-sm btn-dup"    data-id="${p.id}">نسخ</button>
        <button class="admin-btn-sm btn-toggle" data-id="${p.id}" data-hidden="${!!p.hidden}">
          ${p.hidden ? 'إظهار' : 'إخفاء'}
        </button>
        <button class="admin-btn-sm btn-delete" data-id="${p.id}">حذف</button>
      </td>
    </tr>
  `).join('');

  /* Event delegation */
  tbody.onclick = async e => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-edit'))   _openProductForm(id);
    if (btn.classList.contains('btn-dup'))    _duplicateProduct(id);
    if (btn.classList.contains('btn-toggle')) _toggleProductVisibility(id, btn.dataset.hidden === 'true');
    if (btn.classList.contains('btn-delete')) _deleteProduct(id);
  };
}

/* Product search */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('product-search')?.addEventListener('input', e => {
    _renderProductsTable(e.target.value.toLowerCase().trim());
  });
});

/* ── Product Form ── */
function _openProductForm(id = null) {
  _editingProduct = id;
  const form = document.getElementById('product-form-panel');
  const title = document.getElementById('product-form-title');
  if (!form) return;

  if (id) {
    const p = _products.find(x => x.id === id);
    if (!p) return;
    title.textContent = 'تعديل المنتج';
    _fillProductForm(p);
  } else {
    title.textContent = 'إضافة منتج جديد';
    _clearProductForm();
  }
  form.classList.remove('hidden');
  _switchTab('products');
}

function _fillProductForm(p) {
  _setVal('pf-name',        p.name || '');
  _setVal('pf-brand',       p.brand || '');
  _setVal('pf-category',    p.category || '');
  _setVal('pf-price',       p.price || '');
  _setVal('pf-old-price',   p.oldPrice || '');
  _setVal('pf-discount',    p.discount || '');
  _setVal('pf-description', p.description || '');
  _setVal('pf-notes',       (p.notes || []).join(', '));
  _setVal('pf-rating',      p.rating || 5);
  _setVal('pf-stock',       p.stock ?? '');
  _setVal('pf-image-url',   p.imageUrl || '');
  const preview = document.getElementById('pf-image-preview');
  if (preview) preview.src = p.imageUrl || '';
}

function _clearProductForm() {
  ['pf-name','pf-brand','pf-category','pf-price','pf-old-price',
   'pf-discount','pf-description','pf-notes','pf-image-url'].forEach(id => _setVal(id, ''));
  _setVal('pf-rating', 5);
  _setVal('pf-stock', '');
  const preview = document.getElementById('pf-image-preview');
  if (preview) preview.src = '';
}

function _bindProductForm() {
  document.getElementById('pf-cancel')?.addEventListener('click', () => {
    document.getElementById('product-form-panel')?.classList.add('hidden');
    _editingProduct = null;
  });

  document.getElementById('pf-new-btn')?.addEventListener('click', () => _openProductForm(null));

  document.getElementById('pf-image-url')?.addEventListener('input', e => {
    const preview = document.getElementById('pf-image-preview');
    if (preview) preview.src = e.target.value;
  });

  document.getElementById('product-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('pf-save');
    btn.disabled = true; btn.textContent = '...جاري الحفظ';

    const data = {
      name:        _getVal('pf-name'),
      brand:       _getVal('pf-brand'),
      category:    _getVal('pf-category'),
      price:       Number(_getVal('pf-price')) || 0,
      oldPrice:    Number(_getVal('pf-old-price')) || null,
      discount:    Number(_getVal('pf-discount')) || null,
      description: _getVal('pf-description'),
      notes:       _getVal('pf-notes').split(',').map(n => n.trim()).filter(Boolean),
      rating:      Number(_getVal('pf-rating')) || 5,
      stock:       _getVal('pf-stock') !== '' ? Number(_getVal('pf-stock')) : null,
      imageUrl:    _getVal('pf-image-url'),
      hidden:      false,
    };

    let ok;
    if (_editingProduct) {
      ok = await updateDoc('products', _editingProduct, data);
    } else {
      const newId = await addDoc('products', data);
      ok = !!newId;
    }

    if (ok) {
      adminToast(_editingProduct ? 'تم تحديث المنتج ✓' : 'تم إضافة المنتج ✓');
      document.getElementById('product-form-panel')?.classList.add('hidden');
      await loadAll();
    } else {
      adminToast('فشل حفظ المنتج', 'error');
    }
    btn.disabled = false; btn.textContent = 'حفظ';
  });
}

async function _duplicateProduct(id) {
  const p = _products.find(x => x.id === id);
  if (!p) return;
  const { id: _, createdAt: __, updatedAt: ___, ...data } = p;
  data.name = data.name + ' (نسخة)';
  const newId = await addDoc('products', data);
  if (newId) { adminToast('تم نسخ المنتج ✓'); await loadAll(); }
}

async function _toggleProductVisibility(id, currentlyHidden) {
  await updateDoc('products', id, { hidden: !currentlyHidden });
  adminToast(currentlyHidden ? 'تم إظهار المنتج' : 'تم إخفاء المنتج');
  await loadAll();
}

async function _deleteProduct(id) {
  if (!confirm('هل تريد حذف هذا المنتج نهائياً؟')) return;
  await deleteDoc('products', id);
  adminToast('تم حذف المنتج');
  await loadAll();
}

/* ════════════════════════════════
   CATEGORIES TABLE
════════════════════════════════ */

function _renderCategoriesTable() {
  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return;

  if (!_categories.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="admin-empty">لا توجد فئات</td></tr>`;
    return;
  }

  tbody.innerHTML = _categories.map(c => `
    <tr data-id="${c.id}">
      <td><img src="${c.imageUrl || ''}" alt="" class="admin-product-thumb" onerror="this.src=''"/></td>
      <td>${c.name}</td>
      <td>${_products.filter(p => p.category === c.name).length} منتج</td>
      <td class="td-actions">
        <button class="admin-btn-sm btn-edit"   data-id="${c.id}">تعديل</button>
        <button class="admin-btn-sm btn-delete" data-id="${c.id}">حذف</button>
      </td>
    </tr>
  `).join('');

  tbody.onclick = async e => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-edit'))   _openCategoryForm(id);
    if (btn.classList.contains('btn-delete')) _deleteCategory(id);
  };
}

function _openCategoryForm(id = null) {
  _editingCategory = id;
  const panel = document.getElementById('category-form-panel');
  if (!panel) return;
  if (id) {
    const c = _categories.find(x => x.id === id);
    if (c) { _setVal('cf-name', c.name); _setVal('cf-image-url', c.imageUrl || ''); }
    document.getElementById('cf-form-title').textContent = 'تعديل الفئة';
  } else {
    _setVal('cf-name', ''); _setVal('cf-image-url', '');
    document.getElementById('cf-form-title').textContent = 'إضافة فئة';
  }
  panel.classList.remove('hidden');
}

function _bindCategoryForm() {
  document.getElementById('cf-new-btn')?.addEventListener('click', () => _openCategoryForm(null));
  document.getElementById('cf-cancel')?.addEventListener('click', () => {
    document.getElementById('category-form-panel')?.classList.add('hidden');
    _editingCategory = null;
  });
  document.getElementById('category-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { name: _getVal('cf-name'), imageUrl: _getVal('cf-image-url') };
    let ok;
    if (_editingCategory) { ok = await updateDoc('categories', _editingCategory, data); }
    else { ok = !!(await addDoc('categories', data)); }
    if (ok) {
      adminToast('تم حفظ الفئة ✓');
      document.getElementById('category-form-panel')?.classList.add('hidden');
      await loadAll();
    } else { adminToast('فشل حفظ الفئة', 'error'); }
  });
}

async function _deleteCategory(id) {
  if (!confirm('حذف هذه الفئة؟')) return;
  await deleteDoc('categories', id);
  adminToast('تم حذف الفئة');
  await loadAll();
}

/* ════════════════════════════════
   ORDERS TABLE
════════════════════════════════ */

function _renderOrdersTable(filter = 'all') {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const filtered = filter === 'all' ? _orders : _orders.filter(o => o.status === filter);
  const sorted   = [...filtered].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

  if (!sorted.length) { tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">لا توجد طلبات</td></tr>`; return; }

  tbody.innerHTML = sorted.map(o => `
    <tr data-id="${o.id}">
      <td>${o.customerName || '—'}</td>
      <td>${o.phone || '—'}</td>
      <td class="td-products">${o.productsText || '—'}</td>
      <td>${(o.total || 0).toLocaleString?.() || o.total} EGP</td>
      <td>
        <select class="status-select" data-id="${o.id}">
          ${['pending','confirmed','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${_statusLabel(s)}</option>`
          ).join('')}
        </select>
      </td>
      <td>${o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '—'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await updateDoc('orders', sel.dataset.id, { status: sel.value });
      const idx = _orders.findIndex(o => o.id === sel.dataset.id);
      if (idx !== -1) _orders[idx].status = sel.value;
      adminToast('تم تحديث حالة الطلب');
      _renderStats();
    });
  });
}

function _bindOrderFilters() {
  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _renderOrdersTable(btn.dataset.filter);
    });
  });
  document.getElementById('orders-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = q
      ? _orders.filter(o => (o.customerName||'').toLowerCase().includes(q) || (o.phone||'').includes(q))
      : _orders;
    _renderOrdersTableDirect(filtered);
  });
}

function _renderOrdersTableDirect(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  if (!orders.length) { tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">لا نتائج</td></tr>`; return; }
  // reuse full render with the filtered array temporarily
  const backup = _orders;
  // We manually render without reassigning _orders
  tbody.innerHTML = orders.map(o => `
    <tr><td>${o.customerName||'—'}</td><td>${o.phone||'—'}</td>
    <td>${o.productsText||'—'}</td><td>${o.total||0} EGP</td>
    <td><span class="order-status status-${o.status||'pending'}">${_statusLabel(o.status)}</span></td>
    <td>${o.createdAt ? new Date(o.createdAt.seconds*1000).toLocaleDateString('ar-EG') : '—'}</td></tr>
  `).join('');
}

function _statusLabel(s) {
  return { pending:'قيد الانتظار', confirmed:'مؤكد', delivered:'تم التسليم', cancelled:'ملغي' }[s] || s;
}

/* ════════════════════════════════
   SETTINGS FORM
════════════════════════════════ */

function _renderSettingsForm() {
  const fields = [
    'storeName','favicon','logoUrl','metaDesc',
    'heroBgUrl','heroSubtitle','heroTitle','heroDesc','heroCta',
    'offerBannerText','featuredLabel','featuredTitle',
    'categoriesLabel','categoriesTitle','whyTitle','testimonialsTitle',
    'why1Title','why1Desc','why2Title','why2Desc','why3Title','why3Desc',
    'footerDesc','footerPhone','footerEmail','footerAddress',
    'whatsappNumber','facebookUrl','instagramUrl',
    'deliveryFee','colorGold','colorDark','fontDisplay',
  ];
  fields.forEach(key => {
    const el = document.getElementById(`s-${key}`);
    if (el && _settings[key] !== undefined) el.value = _settings[key];
  });
}

function _bindSettingsForm() {
  document.getElementById('settings-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('settings-save');
    btn.disabled = true; btn.textContent = '...جاري الحفظ';

    const data = {};
    ['storeName','favicon','logoUrl','metaDesc',
     'heroBgUrl','heroSubtitle','heroTitle','heroDesc','heroCta',
     'offerBannerText','featuredLabel','featuredTitle',
     'categoriesLabel','categoriesTitle','whyTitle','testimonialsTitle',
     'why1Title','why1Desc','why2Title','why2Desc','why3Title','why3Desc',
     'footerDesc','footerPhone','footerEmail','footerAddress',
     'whatsappNumber','facebookUrl','instagramUrl',
     'deliveryFee','colorGold','colorDark','fontDisplay',
    ].forEach(key => {
      const el = document.getElementById(`s-${key}`);
      if (el) data[key] = el.value;
    });

    const ok = await setDoc('settings', 'store', data);
    adminToast(ok ? 'تم حفظ الإعدادات ✓' : 'فشل الحفظ', ok ? 'success' : 'error');
    btn.disabled = false; btn.textContent = 'حفظ الإعدادات';
    if (ok) _settings = { ..._settings, ...data };
  });
}

/* ════════════════════════════════
   IMAGE UPLOADS
════════════════════════════════ */

function _bindImageUploads() {
  /* Product image upload */
  document.getElementById('pf-image-upload')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const btn = document.getElementById('pf-upload-btn');
    const progress = document.getElementById('pf-upload-progress');
    if (btn) btn.disabled = true;

    const url = await uploadFile(`products/${Date.now()}_${file.name}`, file, pct => {
      if (progress) progress.textContent = Math.round(pct) + '%';
    });

    if (url) {
      _setVal('pf-image-url', url);
      const preview = document.getElementById('pf-image-preview');
      if (preview) preview.src = url;
      adminToast('تم رفع الصورة ✓');
    } else { adminToast('فشل رفع الصورة', 'error'); }

    if (btn) btn.disabled = false;
    if (progress) progress.textContent = '';
  });

  /* Logo upload */
  document.getElementById('s-logo-upload')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(`settings/logo_${Date.now()}`, file);
    if (url) { _setVal('s-logoUrl', url); adminToast('تم رفع الشعار ✓'); }
    else adminToast('فشل رفع الشعار', 'error');
  });

  /* Hero bg upload */
  document.getElementById('s-hero-upload')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(`settings/hero_${Date.now()}`, file);
    if (url) { _setVal('s-heroBgUrl', url); adminToast('تم رفع الصورة ✓'); }
    else adminToast('فشل رفع الصورة', 'error');
  });
}

/* ════════════════════════════════
   ADMIN TOAST
════════════════════════════════ */

let _adminToastTimer;
function adminToast(msg, type = 'success') {
  const el = document.getElementById('admin-toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = `admin-toast show toast-${type}`;
  clearTimeout(_adminToastTimer);
  _adminToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ════════════════════════════════
   DOM HELPERS
════════════════════════════════ */

function setAdminText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function _setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function _getVal(id) { return document.getElementById(id)?.value?.trim() || ''; }

/* ── Start ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
