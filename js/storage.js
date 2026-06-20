/**
 * ============================================================
 * storage.js — localStorage CRUD Helpers
 * ============================================================
 *
 * Provides a safe, consistent interface for reading and writing
 * all application data in the browser's localStorage.
 *
 * Every key is prefixed with `aph_` to avoid collisions with
 * other localStorage consumers.
 *
 * Data flow:
 *   JS objects → JSON.stringify() → localStorage
 *   localStorage → JSON.parse()   → JS objects
 *
 * Error handling:
 *   - Corrupted JSON in localStorage is caught and logged;
 *     the default value is returned instead.
 *   - QuotaExceededError is caught on write and surfaced
 *     via console.error so the caller can inform the user.
 *
 * Schema (from CLAUDE.md):
 *   aph_transactions  — Array<{ id, type, amount, category, note, date, currency }>
 *   aph_budgets       — Object<category, { limit, period }>
 *   aph_goals         — Array<{ id, name, targetAmount, savedAmount, deadline }>
 *   aph_debts         — Array<{ id, creditor, amount, dueDate, paid, note }>
 *   aph_settings      — { language, currency, exchangeRates }
 *
 * Usage:
 *   Storage.getTransactions()               // get all
 *   Storage.addTransaction({ ...fields })    // add one
 *   Storage.updateTransaction(id, { note })  // partial update
 *   Storage.removeTransaction(id)            // delete one
 *   Storage.exportAll()                      // JSON blob for download
 *   Storage.importAll(jsonString)            // restore from backup
 * ============================================================
 */

const Storage = (() => {
  'use strict';

  // ============================================================
  // KEY CONSTANTS
  // Centralised so typos in key names are caught at definition.
  // ============================================================

  /** @type {string} Prefix for all localStorage keys */
  const PREFIX = 'aph_';

  /** @enum {string} Exact localStorage key names */
  const KEYS = Object.freeze({
    TRANSACTIONS: `${PREFIX}transactions`,
    BUDGETS:      `${PREFIX}budgets`,
    GOALS:        `${PREFIX}goals`,
    DEBTS:        `${PREFIX}debts`,
    SETTINGS:     `${PREFIX}settings`,
  });

  // ============================================================
  // DEFAULT VALUES
  // Returned when localStorage has no data for a key, or when
  // the stored JSON is corrupted and cannot be parsed.
  // ============================================================

  /** @type {Object} Default settings for first-time users */
  const DEFAULT_SETTINGS = Object.freeze({
    language:      'en',
    currency:      'MMK',
    exchangeRates: {
      MMK: 1,
      USD: 0.00048,
      SGD: 0.00064,
      THB: 0.017,
      CNY: 0.0035,
    },
  });

  // ============================================================
  // LOW-LEVEL HELPERS
  // Thin wrappers around localStorage with JSON safety.
  // ============================================================

  /**
   * Read a raw value from localStorage and parse it as JSON.
   *
   * @param  {string} key         — localStorage key
   * @param  {*}      fallback    — returned on miss or parse error
   * @return {*}                  — parsed value or fallback
   */
  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[Storage] Failed to parse "${key}":`, err);
      return fallback;
    }
  }

  /**
   * Stringify a value and write it to localStorage.
   * Catches QuotaExceededError so callers don't crash.
   *
   * @param {string} key   — localStorage key
   * @param {*}      value — any JSON-serialisable value
   */
  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`[Storage] Failed to write "${key}":`, err);
      throw err; // re-throw so callers can show a user-facing message
    }
  }

  /**
   * Remove a key from localStorage.
   *
   * @param {string} key — localStorage key
   */
  function _remove(key) {
    localStorage.removeItem(key);
  }

  /**
   * Generate a simple unique ID.
   * Uses crypto.randomUUID when available, falls back to
   * a timestamp + random suffix for older browsers.
   *
   * @return {string} — unique identifier
   */
  function _generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  // ============================================================
  // GENERIC CRUD FACTORY
  // Builds get/add/update/remove helpers for any collection key.
  // ============================================================

  /**
   * Create a set of CRUD functions for a localStorage collection.
   *
   * @param  {string}   key       — localStorage key (from KEYS)
   * @param  {Array|Object} empty — default empty value
   * @return {Object}             — { getAll, add, update, remove, clear }
   */
  function _createCollection(key, empty) {
    return {
      /** Retrieve the full collection (array or object). */
      getAll() {
        return _read(key, empty);
      },

      /**
       * Add an item to the collection.
       * For arrays: appends and returns the new item (with generated id).
       * For objects: merges the data under the given category key.
       *
       * @param  {Object} data — fields for the new item
       * @return {Object}      — the stored item
       */
      add(data) {
        const current = _read(key, empty);

        if (Array.isArray(current)) {
          const item = { id: _generateId(), ...data };
          current.push(item);
          _write(key, current);
          return item;
        }

        // Object-mode (budgets): data should be { category, limit, period }
        const { category, ...rest } = data;
        current[category] = rest;
        _write(key, current);
        return current[category];
      },

      /**
       * Update fields on an existing item.
       * For arrays: finds by id and merges partial fields.
       * For objects: merges fields into the given category.
       *
       * @param  {string} identifier — item id (arrays) or category key (objects)
       * @param  {Object} fields     — partial fields to merge
       * @return {Object|null}       — updated item, or null if not found
       */
      update(identifier, fields) {
        const current = _read(key, empty);

        if (Array.isArray(current)) {
          const index = current.findIndex(item => item.id === identifier);
          if (index === -1) return null;
          current[index] = { ...current[index], ...fields };
          _write(key, current);
          return current[index];
        }

        // Object-mode (budgets)
        if (!current[identifier]) return null;
        current[identifier] = { ...current[identifier], ...fields };
        _write(key, current);
        return current[identifier];
      },

      /**
       * Remove an item from the collection.
       * For arrays: filters out by id.
       * For objects: deletes the category key.
       *
       * @param {string} identifier — item id or category key
       */
      remove(identifier) {
        const current = _read(key, empty);

        if (Array.isArray(current)) {
          _write(key, current.filter(item => item.id !== identifier));
          return;
        }

        delete current[identifier];
        _write(key, current);
      },

      /** Empty the collection entirely. */
      clear() {
        _write(key, empty);
      },
    };
  }

  // ============================================================
  // COLLECTION INSTANCES
  // One CRUD helper per data entity, using the schema from CLAUDE.md.
  // ============================================================

  const transactions = _createCollection(KEYS.TRANSACTIONS, []);
  const budgets      = _createCollection(KEYS.BUDGETS, {});
  const goals        = _createCollection(KEYS.GOALS, []);
  const debts        = _createCollection(KEYS.DEBTS, []);

  // ============================================================
  // SETTINGS (not a collection — single object)
  // ============================================================

  /**
   * Get the full settings object. Returns defaults on first run.
   *
   * @return {{ language: string, currency: string, exchangeRates: Object }}
   */
  function getSettings() {
    return _read(KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
  }

  /**
   * Merge partial fields into the settings object.
   *
   * @param {Object} fields — e.g. { language: 'my' }
   */
  function updateSettings(fields) {
    const current = getSettings();
    _write(KEYS.SETTINGS, { ...current, ...fields });
  }

  // ============================================================
  // EXPORT / IMPORT
  // Bundle all data into a single JSON blob for backup/restore.
  // ============================================================

  /**
   * Export every `aph_*` key as a single object.
   * Suitable for JSON.stringify() → file download.
   *
   * @return {Object} — { transactions, budgets, goals, debts, settings, exportedAt }
   */
  function exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: transactions.getAll(),
      budgets:      budgets.getAll(),
      goals:        goals.getAll(),
      debts:        debts.getAll(),
      settings:     getSettings(),
    };
  }

  /**
   * Import data from a previously exported JSON blob.
   * Validates the version field and overwrites all collections.
   *
   * @param  {string} jsonString — raw JSON from file input
   * @return {{ success: boolean, message: string }}
   */
  function importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (!data.version || !data.transactions) {
        return { success: false, message: 'Invalid backup file format.' };
      }

      _write(KEYS.TRANSACTIONS, data.transactions || []);
      _write(KEYS.BUDGETS,      data.budgets || {});
      _write(KEYS.GOALS,        data.goals || []);
      _write(KEYS.DEBTS,        data.debts || []);
      if (data.settings) {
        _write(KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });
      }

      return { success: true, message: 'Data imported successfully.' };
    } catch (err) {
      console.error('[Storage] Import failed:', err);
      return { success: false, message: 'Failed to parse backup file.' };
    }
  }

  /**
   * Clear ALL application data from localStorage.
   * Irreversible — prompts should be shown by the calling UI code.
   */
  function clearAll() {
    Object.values(KEYS).forEach(key => _remove(key));
  }

  // ============================================================
  // INITIALISE
  // Ensure all keys exist with sensible defaults on first run.
  // ============================================================

  /**
   * Set default values for any missing keys.
   * Safe to call multiple times — only touches empty/missing slots.
   */
  function init() {
    if (_read(KEYS.TRANSACTIONS, null) === null) _write(KEYS.TRANSACTIONS, []);
    if (_read(KEYS.BUDGETS, null) === null)      _write(KEYS.BUDGETS, {});
    if (_read(KEYS.GOALS, null) === null)        _write(KEYS.GOALS, []);
    if (_read(KEYS.DEBTS, null) === null)        _write(KEYS.DEBTS, []);
    if (_read(KEYS.SETTINGS, null) === null)     _write(KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
  }

  // Run init on load so every key exists before other modules read them.
  init();

  // ============================================================
  // PUBLIC API
  // Expose everything other modules need.
  // ============================================================

  return Object.freeze({
    // Keys (for direct access if needed)
    KEYS,

    // Transactions
    getTransactions:   () => transactions.getAll(),
    addTransaction:    (data) => transactions.add(data),
    updateTransaction: (id, fields) => transactions.update(id, fields),
    removeTransaction: (id) => transactions.remove(id),
    clearTransactions: () => transactions.clear(),

    // Budgets (object-keyed by category)
    getBudgets:   () => budgets.getAll(),
    setBudget:    (category, limit, period) => budgets.add({ category, limit, period }),
    updateBudget: (category, fields) => budgets.update(category, fields),
    removeBudget: (category) => budgets.remove(category),
    clearBudgets: () => budgets.clear(),

    // Goals
    getGoals:   () => goals.getAll(),
    addGoal:    (data) => goals.add(data),
    updateGoal: (id, fields) => goals.update(id, fields),
    removeGoal: (id) => goals.remove(id),
    clearGoals: () => goals.clear(),

    // Debts
    getDebts:   () => debts.getAll(),
    addDebt:    (data) => debts.add(data),
    updateDebt: (id, fields) => debts.update(id, fields),
    removeDebt: (id) => debts.remove(id),
    clearDebts: () => debts.clear(),

    // Settings
    getSettings,
    updateSettings,

    // Bulk operations
    exportAll,
    importAll,
    clearAll,
    init,
  });
})();
