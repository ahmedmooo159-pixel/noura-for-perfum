/**
 * firebase.js — LocalStorage database & simulation layer
 * Replaces Firebase SDK completely.
 * Runs 100% locally and offline.
 */

/* ════════════════════════════════
   DEFAULT INITIAL DATA SEEDS
   ════════════════════════════════ */
const DEFAULT_SETTINGS = {
  storeName:         'Luxury Perfume',
  favicon:           '', // Blank logo so user can upload their own favicon
  logoUrl:           '', // Blank logo so user can upload their own logo
  metaDesc:          'متجر عطور فاخرة - اكتشف أرقى العطور العربية والعالمية',
  heroBgUrl:         '', // Blank background so user can upload their own hero banner
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
  why1Title:         'جودة أصيلة',
  why1Desc:          'نقدم فقط عطورًا أصيلة 100% من أفضل دور العطور العالمية.',
  why2Title:         'توصيل سريع',
  why2Desc:          'نوصل طلبك في أسرع وقت ممكن لجميع أنحاء المملكة.',
  why3Title:         'دفع آمن',
  why3Desc:          'طرق دفع متعددة وآمنة مع ضمان استرداد الأموال.',
  footerDesc:        'متجرك المفضل لأرقى العطور العربية والعالمية.',
  footerPhone:       '+966 500 000 000',
  footerEmail:       'support@luxuryperfume.com',
  footerAddress:     'الرياض، المملكة العربية السعودية',
  whatsappNumber:    '966500000000',
  facebookUrl:       'https://facebook.com',
  instagramUrl:      'https://instagram.com',
  deliveryFee:       '50',
  colorGold:         '#c9a84c',
  colorDark:         '#0a0a0a',
  fontDisplay:       'Playfair Display',
};

const DEFAULT_PRODUCTS = [
  { id:'p1', name:'Noir Élégance',  brand:'Maison Luxe',  price:250, oldPrice:312, discount:20, imageUrl:'https://images.pexels.com/photos/3059609/pexels-photo-3059609.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'رجالي',   description:'عطر خشبي مسكي غني بالعنبر والعود.', notes:['العنبر','العود','المسك'] },
  { id:'p2', name:'Royal Oud',      brand:'Arabic Oud',   price:320, oldPrice:376, discount:15, imageUrl:'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'رجالي',   description:'عود ملكي أصيل من أجود الأخشاب.',   notes:['العود','الصندل','الزعفران'] },
  { id:'p3', name:'Velvet Rose',    brand:'Paris Femme',  price:180, imageUrl:'https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=800',                              rating:4, category:'نسائي',   description:'وردة مخملية حريرية بلمسة مسكية.',   notes:['الورد','البيونيا','المسك الأبيض'] },
  { id:'p4', name:'Dark Intense',   brand:'Black Label',  price:290, oldPrice:322, discount:10, imageUrl:'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg?auto=compress&cs=tinysrgb&w=800', rating:5, category:'يونيسكس', description:'كثيف وحيوي، مزيج من التوابل والخشب.',notes:['الفلفل','البتشولي','الأرز'] },
  { id:'p5', name:'Gold Elixir',    brand:'Maison Luxe',  price:350, imageUrl:'https://images.pexels.com/photos/36834014/pexels-photo-36834014.jpeg?auto=compress&cs=tinysrgb&w=800',                          rating:5, category:'نسائي',   description:'إكسير ذهبي بعبق الياسمين والفانيلا.',notes:['الياسمين','الفانيلا','الهيليون'] },
  { id:'p6', name:'Arabian Nights', brand:'Arabic Oud',   price:420, oldPrice:560, discount:25, imageUrl:'https://images.pexels.com/photos/36834014/pexels-photo-36834014.jpeg?auto=compress&cs=tinysrgb&w=800',rating:5, category:'يونيسكس', description:'رحلة في عطور ليالي الشرق الساحرة.', notes:['العود','الورد الطائفي','الكهرمان'] },
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

const DEFAULT_ORDERS = [
  { id: 'o_1', customerName: 'أحمد علي', phone: '0501234567', productsText: 'Royal Oud x2 | Gold Elixir x1', total: 990, status: 'pending', createdAt: { seconds: Date.now()/1000 - 3600 } },
  { id: 'o_2', customerName: 'سارة خالد', phone: '0567890123', productsText: 'Velvet Rose x1', total: 180, status: 'confirmed', createdAt: { seconds: Date.now()/1000 - 7200 } }
];

/* ── Local database helpers ── */
function _read(key) {
  try {
    const val = localStorage.getItem(`lp_db_${key}`);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function _write(key, data) {
  localStorage.setItem(`lp_db_${key}`, JSON.stringify(data));
}

/* ── Seed local DB if empty ── */
function _seedDatabase() {
  if (!_read('products'))     _write('products', DEFAULT_PRODUCTS);
  if (!_read('categories'))   _write('categories', DEFAULT_CATEGORIES);
  if (!_read('testimonials')) _write('testimonials', DEFAULT_TESTIMONIALS);
  if (!_read('orders'))       _write('orders', DEFAULT_ORDERS);
  if (!localStorage.getItem('lp_db_settings_store')) {
    localStorage.setItem('lp_db_settings_store', JSON.stringify(DEFAULT_SETTINGS));
  }
}

/* ════════════════════════════════
   DATABASE SIMULATION METHODS
   ════════════════════════════════ */

export async function initFirebase(config) {
  _seedDatabase();
  document.dispatchEvent(new Event('firebase-ready'));
  return { db: true, storage: true, auth: true };
}

export async function fetchCollection(name, queryFn = null) {
  const data = _read(name) || [];
  return data;
}

export async function fetchDoc(col, id) {
  if (col === 'settings' && id === 'store') {
    const settings = localStorage.getItem('lp_db_settings_store');
    return settings ? JSON.parse(settings) : null;
  }
  const collection = _read(col) || [];
  return collection.find(doc => doc.id === id) || null;
}

export async function setDoc(col, id, data) {
  if (col === 'settings' && id === 'store') {
    localStorage.setItem('lp_db_settings_store', JSON.stringify(data));
    return true;
  }
  const collection = _read(col) || [];
  const idx = collection.findIndex(doc => doc.id === id);
  if (idx !== -1) {
    collection[idx] = { ...collection[idx], ...data, updatedAt: { seconds: Date.now()/1000 } };
  } else {
    collection.push({ id, ...data, createdAt: { seconds: Date.now()/1000 } });
  }
  _write(col, collection);
  return true;
}

export async function addDoc(col, data) {
  const collection = _read(col) || [];
  const newId = col[0] + '_' + Math.random().toString(36).substr(2, 9);
  const newDoc = { id: newId, ...data, createdAt: { seconds: Date.now()/1000 } };
  collection.push(newDoc);
  _write(col, collection);
  return newId;
}

export async function updateDoc(col, id, data) {
  const collection = _read(col) || [];
  const idx = collection.findIndex(doc => doc.id === id);
  if (idx === -1) return false;
  collection[idx] = { ...collection[idx], ...data, updatedAt: { seconds: Date.now()/1000 } };
  _write(col, collection);
  return true;
}

export async function deleteDoc(col, id) {
  let collection = _read(col) || [];
  collection = collection.filter(doc => doc.id !== id);
  _write(col, collection);
  return true;
}

/* ════════════════════════════════
   STORAGE: FILE UPLOAD TO BASE64
   ════════════════════════════════ */
export async function uploadFile(path, file, onProgress = null) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    // Simulate upload progress
    if (onProgress) onProgress(20);
    
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result); // Returns base64 Data URL
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════
   AUTH SIMULATION METHODS
   ════════════════════════════════ */

let _authCallback = null;

export async function signIn(email, password) {
  if (email === 'admin@luxury.com' && password === 'admin123') {
    const mockUser = { email };
    localStorage.setItem('lp_admin_user', JSON.stringify(mockUser));
    _authCallback?.(mockUser);
    return mockUser;
  } else {
    const err = new Error('auth/wrong-password');
    err.code = 'auth/wrong-password';
    throw err;
  }
}

export async function signOut() {
  localStorage.removeItem('lp_admin_user');
  _authCallback?.(null);
}

export async function onAuthState(callback) {
  _authCallback = callback;
  const user = localStorage.getItem('lp_admin_user');
  setTimeout(() => {
    callback(user ? JSON.parse(user) : null);
  }, 100);
  return () => { _authCallback = null; };
}

export async function onSnapshot(col, callback) {
  const collection = _read(col) || [];
  callback(collection);
  // Listen for storage change events to support reactive updates across tabs
  const handler = (e) => {
    if (e.key === `lp_db_${col}`) {
      callback(e.newValue ? JSON.parse(e.newValue) : []);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
