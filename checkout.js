/**
 * checkout.js — Checkout Flow Module
 * Handles checkout panel open/close, form validation,
 * Firestore order save, and WhatsApp redirect.
 */

import { addDoc } from './firebase.js';
import { renderCheckoutSummary, getCartItems, getTotal, clearCart } from './cart.js';
import { showToast, closeSidePanel, openModal, closeModal, setTextById } from './ui.js';

/* ════════════════════════════════
   INIT
════════════════════════════════ */

export function initCheckout() {
  _bindCheckoutOpen();
  _bindCheckoutClose();
  _bindCheckoutSubmit();
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
    // ===== EDIT HERE: Delivery Fee =====
    const fee      = Number(settings.deliveryFee) || 0;
    const subtotal = getTotal();
    const total    = subtotal + (delivery === 'delivery' ? fee : 0);
    
    // ===== EDIT HERE: WhatsApp Number =====
    let rawNumber = (settings.whatsappNumber || '201000000000').trim().replace(/^\+|^00/, '');
    if (rawNumber.startsWith('0') && rawNumber.length > 1) {
      const isSaudi = settings.whatsappNumber.includes('966') || rawNumber.startsWith('05');
      const code = isSaudi ? '966' : '20';
      rawNumber = code + rawNumber.substring(1);
    }
    const waNumber = rawNumber.replace(/\D/g, '');

    /* Save to Firestore */
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

    /* Build WhatsApp message */
    const deliveryLine = delivery === 'pickup'
      ? '🏪 استلام من المحل'
      : `🚚 توصيل${fee > 0 ? ` (${fee.toLocaleString('ar-EG')} EGP)` : ' مجاني'}`;

    const lines = [
      '🛍️ *طلب جديد*',
      '',
      `👤 ${name}`,
      `📞 ${phone}`,
      `🏙️ ${city}`,
      `📍 ${address}`,
      '',
      '📦 *المنتجات:*',
      ...cartItems.map(i => `• ${i.name} × ${i.qty} = ${(i.price * i.qty).toLocaleString('ar-EG')} EGP`),
      '',
      deliveryLine,
      `💰 *الإجمالي: ${total.toLocaleString('ar-EG')} EGP*`,
      notes ? `📝 ملاحظات: ${notes}` : null,
    ].filter(l => l !== null).join('\n');

    const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(lines)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    /* Cleanup */
    clearCart();
    form.reset();

    document.getElementById('checkout-panel')?.classList.add('hidden');
    document.getElementById('checkout-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';

    /* Restore button */
    btn.disabled  = false;
    btn.innerHTML = '<i data-lucide="message-circle"></i> تأكيد الطلب عبر واتساب';
    if (window.lucide) lucide.createIcons();

    showToast('تم إرسال طلبك بنجاح! ✓');
  });
}
