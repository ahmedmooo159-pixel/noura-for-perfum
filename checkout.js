/**
 * checkout.js — Checkout Flow Module
 * Handles checkout panel open/close, form validation,
 * Firestore order save, and order tracking.
 */

import { addDoc, fetchCollection } from './firebase.js';
import { renderCheckoutSummary, getCartItems, getTotal, clearCart } from './cart.js';
import { showToast, closeSidePanel } from './ui.js';

/* ════════════════════════════════
   INIT
════════════════════════════════ */

export function initCheckout() {
  _bindCheckoutOpen();
  _bindCheckoutClose();
  _bindCheckoutSubmit();
  _bindTrackOrder();
}

/* ── Open checkout from cart ── */
function _bindCheckoutOpen() {
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (!getCartItems().length) {
      showToast('سلتك فارغة!', 'error');
      return;
    }
    closeSidePanel('cart');
    document.getElementById('checkout-panel')?.classList.remove('hidden');
    document.getElementById('checkout-overlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderCheckoutSummary();
  });
}

/* ── Close checkout ── */
function _bindCheckoutClose() {
  const close = () => {
    document.getElementById('checkout-panel')?.classList.add('hidden');
    document.getElementById('checkout-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  };

  document.getElementById('checkout-close')?.addEventListener('click', close);
  document.getElementById('checkout-overlay')?.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('checkout-panel');
      if (!panel?.classList.contains('hidden')) close();
    }
  });
}

/* ── Submit handler ── */
function _bindCheckoutSubmit() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('confirm-order-btn');
    if (!btn) return;

    const cartItems = getCartItems();
    if (!cartItems.length) {
      showToast('سلتك فارغة!', 'error');
      return;
    }

    /* Validate required fields */
    const required = ['cust-name', 'cust-phone', 'cust-city', 'cust-address'];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el?.value.trim()) {
        el?.focus();
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
      }
    }

    /* Disable button during processing */
    btn.disabled    = true;
    btn.textContent = '...جاري التأكيد';

    /* Collect form data */
    const name    = document.getElementById('cust-name')?.value.trim()    || '';
    const phone   = document.getElementById('cust-phone')?.value.trim()   || '';
    const city    = document.getElementById('cust-city')?.value.trim()    || '';
    const address = document.getElementById('cust-address')?.value.trim() || '';
    const notes   = document.getElementById('cust-notes')?.value.trim()   || '';
    const delivery = document.getElementById('delivery-type')?.value || 'delivery';

    const settings = window.__storeSettings || {};
    const fee      = Number(settings.deliveryFee) || 0;
    const subtotal = getTotal();
    const total    = subtotal + (delivery === 'delivery' ? fee : 0);

    /* Save to Firebase */
    await addDoc('orders', {
      customerName: name,
      phone,
      city,
      address,
      notes,
      deliveryType: delivery,
      products: cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      productsText: cartItems.map(i => `${i.name} x${i.qty}`).join(' | '),
      subtotal,
      deliveryFee: delivery === 'delivery' ? fee : 0,
      total,
      currency: 'EGP',
      status: 'pending',
    });

    /* Cleanup */
    clearCart();
    form.reset();

    document.getElementById('checkout-panel')?.classList.add('hidden');
    document.getElementById('checkout-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';

    /* Restore button */
    btn.disabled  = false;
    btn.innerHTML = '<i data-lucide="package-check"></i> تأكيد الطلب';
    if (window.lucide) lucide.createIcons();

    showToast('✓ تم استلام طلبك بنجاح! تابع طلبك برقم هاتفك');
  });
}

/* ════════════════════════════════
   ORDER TRACKING
════════════════════════════════ */

function _bindTrackOrder() {
  /* Open tracking panel */
  document.getElementById('track-order-btn')?.addEventListener('click', () => {
    document.getElementById('track-panel')?.classList.remove('hidden');
    document.getElementById('track-overlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // clear previous results
    document.getElementById('track-results')?.classList.add('hidden');
    document.getElementById('track-phone-input').value = '';
  });

  /* Close tracking panel */
  const closeTrack = () => {
    document.getElementById('track-panel')?.classList.add('hidden');
    document.getElementById('track-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  };
  document.getElementById('track-close')?.addEventListener('click', closeTrack);
  document.getElementById('track-overlay')?.addEventListener('click', closeTrack);

  /* Search orders by phone */
  document.getElementById('track-search-btn')?.addEventListener('click', _searchOrders);
  document.getElementById('track-phone-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _searchOrders();
  });
}

async function _searchOrders() {
  const phone = document.getElementById('track-phone-input')?.value.trim();
  if (!phone) {
    showToast('أدخل رقم هاتفك', 'error');
    return;
  }

  const btn = document.getElementById('track-search-btn');
  btn.disabled = true;
  btn.textContent = '...جاري البحث';

  try {
    const allOrders = await fetchCollection('orders');
    const myOrders  = allOrders.filter(o => o.phone === phone);

    const resultsEl = document.getElementById('track-results');
    const listEl    = document.getElementById('track-orders-list');

    if (!myOrders.length) {
      listEl.innerHTML = `
        <div class="track-empty">
          <i data-lucide="search-x" style="width:40px;height:40px;opacity:0.3;margin:0 auto 0.75rem;display:block"></i>
          <p>لا توجد طلبات بهذا الرقم</p>
        </div>`;
    } else {
      const sorted = [...myOrders].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      listEl.innerHTML = sorted.map(o => _orderTrackCard(o)).join('');
    }

    resultsEl?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('حدث خطأ، حاول مرة أخرى', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'بحث';
}

function _orderTrackCard(o) {
  const statusMap = {
    pending:   { label: 'قيد الانتظار', icon: 'clock',        color: '#f39c12' },
    confirmed: { label: 'تم التأكيد',   icon: 'check-circle', color: '#3498db' },
    delivered: { label: 'تم التسليم',   icon: 'package-check',color: '#2ecc71' },
    cancelled: { label: 'ملغي',         icon: 'x-circle',     color: '#e74c3c' },
  };
  const s   = statusMap[o.status] || statusMap.pending;
  const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '—';

  return `
    <div class="track-card glass-card">
      <div class="track-card-header">
        <div class="track-status" style="color:${s.color}">
          <i data-lucide="${s.icon}" style="width:18px;height:18px"></i>
          <span>${s.label}</span>
        </div>
        <span class="track-date">${date}</span>
      </div>
      <div class="track-products">${o.productsText || '—'}</div>
      <div class="track-total">الإجمالي: <strong>${(o.total||0).toLocaleString('ar-EG')} EGP</strong></div>
      ${o.deliveryType === 'pickup' ? '<div class="track-delivery">🏪 استلام من المحل</div>' : '<div class="track-delivery">🚚 توصيل للمنزل</div>'}
    </div>`;
}
