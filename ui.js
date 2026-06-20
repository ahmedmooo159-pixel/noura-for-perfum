/**
 * ui.js — UI Utilities
 * Toast, side panels, scroll effects, mobile menu, fade-in observer, star renderer.
 * No business logic here — pure DOM interaction helpers.
 */

/* ════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════ */

let _toastTimer = null;

/**
 * Show a toast notification
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 */
export function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const icon = toast?.querySelector('.toast-icon');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;

  // Swap icon based on type
  if (icon) {
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
    icon.setAttribute('data-lucide', icons[type] || 'check-circle');
    if (window.lucide) lucide.createIcons({ nodes: [icon] });
  }

  toast.classList.remove('toast--error', 'toast--info');
  if (type === 'error') toast.classList.add('toast--error');
  if (type === 'info') toast.classList.add('toast--info');

  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ════════════════════════════════
   SIDE PANELS
════════════════════════════════ */

/**
 * Open a named side panel (cart, checkout, etc.)
 * Locks body scroll.
 */
export function openSidePanel(id) {
  const panel = document.getElementById(`${id}-panel`);
  if (panel) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }
  document.getElementById(`${id}-overlay`)?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Close a named side panel.
 * Restores body scroll.
 */
export function closeSidePanel(id) {
  const panel = document.getElementById(`${id}-panel`);
  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  document.getElementById(`${id}-overlay`)?.classList.add('hidden');
  document.body.style.overflow = '';
}

// Expose for legacy inline HTML onclick attributes
window.closeSidePanel = closeSidePanel;
window.openSidePanel = openSidePanel;

/* ════════════════════════════════
   MODAL HELPERS
════════════════════════════════ */

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  // Only restore scroll if no other modals/panels are open
  const anyOpen = document.querySelector('.modal:not(.hidden), .side-panel.open, .checkout-modal:not(.hidden)');
  if (!anyOpen) document.body.style.overflow = '';
}

/* ════════════════════════════════
   STAR RENDERER
════════════════════════════════ */

/**
 * Returns filled/empty star HTML string
 * @param {number} rating 0–5
 * @returns {string}
 */
export function renderStars(rating = 5) {
  const clamped = Math.min(5, Math.max(0, rating));
  const full = Math.floor(clamped);
  const empty = 5 - full;
  return `<span aria-hidden="true">${'★'.repeat(full)}${'☆'.repeat(empty)}</span>`;
}

/* ════════════════════════════════
   LOADING SPINNER
════════════════════════════════ */

export function showSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="spinner-wrap" role="status" aria-label="جاري التحميل">
      <div class="spinner"></div>
    </div>
  `;
}

export function hideSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (el?.querySelector('.spinner-wrap')) el.innerHTML = '';
}

/* ════════════════════════════════
   FADE-IN INTERSECTION OBSERVER
════════════════════════════════ */

let _fadeObserver = null;

export function observeFadeIns() {
  if (!_fadeObserver) {
    _fadeObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          _fadeObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
  }
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => _fadeObserver.observe(el));
}

/* ════════════════════════════════
   SCROLL EFFECTS
════════════════════════════════ */

export function initScrollEffects() {
  const header = document.getElementById('site-header');
  const backTop = document.getElementById('back-to-top');

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 50);

    if (backTop) {
      // FIX: was adding both .visible and .hidden simultaneously
      if (y > 400) {
        backTop.classList.add('visible');
        backTop.classList.remove('hidden');
      } else {
        backTop.classList.remove('visible');
        backTop.classList.add('hidden');
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ════════════════════════════════
   MOBILE MENU
════════════════════════════════ */

export function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const isOpen = !mobileNav.classList.contains('hidden');
    mobileNav.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));

    // Swap icon
    const icon = toggle.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isOpen ? 'menu' : 'x');
      if (window.lucide) lucide.createIcons({ nodes: [icon] });
    }
  });

  // Close on nav link click
  mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
      const icon = toggle.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', 'menu');
        if (window.lucide) lucide.createIcons({ nodes: [icon] });
      }
    });
  });
}

/* ════════════════════════════════
   DOM HELPERS (shared)
════════════════════════════════ */

export function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function setHtmlById(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

export function setImgById(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

export function setAttrById(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, val);
}

/* ════════════════════════════════
   SOCIAL ICON HELPERS
════════════════════════════════ */

export function socialIconLink(url, svgContent, label) {
  return `<a href="${url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${label}">${svgContent}</a>`;
}

export const SVG_ICONS = {
  whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.625-1.469A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.18-.583-5.92-1.602l-.425-.253-2.744.872.884-2.685-.277-.44A9.77 9.77 0 012.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
};
