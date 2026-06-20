/**
 * products.js — Product Rendering & Product Modal
 * Handles product grid, category filters, categories section,
 * testimonials, and the product detail modal.
 */

import { addToCart, toggleWishlist, isInWishlist } from './cart.js';
import { showToast, renderStars, observeFadeIns, openModal, closeModal, setTextById, setImgById } from './ui.js';

/* ════════════════════════════════
   PRODUCT GRID
════════════════════════════════ */

/**
 * Initialize product grid with filter bar.
 * Only registers filter click listener once.
 */
export function renderProducts(products) {
  const filterBar = document.getElementById('category-filter-bar');
  if (!filterBar) { renderProductCards(products, 'all'); return; }

  /* Build unique category list */
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];

  /* Rebuild filter buttons */
  filterBar.innerHTML =
    `<button class="filter-btn active" data-cat="all">الكل</button>` +
    cats.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join('');

  /* Use event delegation — register only once by replacing the node */
  const newBar = filterBar.cloneNode(true);
  filterBar.replaceWith(newBar);

  newBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    newBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProductCards(products, btn.dataset.cat);
  });

  renderProductCards(products, 'all');
}

/**
 * Render filtered product cards into #products-grid.
 * @param {Object[]} products
 * @param {string} cat  - category name or 'all'
 * @param {string} [highlight] - search query for visual feedback
 */
export function renderProductCards(products, cat = 'all', highlight = '') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:4rem 1rem;color:var(--text-muted)">
        <i data-lucide="search-x" style="width:48px;height:48px;opacity:0.3;margin:0 auto 1rem;display:block"></i>
        <p>لا توجد منتجات مطابقة للبحث</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(p => _productCardHTML(p)).join('');

  observeFadeIns();
  _bindProductCardEvents(grid, products);
  if (window.lucide) lucide.createIcons();
}

function _productCardHTML(p) {
  const wishlisted    = isInWishlist(p.id);
  const discountBadge = p.discount
    ? `<span class="discount-badge" aria-label="خصم ${p.discount}%">-${p.discount}%</span>` : '';
  const oldPrice = p.oldPrice
    ? `<span class="price-old">${Number(p.oldPrice).toLocaleString('ar-EG')} EGP</span>` : '';

  return `
  <article class="product-card fade-in" data-id="${p.id}" role="button" tabindex="0"
           aria-label="عرض تفاصيل ${p.name}">
    <div class="product-card-img-wrap">
      <img class="product-card-img" src="${p.imageUrl || ''}" alt="${p.name}"
           loading="lazy" onerror="this.src=''" />
      ${discountBadge}
      <button class="wishlist-btn${wishlisted ? ' active' : ''}" data-id="${p.id}"
              aria-label="${wishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}"
              aria-pressed="${wishlisted}">
        <svg viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
    <div class="product-card-body">
      <p class="product-brand-label">${p.brand || ''}</p>
      <h3 class="product-card-name">${p.name}</h3>
      <div class="stars-row" aria-label="${p.rating || 5} من 5 نجوم">${renderStars(p.rating)}</div>
      <div class="card-footer">
        <div class="price-row">
          <span class="price-main">${Number(p.price).toLocaleString('ar-EG')} EGP</span>
          ${oldPrice}
        </div>
        <button class="add-to-cart-btn" data-id="${p.id}" aria-label="أضف ${p.name} إلى السلة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </button>
      </div>
    </div>
  </article>`;
}

function _bindProductCardEvents(grid, allProducts) {
  /* Add to cart */
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const product = (window.__products || allProducts).find(p => p.id === btn.dataset.id);
      if (!product) return;
      addToCart({ id: product.id, name: product.name, price: Number(product.price), img: product.imageUrl });
      showToast(`${product.name} أُضيف إلى السلة ✓`);
      /* Animate button */
      btn.classList.add('added');
      setTimeout(() => btn.classList.remove('added'), 600);
    });
  });

  /* Wishlist toggle */
  grid.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const active = toggleWishlist(btn.dataset.id);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active);
      btn.setAttribute('aria-label', active ? 'إزالة من المفضلة' : 'إضافة للمفضلة');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    });
  });

  /* Card click → modal */
  grid.querySelectorAll('.product-card').forEach(card => {
    const openById = () => openProductModal(card.dataset.id);
    card.addEventListener('click', e => {
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn')) return;
      openById();
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openById(); }
    });
  });
}

/* ════════════════════════════════
   CATEGORIES SECTION
════════════════════════════════ */

export function renderCategories(cats) {
  const grid = document.getElementById('categories-grid');
  if (!grid || !cats.length) return;

  grid.innerHTML = cats.map(c => `
    <div class="category-card fade-in" data-name="${c.name}" role="button" tabindex="0"
         aria-label="تصفح فئة ${c.name}">
      <img class="category-card-img" src="${c.imageUrl || ''}" alt="${c.name}"
           loading="lazy" onerror="this.src=''" />
      <div class="category-card-overlay">
        <h3 class="category-card-title">${c.name}</h3>
      </div>
    </div>
  `).join('');

  observeFadeIns();

  grid.querySelectorAll('.category-card').forEach(card => {
    const go = () => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const btn = document.querySelector(`.filter-btn[data-cat="${card.dataset.name}"]`);
        btn?.click();
      }, 500);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

/* ════════════════════════════════
   TESTIMONIALS
════════════════════════════════ */

export function renderTestimonials(items) {
  const grid = document.getElementById('testimonials-grid');
  if (!grid || !items.length) return;

  grid.innerHTML = items.map(t => `
    <div class="testimonial-card glass-card fade-in">
      <div class="testimonial-header">
        <img class="testimonial-avatar" src="${t.avatarUrl || ''}" alt="${t.name}"
             loading="lazy" onerror="this.style.display='none'" />
        <div>
          <p class="testimonial-author">${t.name}</p>
          <div class="stars-row" aria-hidden="true">${renderStars(t.rating)}</div>
        </div>
      </div>
      <p class="testimonial-text">"${t.text}"</p>
    </div>
  `).join('');

  observeFadeIns();
}

/* ════════════════════════════════
   PRODUCT DETAIL MODAL
════════════════════════════════ */

export function initProductModal() {
  /* FIX: close button was on left side in RTL; now uses .modal-close class positioned correctly in CSS */
  document.getElementById('product-modal-close')?.addEventListener('click',   closeProductModal);
  document.getElementById('product-modal-overlay')?.addEventListener('click', closeProductModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('product-modal');
      if (!modal?.classList.contains('hidden')) closeProductModal();
    }
  });
}

export function openProductModal(id) {
  const product = (window.__products || []).find(p => p.id === id);
  if (!product) return;

  setImgById('modal-img',    product.imageUrl || '');
  setTextById('modal-brand', product.brand    || '');
  setTextById('modal-name',  product.name);
  setTextById('modal-desc',  product.description || '');
  setTextById('modal-price', Number(product.price).toLocaleString('ar-EG') + ' EGP');

  /* Stars */
  const starsEl = document.getElementById('modal-stars');
  if (starsEl) starsEl.innerHTML = renderStars(product.rating);

  /* Old price */
  const oldEl = document.getElementById('modal-old-price');
  if (oldEl) {
    if (product.oldPrice) {
      oldEl.textContent = Number(product.oldPrice).toLocaleString('ar-EG') + ' EGP';
      oldEl.classList.remove('hidden');
    } else {
      oldEl.classList.add('hidden');
    }
  }

  /* Discount badge */
  const discEl = document.getElementById('modal-discount-badge');
  if (discEl) {
    if (product.discount) {
      discEl.textContent = `-${product.discount}%`;
      discEl.classList.remove('hidden');
    } else {
      discEl.classList.add('hidden');
    }
  }

  /* Fragrance notes */
  const notesSection = document.getElementById('modal-notes');
  const notesList    = document.getElementById('modal-notes-list');
  if (product.notes?.length && notesSection && notesList) {
    notesList.innerHTML = product.notes.map(n => `<span class="note-tag">${n}</span>`).join('');
    notesSection.classList.remove('hidden');
  } else {
    notesSection?.classList.add('hidden');
  }

  /* Add to cart button */
  const addBtn = document.getElementById('modal-add-to-cart');
  if (addBtn) {
    // Clone to remove any stale onclick from previous modal open
    const newBtn = addBtn.cloneNode(true);
    addBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', () => {
      addToCart({ id: product.id, name: product.name, price: Number(product.price), img: product.imageUrl });
      showToast(`${product.name} أُضيف إلى السلة ✓`);
      closeProductModal();
    });
  }

  document.getElementById('product-modal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Trap focus inside modal
  setTimeout(() => document.getElementById('modal-name')?.focus(), 50);
}

export function closeProductModal() {
  document.getElementById('product-modal')?.classList.add('hidden');
  const anyOtherOpen = document.querySelector('.side-panel.open, .checkout-modal:not(.hidden)');
  if (!anyOtherOpen) document.body.style.overflow = '';
}
