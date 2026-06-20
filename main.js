/**
 * main.js — Store Bootstrapper
 * Initializes database, fetches data, applies settings, wires all modules.
 * All business logic lives in dedicated modules.
 */

import { initFirebase, fetchDoc, fetchCollection, listenToSettings, listenToCollection } from './firebase.js';
import { renderCart, initCartEvents }              from './cart.js';
import { initCheckout }                            from './checkout.js';
import { initSearch }                              from './search.js';
import {
  showToast, openSidePanel, closeSidePanel,
  initScrollEffects, initMobileMenu,
  observeFadeIns, setTextById, setHtmlById, setImgById,
  socialIconLink, SVG_ICONS,
} from './ui.js';
import {
  renderProducts, renderProductCards,
  renderCategories, renderTestimonials,
  initProductModal,
} from './products.js';

/* ════════════════════════════════
   // ===== EDIT HERE: Firebase Config =====
   FIREBASE CONFIG
   Not used in local mode but kept for reference
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
   APPLY STORE SETTINGS
   ════════════════════════════════ */

function applySettings(s) {
  if (!s) return;
  window.__storeSettings = s;

  /* Meta */
  if (s.storeName) {
    document.title = s.storeName;
    setTextById('header-brand',    s.storeName);
    setTextById('footer-brand',    s.storeName);
    setTextById('footer-copyright', `© ${new Date().getFullYear()} ${s.storeName}. جميع الحقوق محفوظة.`);
  }
  if (s.favicon) {
    const fav = document.getElementById('favicon');
    if (fav) fav.href = s.favicon;
  }
  if (s.logoUrl) {
    const logo = document.getElementById('header-logo');
    if (logo) { logo.src = s.logoUrl; logo.classList.remove('hidden'); }
  } else {
    document.getElementById('header-logo')?.classList.add('hidden');
  }
  if (s.metaDesc) {
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', s.metaDesc);
  }

  /* Hero */
  if (s.heroBgUrl) {
    const heroBgImg = document.getElementById('hero-bg-img');
    if (heroBgImg) {
      heroBgImg.src = s.heroBgUrl;
      heroBgImg.classList.remove('hidden');
    }
  } else {
    document.getElementById('hero-bg-img')?.classList.add('hidden');
  }
  if (s.heroSubtitle) setTextById('hero-subtitle', s.heroSubtitle);
  if (s.heroTitle)    setHtmlById('hero-title',    s.heroTitle);
  if (s.heroDesc)     setTextById('hero-desc',     s.heroDesc);
  if (s.heroCta)      setTextById('hero-cta',      s.heroCta);

  /* Offer banner */
  if (s.offerBannerText) {
    setTextById('offer-banner-text', s.offerBannerText);
    document.getElementById('offer-banner')?.classList.remove('hidden');
  } else {
    document.getElementById('offer-banner')?.classList.add('hidden');
  }

  /* Section labels */
  const labels = {
    featuredLabel:'featured-label', featuredTitle:'featured-title',
    categoriesLabel:'categories-label', categoriesTitle:'categories-title',
    whyTitle:'why-title', testimonialsTitle:'testimonials-title',
  };
  Object.entries(labels).forEach(([key, id]) => { if (s[key]) setTextById(id, s[key]); });

  /* Why cards */
  ['1','2','3'].forEach(n => {
    if (s[`why${n}Title`]) setTextById(`why-${n}-title`, s[`why${n}Title`]);
    if (s[`why${n}Desc`])  setTextById(`why-${n}-desc`,  s[`why${n}Desc`]);
  });

  /* Footer contact */
  ['footerDesc','footerPhone','footerEmail','footerAddress'].forEach(key => {
    const idMap = { footerDesc:'footer-desc', footerPhone:'footer-phone', footerEmail:'footer-email', footerAddress:'footer-address' };
    if (s[key]) setTextById(idMap[key], s[key]);
  });

  /* Social links */
  const socialEl = document.getElementById('social-links');
  if (socialEl) {
    let html = '';
    if (s.whatsappNumber) html += socialIconLink(`https://wa.me/${s.whatsappNumber.replace(/\D/g,'')}`, SVG_ICONS.whatsapp, 'واتساب');
    if (s.facebookUrl)    html += socialIconLink(s.facebookUrl,   SVG_ICONS.facebook,  'فيسبوك');
    if (s.instagramUrl)   html += socialIconLink(s.instagramUrl,  SVG_ICONS.instagram, 'انستجرام');
    socialEl.innerHTML = html;
  }

  /* Floating buttons */
  const waFloat = document.getElementById('whatsapp-float');
  const fbFloat = document.getElementById('facebook-float');
  if (waFloat && s.whatsappNumber) waFloat.href = `https://wa.me/${s.whatsappNumber.replace(/\D/g,'')}`;
  if (fbFloat) {
    if (s.facebookUrl) fbFloat.href = s.facebookUrl;
    else fbFloat.classList.add('hidden');
  }

  /* Theme overrides */
  const root = document.documentElement;
  if (s.colorGold) root.style.setProperty('--gold', s.colorGold);
  if (s.colorDark) root.style.setProperty('--dark', s.colorDark);
  if (s.fontDisplay) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(s.fontDisplay)}:wght@400;700&display=swap`;
    document.head.appendChild(link);
    root.style.setProperty('--font-display', `'${s.fontDisplay}', serif`);
  }
}

/* ════════════════════════════════
   CART PANEL WIRING
   ════════════════════════════════ */

function initCartPanel() {
  document.getElementById('cart-toggle')?.addEventListener('click',  () => openSidePanel('cart'));
  document.getElementById('cart-close')?.addEventListener('click',   () => closeSidePanel('cart'));
  document.getElementById('cart-overlay')?.addEventListener('click', () => closeSidePanel('cart'));
  initCartEvents();
}

/* ════════════════════════════════
   MAIN BOOTSTRAP
   ════════════════════════════════ */

async function init() {
  /* 1. UI scaffolding first — no waiting on network */
  initScrollEffects();
  initMobileMenu();
  initCartPanel();
  initProductModal();
  initCheckout();
  renderCart();
  observeFadeIns();
  if (window.lucide) lucide.createIcons();

  /* 2. Local Storage DB Init */
  await initFirebase(FIREBASE_CONFIG);

  /* 3. Fetch data from Local Storage (returns instantly) */
  let [settings, products, categories, testimonials] = await Promise.all([
    fetchDoc('settings', 'store'),
    fetchCollection('products'),
    fetchCollection('categories'),
    fetchCollection('testimonials'),
  ]);

  /* 4. Cache globally */
  window.__products   = products;
  window.__categories = categories;

  /* 5. Apply settings */
  if (settings) applySettings(settings);

  /* 6. Wire search */
  initSearch((filtered, query) => {
    renderProductCards(filtered, 'all', query);
  });

  /* 7. Render all sections */
  renderProducts(products);
  renderCategories(categories);
  renderTestimonials(testimonials);

  observeFadeIns();
  if (window.lucide) lucide.createIcons();

  /* 8. Dismiss Page Loader */
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('done');
    loader.setAttribute('aria-hidden', 'true');
  }

  /* 9. Start real-time sync */
  startRealTimeSync();
}

/* ── Start ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ── Real-time sync: يحدّث المتجر فور حفظ أي تغيير من لوحة التحكم ── */
function startRealTimeSync() {
  listenToSettings(settings => {
    if (settings) applySettings(settings);
  });

  listenToCollection('products', products => {
    if (products?.length) {
      window.__products = products;
      renderProducts(products);
      initSearch((filtered, query) => renderProductCards(filtered, 'all', query));
    }
  });

  listenToCollection('categories', categories => {
    if (categories?.length) {
      window.__categories = categories;
      renderCategories(categories);
    }
  });
}
