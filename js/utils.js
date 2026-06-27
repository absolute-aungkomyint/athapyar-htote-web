/**
 * ============================================================
 * utils.js — Shared Helpers
 * ============================================================
 *
 * Common utility functions used across the application.
 *
 * Provides:
 *   - formatCurrency(amount) — locale-aware currency formatting
 *     using the user's active currency setting from localStorage
 *   - escapeHtml(str)        — XSS-safe string interpolation
 *
 * Note:
 *   formatCurrency() reads directly from localStorage (aph_settings).
 *   It does not depend on js/storage.js at call time — by the time
 *   any UI renders, storage.js init() has already written defaults.
 * ============================================================
 */

const Utils = (() => {
  'use strict';

  // ──────────────────────────────────────────────────────
  // CURRENCY SYMBOLS
  // Map of currency codes to their display symbols.
  // ──────────────────────────────────────────────────────

  const CURRENCY_SYMBOLS = Object.freeze({
    MMK: 'K',
    USD: '$',
    SGD: 'S$',
    THB: '฿',
    CNY: '¥',
  });

  /** Fallback currency when aph_settings is missing or corrupt. */
  const DEFAULT_CURRENCY = 'MMK';

  // ──────────────────────────────────────────────────────
  // formatCurrency
  // ──────────────────────────────────────────────────────

  /**
   * Format a numeric amount with the user's active currency
   * setting from localStorage.
   *
   * Reads `aph_settings` to determine the current currency code
   * (e.g. 'MMK', 'USD'). Falls back to DEFAULT_CURRENCY if the
   * key is missing or the value is unrecognised.
   *
   * Numbers are formatted with thousand separators (commas) and
   * the appropriate currency symbol prepended.
   *
   * Examples (currency = MMK):
   *   1234567   → "K 1,234,567"
   *   0         → "K 0"
   *   42.5      → "K 42.5"
   *   NaN       → "K 0"
   *
   * Examples (currency = USD):
   *   1234567   → "$ 1,234,567"
   *   42.5      → "$ 42.5"
   *
   * @param  {number} amount — the numeric value to format
   * @return {string}        — formatted currency string
   */
  function formatCurrency(amount) {
    // ── Guard: non-numeric input ───────────────────────
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }

    // ── Read active currency from localStorage ────────
    let currency = DEFAULT_CURRENCY;
    try {
      const raw = localStorage.getItem('aph_settings');
      if (raw) {
        const settings = JSON.parse(raw);
        if (settings && typeof settings.currency === 'string') {
          currency = settings.currency.toUpperCase();
        }
      }
    } catch (err) {
      // Corrupted JSON or SecurityError — fall back silently
      console.warn('[Utils] Could not read aph_settings:', err);
    }

    // ── Validate currency code ────────────────────────
    if (!CURRENCY_SYMBOLS[currency]) {
      currency = DEFAULT_CURRENCY;
    }

    const symbol = CURRENCY_SYMBOLS[currency];

    // ── Format number with thousand separators ────────
    //    Using toLocaleString for reliable comma grouping.
    //    'en-US' guarantees comma as thousands separator.
    //    Maximum 2 decimal places — whole numbers stay clean.
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `${symbol} ${formatted}`;
  }

  // ──────────────────────────────────────────────────────
  // escapeHtml
  // ──────────────────────────────────────────────────────

  /**
   * Escape HTML special characters to prevent XSS when
   * inserting user-generated content into innerHTML.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  // ──────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────

  return Object.freeze({
    formatCurrency,
    escapeHtml,
  });
})();
