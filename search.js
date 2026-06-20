/**
 * search.js — Product Search Module
 * Debounced live search across product name, brand, description.
 * Calls back into products.js renderProductCards on input change.
 */

let _onResults = null; // callback: (filteredProducts) => void

/**
 * Initialize search bar behavior.
 * @param {Function} onResults - called with filtered products array
 */
export function initSearch(onResults) {
  _onResults = onResults;

  const toggle = document.getElementById('search-toggle');
  const bar    = document.getElementById('search-bar');
  const input  = document.getElementById('search-input');
  const close  = document.getElementById('search-close');
  if (!toggle || !bar || !input) return;

  /* Toggle visibility */
  toggle.addEventListener('click', () => {
    const isHidden = bar.classList.toggle('hidden');
    if (!isHidden) {
      input.focus();
      input.select();
    } else {
      _clearSearch(input);
    }
  });

  /* Close button */
  close?.addEventListener('click', () => {
    bar.classList.add('hidden');
    _clearSearch(input);
  });

  /* Escape key closes search */
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      bar.classList.add('hidden');
      _clearSearch(input);
    }
  });

  /* Debounced input handler */
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => _doSearch(input.value), 220);
  });
}

function _clearSearch(input) {
  input.value = '';
  _doSearch('');
}

function _doSearch(query) {
  const q        = query.toLowerCase().trim();
  const products = window.__products || [];

  const filtered = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q)                   ||
        (p.brand       || '').toLowerCase().includes(q)    ||
        (p.description || '').toLowerCase().includes(q)    ||
        (p.category    || '').toLowerCase().includes(q)
      )
    : products;

  _onResults?.(filtered, q);
}
