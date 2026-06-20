/**
 * firebase.js — Database Layer
 * ─────────────────────────────────────────────────────────────────────────
 * يستخدم Firebase Realtime Database REST API لو الـ Config متملي،
 * أو يرجع لـ localStorage تلقائياً لو لا.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  ===== EDIT HERE: ضع بيانات Firebase هنا =====      ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * خطوات إنشاء Firebase Project:
 * 1. اذهب إلى https://console.firebase.google.com
 * 2. أنشئ project جديد
 * 3. فعّل "Realtime Database" واختر أي region
 * 4. في Rules اكتب: { "rules": { ".read": true, ".write": true } }  (للتجربة فقط)
 * 5. انسخ الـ databaseURL وضعه أدناه
 */
const FIREBASE_DB_URL =
  'YOUR_DATABASE_URL'; // مثال: https://my-store-default-rtdb.firebaseio.com

/* ─── هل Firebase مُفعَّل؟ ─────────────────────────────────────────────── */
const FIREBASE_ENABLED =
  FIREBASE_DB_URL &&
  FIREBASE_DB_URL !== 'YOUR_DATABASE_URL' &&
  FIREBASE_DB_URL.startsWith('https://');

/* ════════════════════════════════════════════════════════════════════════
   DEFAULT SEED DATA  (تظهر في أول تشغيل)
   ════════════════════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS = {
  storeName:         'Luxury Perfume',
  favicon:           '',
  logoUrl:           '',
  metaDesc:          'متجر عطور فاخرة - اكتشف أرقى العطور العربية والعالمية',
  heroBgUrl:         '',
  heroSubtitle:      'أرقى العطور الشرقية',
  heroTitle:         'اكتشف عالم <br/><span class="gold-text">الرفاهية</span>',
  heroDesc:          'عطور حصرية تحكي قصة الأناقة والفخامة',
  heroCta:           'تسوق الآن',
  offerBannerText:   'شحن مجاني للطلبات فوق 500 جنيه! 🎉',
  featuredLabel:     'مجموعتنا المميزة',
  featuredTitle:     'أبرز العطور',
  categoriesLabel:   'تصفح حسب',
  categoriesTitle:   'الفئات',
  whyTitle:          'لماذا تختارنا؟',
  testimonialsTitle: 'آراء عملائنا',
  why1Title: 'جودة أصيلة',   why1Desc: 'نقدم فقط عطورًا أصيلة 100% من أفضل دور العطور.',
  why2Title: 'توصيل سريع',   why2Desc: 'نوصل طلبك في أسرع وقت ممكن.',
  why3Title: 'دفع آمن',      why3Desc: 'طرق دفع متعددة وآمنة مع ضمان استرداد المبلغ.',
  footerDesc:    'متجرك المفضل لأرقى العطور.',
  footerPhone:   '+20 100 000 0000',
  footerEmail:   'support@luxury.com',
  footerAddress: 'القاهرة، مصر',
  whatsappNumber: '201000000000', // ===== EDIT HERE: رقم الواتساب بدون + =====
  facebookUrl:   '',
  instagramUrl:  '',
  deliveryFee:   '50',
  colorGold:     '#c9a84c',
  colorDark:     '#0a0a0a',
  fontDisplay:   'Playfair Display',
};

const DEFAULT_PRODUCTS = [
  { id:'p1', name:'Noir Élégance',  brand:'Maison Luxe',  price:250, oldPrice:312, discount:20, imageUrl:'https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'رجالي',   description:'عطر خشبي مسكي غني بالعنبر والعود.', notes:['العنبر','العود','المسك'] },
  { id:'p2', name:'Royal Oud',      brand:'Arabic Oud',   price:320, oldPrice:376, discount:15, imageUrl:'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'رجالي',   description:'عود ملكي أصيل من أجود الأخشاب.',   notes:['العود','الصندل','الزعفران'] },
  { id:'p3', name:'Velvet Rose',    brand:'Paris Femme',  price:180, imageUrl:'https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=800',                              rating:4, category:'نسائي',   description:'وردة مخملية حريرية بلمسة مسكية.',   notes:['الورد','البيونيا','المسك الأبيض'] },
  { id:'p4', name:'Dark Intense',   brand:'Black Label',  price:290, oldPrice:322, discount:10, imageUrl:'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'يونيسكس', description:'كثيف وحيوي، مزيج من التوابل والخشب.',notes:['الفلفل','البتشولي','الأرز'] },
  { id:'p5', name:'Gold Elixir',    brand:'Maison Luxe',  price:350, imageUrl:'https://images.pexels.com/photos/36834014/pexels-photo-36834014.jpeg?auto=compress&cs=tinysrgb&w=800',                          rating:5, category:'نسائي',   description:'إكسير ذهبي بعبق الياسمين والفانيلا.',notes:['الياسمين','الفانيلا','الهيليون'] },
  { id:'p6', name:'Arabian Nights', brand:'Arabic Oud',   price:420, oldPrice:560, discount:25, imageUrl:'https://images.pexels.com/photos/36834014/pexels-photo-36834014.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'يونيسكس', description:'رحلة في عطور ليالي الشرق الساحرة.', notes:['العود','الورد الطائفي','الكهرمان'] },
];

const DEFAULT_CATEGORIES = [
  { id:'c1', name:'رجالي',   imageUrl:'https://images.pexels.com/photos/3045999/pexels-photo-3045999.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id:'c2', name:'نسائي',   imageUrl:'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id:'c3', name:'يونيسكس', imageUrl:'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const DEFAULT_TESTIMONIALS = [
  { id:'t1', name:'أحمد السيد',    rating:5, text:'جودة رائعة وتوصيل سريع. سأعود للطلب مجددًا!' },
  { id:'t2', name:'منى العمري',    rating:5, text:'العطر تجاوز توقعاتي. يدوم طويلاً ورائحته مميزة.' },
  { id:'t3', name:'خالد الزهراني', rating:5, text:'خدمة عملاء ممتازة وتغليف فاخر. أنصح به بشدة.' },
];

/* ════════════════════════════════════════════════════════════════════════
   FIREBASE REST API HELPERS
   ════════════════════════════════════════════════════════════════════════ */

const FB = {
  /** GET collection from Realtime DB */
  async get(path) {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
    if (!res.ok) throw new Error(`Firebase GET failed: ${path}`);
    return res.json();
  },

  /** PUT — overwrite a node completely */
  async put(path, data) {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Firebase PUT failed: ${path}`);
    return res.json();
  },

  /** PATCH — merge/update fields */
  async patch(path, data) {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Firebase PATCH failed: ${path}`);
    return res.json();
  },

  /** POST — push new item (Firebase generates key) */
  async post(path, data) {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Firebase POST failed: ${path}`);
    const json = await res.json();
    return json.name; // Firebase push key
  },

  /** DELETE */
  async delete(path) {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, { method: 'DELETE' });
    return res.ok;
  },
};

/* ── Convert Firebase object { key: val } → Array [ { id: key, ...val } ] ── */
function _fbObjectToArray(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([id, val]) => ({ id, ...val }));
}

/* ════════════════════════════════════════════════════════════════════════
   LOCAL STORAGE FALLBACK HELPERS
   ════════════════════════════════════════════════════════════════════════ */

function _lsRead(key) {
  try { return JSON.parse(localStorage.getItem(`lp_db_${key}`)); } catch { return null; }
}

function _lsWrite(key, data) {
  const s = JSON.stringify(data);
  localStorage.setItem(`lp_db_${key}`, s);
  // Notify same-tab listeners (BroadcastChannel for cross-tab)
  try {
    _bc.postMessage({ key: `lp_db_${key}`, data });
  } catch {}
}

function _lsWriteSettings(data) {
  const s = JSON.stringify(data);
  localStorage.setItem('lp_db_settings_store', s);
  try { _bc.postMessage({ key: 'lp_db_settings_store', data }); } catch {}
}

/* ── BroadcastChannel for instant cross-tab sync (no Firebase needed) ── */
let _bc;
try {
  _bc = new BroadcastChannel('lp_sync');
} catch {
  _bc = { postMessage: () => {}, addEventListener: () => {} };
}

function _seedLocalDB() {
  if (!_lsRead('products'))     _lsWrite('products', DEFAULT_PRODUCTS);
  if (!_lsRead('categories'))   _lsWrite('categories', DEFAULT_CATEGORIES);
  if (!_lsRead('testimonials')) _lsWrite('testimonials', DEFAULT_TESTIMONIALS);
  if (!_lsRead('orders'))       _lsWrite('orders', []);
  if (!localStorage.getItem('lp_db_settings_store')) {
    _lsWriteSettings(DEFAULT_SETTINGS);
  }
}

/* ════════════════════════════════════════════════════════════════════════
   PUBLIC API  (نفس الـ interface بغض النظر عن Firebase أو localStorage)
   ════════════════════════════════════════════════════════════════════════ */

export async function initFirebase() {
  if (FIREBASE_ENABLED) {
    console.info('[DB] Firebase Realtime Database متصل ✓');
    // Seed Firebase with defaults only if collections are empty
    try {
      const existing = await FB.get('products');
      if (!existing) await FB.put('products', _arrayToFbObject(DEFAULT_PRODUCTS));
      const cats = await FB.get('categories');
      if (!cats) await FB.put('categories', _arrayToFbObject(DEFAULT_CATEGORIES));
      const tests = await FB.get('testimonials');
      if (!tests) await FB.put('testimonials', _arrayToFbObject(DEFAULT_TESTIMONIALS));
      const settings = await FB.get('settings/store');
      if (!settings) await FB.put('settings/store', DEFAULT_SETTINGS);
    } catch (e) {
      console.warn('[DB] Firebase seed failed, falling back to localStorage', e);
    }
  } else {
    console.info('[DB] وضع محلي (localStorage) — أضف FIREBASE_DB_URL لتفعيل الـ sync');
    _seedLocalDB();
  }
  return true;
}

function _arrayToFbObject(arr) {
  const obj = {};
  arr.forEach(item => { const { id, ...rest } = item; obj[id] = rest; });
  return obj;
}

/* ─── fetchCollection ───────────────────────────────────────────────────── */
export async function fetchCollection(name) {
  if (FIREBASE_ENABLED) {
    try {
      const data = await FB.get(name);
      return _fbObjectToArray(data);
    } catch (e) {
      console.warn(`[DB] Firebase fetchCollection(${name}) failed`, e);
    }
  }
  return _lsRead(name) || [];
}

/* ─── fetchDoc ──────────────────────────────────────────────────────────── */
export async function fetchDoc(col, id) {
  if (FIREBASE_ENABLED) {
    try {
      return await FB.get(`${col}/${id}`);
    } catch (e) {
      console.warn(`[DB] Firebase fetchDoc(${col}/${id}) failed`, e);
    }
  }
  if (col === 'settings' && id === 'store') {
    const s = localStorage.getItem('lp_db_settings_store');
    return s ? JSON.parse(s) : null;
  }
  const arr = _lsRead(col) || [];
  return arr.find(d => d.id === id) || null;
}

/* ─── setDoc ────────────────────────────────────────────────────────────── */
export async function setDoc(col, id, data) {
  if (FIREBASE_ENABLED) {
    try {
      await FB.put(`${col}/${id}`, { ...data, updatedAt: Date.now() });
      return true;
    } catch (e) {
      console.warn(`[DB] Firebase setDoc failed`, e);
    }
  }
  if (col === 'settings' && id === 'store') {
    _lsWriteSettings(data);
    return true;
  }
  const arr = _lsRead(col) || [];
  const idx = arr.findIndex(d => d.id === id);
  if (idx !== -1) arr[idx] = { ...arr[idx], ...data };
  else arr.push({ id, ...data });
  _lsWrite(col, arr);
  return true;
}

/* ─── addDoc ────────────────────────────────────────────────────────────── */
export async function addDoc(col, data) {
  if (FIREBASE_ENABLED) {
    try {
      const key = await FB.post(col, { ...data, createdAt: Date.now() });
      return key;
    } catch (e) {
      console.warn(`[DB] Firebase addDoc failed`, e);
    }
  }
  const arr = _lsRead(col) || [];
  const id = col[0] + '_' + Math.random().toString(36).substr(2, 9);
  arr.push({ id, ...data, createdAt: { seconds: Date.now() / 1000 } });
  _lsWrite(col, arr);
  return id;
}

/* ─── updateDoc ─────────────────────────────────────────────────────────── */
export async function updateDoc(col, id, data) {
  if (FIREBASE_ENABLED) {
    try {
      await FB.patch(`${col}/${id}`, { ...data, updatedAt: Date.now() });
      return true;
    } catch (e) {
      console.warn(`[DB] Firebase updateDoc failed`, e);
    }
  }
  const arr = _lsRead(col) || [];
  const idx = arr.findIndex(d => d.id === id);
  if (idx === -1) return false;
  arr[idx] = { ...arr[idx], ...data };
  _lsWrite(col, arr);
  return true;
}

/* ─── deleteDoc ─────────────────────────────────────────────────────────── */
export async function deleteDoc(col, id) {
  if (FIREBASE_ENABLED) {
    try {
      await FB.delete(`${col}/${id}`);
      return true;
    } catch (e) {
      console.warn(`[DB] Firebase deleteDoc failed`, e);
    }
  }
  let arr = _lsRead(col) || [];
  arr = arr.filter(d => d.id !== id);
  _lsWrite(col, arr);
  return true;
}

/* ─── uploadFile (Base64 — Firebase Storage requires SDK) ─────────────────
   الصور بتتحول لـ Base64 وتتحفظ جوه الـ record نفسه.
   لو عايز Firebase Storage حقيقي، ستحتاج الـ SDK.           ──────────── */
export async function uploadFile(path, file, onProgress = null) {
  return new Promise(resolve => {
    const reader = new FileReader();
    if (onProgress) onProgress(30);
    reader.onload = () => { if (onProgress) onProgress(100); resolve(reader.result); };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════════════════════════════════
   REAL-TIME POLLING  (للـ index.html — يحدّث المتجر تلقائياً)
   ════════════════════════════════════════════════════════════════════════ */

/**
 * يستمع لتغييرات Firebase كل 10 ثواني ويعيد البيانات.
 * في وضع localStorage: يستخدم BroadcastChannel للتحديث الفوري.
 * @returns {Function} دالة لإيقاف الـ polling
 */
export function listenToCollection(name, callback) {
  if (FIREBASE_ENABLED) {
    let lastSnapshot = null;
    const poll = async () => {
      try {
        const data = await FB.get(name);
        const snapshot = JSON.stringify(data);
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;
          callback(_fbObjectToArray(data));
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }

  // localStorage mode: use BroadcastChannel for instant sync
  const handler = (e) => {
    if (e.data?.key === `lp_db_${name}`) callback(e.data.data || []);
  };
  _bc.addEventListener('message', handler);
  return () => _bc.removeEventListener('message', handler);
}

export function listenToSettings(callback) {
  if (FIREBASE_ENABLED) {
    let lastSnapshot = null;
    const poll = async () => {
      try {
        const data = await FB.get('settings/store');
        const snapshot = JSON.stringify(data);
        if (snapshot !== lastSnapshot) { lastSnapshot = snapshot; callback(data); }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }

  const handler = (e) => {
    if (e.data?.key === 'lp_db_settings_store') callback(e.data.data);
  };
  _bc.addEventListener('message', handler);
  return () => _bc.removeEventListener('message', handler);
}

/* ════════════════════════════════════════════════════════════════════════
   AUTH (محلي دائماً — لوحة التحكم على جهازك فقط)
   ════════════════════════════════════════════════════════════════════════ */

let _authCb = null;

export async function signIn(email, password) {
  // ===== EDIT HERE: بيانات دخول لوحة التحكم =====
  if (email === 'admin@luxury.com' && password === 'admin123') {
    const user = { email };
    localStorage.setItem('lp_admin_user', JSON.stringify(user));
    _authCb?.(user);
    return user;
  }
  const err = new Error('auth/wrong-password');
  err.code = 'auth/wrong-password';
  throw err;
}

export async function signOut() {
  localStorage.removeItem('lp_admin_user');
  _authCb?.(null);
}

export async function onAuthState(callback) {
  _authCb = callback;
  const u = localStorage.getItem('lp_admin_user');
  setTimeout(() => callback(u ? JSON.parse(u) : null), 50);
}
