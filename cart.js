/**
 * cart.js — Shopping Cart & Wishlist Module
 * Manages cart state, wishlist, localStorage persistence, and panel rendering.
 */

const CART_KEY     = 'lp_cart';
const WISHLIST_KEY = 'lp_wishlist';

/* ── State ── */
let cart     = _loadCart();
let wishlist = _loadWishlist();

/* ── Storage helpers ── */
function _loadCart()     { try { return JSON.parse(localStorage.getItem(CART_KEY))     || []; } catch { return []; } }
function _saveCart()     { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function _loadWishlist() { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch { return []; } }
function _saveWishlist() { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }

// ===== EDIT HERE: Currency =====
/* ── Currency format ── */
function fmt(n) { return Number(n).toLocaleString('ar-EG'); }

/* ════════════════════════════════
   CART OPERATIONS
════════════════════════════════ */

/** Add item or increment qty */
export function addToCart(item) {
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  _saveCart();
  renderCart();
  return [...cart];
}

/** Remove item entirely */
export function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  _saveCart();
  renderCart();
}

/** Adjust quantity; removes item if qty reaches 0 */
export function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  _saveCart();
  renderCart();
}

/** Clear entire cart */
export function clearCart() {
  cart = [];
  _saveCart();
  renderCart();
}

/** Cart subtotal */
export function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

/** Total item count */
export function getTotalQty() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

/** Snapshot of cart items */
export function getCartItems() { return [...cart]; }

/* ════════════════════════════════
   WISHLIST OPERATIONS
════════════════════════════════ */

export function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) wishlist.push(id);
  else wishlist.splice(idx, 1);
  _saveWishlist();
  return wishlist.includes(id);
}

export function isInWishlist(id) { return wishlist.includes(id); }

/* ════════════════════════════════
   CART RENDER
════════════════════════════════ */

export function renderCart() {
  const listEl   = document.getElementById('cart-items');
  const emptyEl  = document.getElementById('cart-empty-msg');
  const footerEl = document.getElementById('cart-footer');
  const countEl  = document.getElementById('cart-count');
  const totalEl  = document.getElementById('cart-total');
  if (!listEl) return;

  const qty = getTotalQty();

  /* Badge */
  if (countEl) {
    countEl.textContent = qty;
    countEl.classList.toggle('hidden', qty === 0);
  }

  /* Empty state */
  if (cart.length === 0) {
    listEl.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    footerEl?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  footerEl?.classList.remove('hidden');

  /* Items */
  listEl.innerHTML = cart.map(item => `
    <li class="cart-item" data-id="${item.id}">
      <img class="cart-item-img" src="${item.img || ''}" alt="${item.name}" loading="lazy" onerror="this.src=''" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${fmt(item.price * item.qty)} EGP</p>
        <div class="qty-controls">
          <button class="qty-btn" data-id="${item.id}" data-action="dec" aria-label="تقليل">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="inc" aria-label="زيادة">+</button>
        </div>
      </div>
      <button class="remove-btn icon-btn" data-id="${item.id}" aria-label="حذف من السلة">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </li>
  `).join('');

  /* Total */
  if (totalEl) totalEl.textContent = fmt(getTotal()) + ' EGP';

  /* Delivery note */
  const deliveryRow = document.getElementById('delivery-note-row');
  const settings = window.__storeSettings || {};
  if (deliveryRow) {
    const fee = Number(settings.deliveryFee);
    if (!isNaN(fee)) {
      deliveryRow.textContent = fee === 0
        ? 'الشحن مجاني 🎉'
        : `رسوم التوصيل: ${fmt(fee)} EGP`;
    }
  }
}

/* ════════════════════════════════
   CHECKOUT SUMMARY RENDER
════════════════════════════════ */

/** Renders order summary inside #checkout-summary (fixed: no nested duplicate class) */
export function renderCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;

  const settings = window.__storeSettings || {};
  const delivery = Number(settings.deliveryFee) || 0;
  const subtotal = getTotal();
  const total    = subtotal + delivery;

  const itemRows = cart.map(i => `
    <div class="summary-item">
      <span>${i.name} × ${i.qty}</span>
      <span>${fmt(i.price * i.qty)} EGP</span>
    </div>
  `).join('');

  const deliveryRow = delivery > 0 ? `
    <div class="summary-item">
      <span>التوصيل</span>
      <span>${fmt(delivery)} EGP</span>
    </div>
  ` : '<div class="summary-item"><span>الشحن</span><span class="text-gold">مجاني 🎉</span></div>';

  // FIX: was wrapping a .checkout-summary div inside #checkout-summary which already has the class
  el.innerHTML = `
    ${itemRows}
    ${deliveryRow}
    <div class="summary-total">
      <span>الإجمالي</span>
      <span class="total-price">${fmt(total)} EGP</span>
    </div>
  `;
}

/* ════════════════════════════════
   EVENT DELEGATION
════════════════════════════════ */

export function initCartEvents() {
  const listEl = document.getElementById('cart-items');
  if (!listEl) return;

  listEl.addEventListener('click', e => {
    const qtyBtn    = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.remove-btn');

    if (qtyBtn) {
      const { id, action } = qtyBtn.dataset;
      updateQty(id, action === 'inc' ? 1 : -1);
    } else if (removeBtn) {
      removeFromCart(removeBtn.dataset.id);
    }
  });
}
