/**
 * ============================================================
 * budget.js — Transaction Form Handler & Budget Logic
 * ============================================================
 *
 * Handles:
 *   - Transaction form submission (add income / expense)
 *   - Input validation (positive amount, category required)
 *   - Building the transaction object per CLAUDE.md schema
 *   - Delegating persistence to Storage.addTransaction()
 *   - Rendering the transaction list and recent transactions
 *   - Updating dashboard balance summary cards after changes
 *
 * Depends on (must load first):
 *   - js/storage.js — Storage.addTransaction(), Storage.getTransactions()
 *
 * Schema (from CLAUDE.md):
 *   { id, type: 'income'|'expense', amount, category, note, date, currency }
 *
 * Form element expected in DOM:
 *   #transaction-form  — <form> with inputs for type, amount, category,
 *                        note, and date
 *
 * Bootstrap:
 *   initBudget() is called by js/app.js during the main application
 *   init sequence. Do NOT add a separate DOMContentLoaded listener
 *   here — app.js owns the boot order.
 * ============================================================
 */

const Budget = (() => {
  'use strict';

  // ──────────────────────────────────────────────────────
  // CONSTANTS
  // ──────────────────────────────────────────────────────

  /**
   * Default categories for income and expense transactions.
   * Used to populate the <select> dropdowns.
   *
   * @type {Object<string, string[]>}
   */
  const CATEGORIES = Object.freeze({
    income: [
      'salary',
      'freelance',
      'business',
      'investment',
      'gift',
      'other_income',
    ],
    expense: [
      'food',
      'transport',
      'housing',
      'utilities',
      'health',
      'education',
      'clothing',
      'entertainment',
      'savings',
      'debt_payment',
      'other_expense',
    ],
  });

  /**
   * CSS selectors for form elements — centralised to avoid typos.
   *
   * @type {Object<string, string>}
   */
  const SEL = Object.freeze({
    FORM:         '#transaction-form',
    TYPE:         '#txn-type',
    AMOUNT:       '#txn-amount',
    CATEGORY:     '#txn-category',
    NOTE:         '#txn-note',
    DATE:         '#txn-date',
    CURRENCY:     '#txn-currency',
    SUBMIT_BTN:   '#txn-submit',
    ERROR_MSG:    '#txn-error',
    LIST:         '#transactions-list',
    RECENT:       '#recent-transactions',
    TOTAL_BAL:    '#total-balance',
    TOTAL_INCOME: '#total-income',
    TOTAL_EXP:    '#total-expense',
    FILTER_TYPE:  '#filter-type',
    FILTER_DATE:  '#filter-date-from',
  });

  /** Maximum number of recent transactions shown on the dashboard. */
  const RECENT_LIMIT = 5;

  // ──────────────────────────────────────────────────────
  // DOM HELPERS
  // ──────────────────────────────────────────────────────

  /**
   * Short-hand for document.querySelector.
   *
   * @param  {string}          selector — CSS selector
   * @return {HTMLElement|null}
   */
  function $(selector) {
    return document.querySelector(selector);
  }

  /**
   * Short-hand for document.querySelectorAll.
   *
   * @param  {string}               selector — CSS selector
   * @return {NodeListOf<HTMLElement>}
   */
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  // ──────────────────────────────────────────────────────
  // VALIDATION
  // ──────────────────────────────────────────────────────

  /**
   * Validate the transaction form inputs.
   * Returns an object with `valid: boolean` and `errors: string[]`.
   *
   * Rules:
   *   - type must be 'income' or 'expense'
   *   - amount must be a positive number (> 0)
   *   - category must be a non-empty string
   *   - date defaults to today if empty
   *
   * @param  {Object}               data — { type, amount, category, date }
   * @return {{ valid: boolean, errors: string[] }}
   */
  function validateTransaction(data) {
    const errors = [];

    // ── Type ───────────────────────────────────────────
    if (!['income', 'expense'].includes(data.type)) {
      errors.push('Transaction type must be income or expense.');
    }

    // ── Amount ─────────────────────────────────────────
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number greater than zero.');
    }

    // ── Category ───────────────────────────────────────
    if (!data.category || !data.category.trim()) {
      errors.push('Please select a category.');
    }

    // ── Date (optional — defaults to today) ────────────
    if (data.date && isNaN(Date.parse(data.date))) {
      errors.push('Invalid date format.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ──────────────────────────────────────────────────────
  // FORM SUBMISSION HANDLER
  // ──────────────────────────────────────────────────────

  /**
   * Handle the transaction form submission.
   *
   * Flow:
   *   1. Prevent default form submission (no page reload)
   *   2. Read and sanitise form inputs
   *   3. Validate (positive amount, category selected)
   *   4. Build transaction object matching CLAUDE.md schema
   *   5. Persist via Storage.addTransaction()
   *   6. Reset form, clear errors, refresh UI
   *
   * @param {SubmitEvent} e — the form submit event
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const form = $(SEL.FORM);
    if (!form) return;

    // ── 1. Read raw inputs ─────────────────────────────
    const typeInput     = $(SEL.TYPE);
    const amountInput   = $(SEL.AMOUNT);
    const categoryInput = $(SEL.CATEGORY);
    const noteInput     = $(SEL.NOTE);
    const dateInput     = $(SEL.DATE);
    const currencyInput = $(SEL.CURRENCY);
    const errorEl       = $(SEL.ERROR_MSG);

    const rawData = {
      type:     typeInput ? typeInput.value : '',
      amount:   amountInput ? amountInput.value : '',
      category: categoryInput ? categoryInput.value : '',
    };

    // ── 2. Validate ────────────────────────────────────
    const { valid, errors } = validateTransaction(rawData);

    if (!valid) {
      showError(errorEl, errors);
      return;
    }

    // ── 3. Build transaction object ────────────────────
    //    Schema: { id, type, amount, category, note, date, currency }
    //    `id` is auto-generated by Storage.addTransaction().
    const settings = Storage.getSettings();
    const transaction = {
      type:     rawData.type,
      amount:   parseFloat(rawData.amount),
      category: rawData.category.trim(),
      note:     noteInput ? noteInput.value.trim() : '',
      date:     dateInput && dateInput.value
                  ? dateInput.value
                  : new Date().toISOString().split('T')[0], // YYYY-MM-DD
      currency: currencyInput ? currencyInput.value : settings.currency,
    };

    // ── 4. Persist ─────────────────────────────────────
    try {
      Storage.addTransaction(transaction);
    } catch (err) {
      console.error('[Budget] Failed to save transaction:', err);
      showError(errorEl, ['Storage is full or unavailable. Please export your data and free up space.']);
      return;
    }

    // ── 5. Reset form & clear errors ───────────────────
    form.reset();
    hideError(errorEl);

    // Restore today's date after reset (form clears it)
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // ── 6. Refresh UI ──────────────────────────────────
    renderTransactionList();
    renderRecentTransactions();
    updateDashboardBalances();

    console.log('[Budget] Transaction added:', transaction);
  }

  // ──────────────────────────────────────────────────────
  // ERROR DISPLAY
  // ──────────────────────────────────────────────────────

  /**
   * Show one or more validation error messages below the form.
   *
   * @param {HTMLElement|null} el     — the error container element
   * @param {string[]}        errors — array of error strings
   */
  function showError(el, errors) {
    if (!el) return;
    el.textContent = errors.join(' ');
    el.classList.remove('hidden');
  }

  /**
   * Hide the error message container.
   *
   * @param {HTMLElement|null} el — the error container element
   */
  function hideError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
  }

  // ──────────────────────────────────────────────────────
  // CATEGORY DROPDOWN — dynamic by type
  // ──────────────────────────────────────────────────────

  /**
   * Populate the category <select> based on the chosen type.
   * Clears existing options and inserts fresh ones from CATEGORIES.
   *
   * @param {string} type — 'income' or 'expense'
   */
  function populateCategories(type) {
    const select = $(SEL.CATEGORY);
    if (!select) return;

    const categories = CATEGORIES[type] || [];
    select.innerHTML = '';

    // Placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Select category —';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Category options
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      select.appendChild(opt);
    });
  }

  /**
   * When the type dropdown changes, refresh the category options.
   */
  function bindTypeChange() {
    const typeSelect = $(SEL.TYPE);
    if (!typeSelect) return;

    typeSelect.addEventListener('change', () => {
      populateCategories(typeSelect.value);
    });
  }

  // ──────────────────────────────────────────────────────
  // DELETE TRANSACTION
  // ──────────────────────────────────────────────────────

  /**
   * Delete a transaction by its id and refresh all related views.
   *
   * Steps:
   *   1. Remove the transaction from localStorage via Storage
   *   2. Re-render the transaction list
   *   3. Re-render the dashboard recent transactions
   *   4. Update the dashboard summary cards
   *
   * @param {string} id — the transaction id to delete
   */
  function deleteTransaction(id) {
    if (!id) return;
    Storage.removeTransaction(id);
    renderTransactionList();
    renderRecentTransactions();
    updateDashboardBalances();
  }

  // ──────────────────────────────────────────────────────
  // RENDER — TRANSACTION LIST
  // ──────────────────────────────────────────────────────

  /**
   * Render the full transaction list in #transactions-list.
   *
   * Loops through all stored transactions, applies any active
   * filters (type, date-from), sorts newest-first, and builds
   * an HTML card for each transaction inside the Transactions
   * section.
   *
   * Each row displays:
   *   - Date
   *   - Category (formatted with spaces instead of underscores)
   *   - Note
   *   - Type indicator (green for income, red for expense)
   *   - Amount with sign (+/−)
   *   - Delete button → calls deleteTransaction(id)
   *
   * After rendering, click handlers are bound to every Delete
   * button so that clicking one removes the transaction and
   * re-renders both the list and the dashboard.
   */
  function renderTransactionList() {
    const listEl = $(SEL.LIST);
    if (!listEl) return;

    let transactions = Storage.getTransactions();

    // ── Apply filters ──────────────────────────────────
    const filterType = $(SEL.FILTER_TYPE);
    const filterDate = $(SEL.FILTER_DATE);

    if (filterType && filterType.value !== 'all') {
      transactions = transactions.filter(t => t.type === filterType.value);
    }

    if (filterDate && filterDate.value) {
      const fromDate = filterDate.value;
      transactions = transactions.filter(t => t.date >= fromDate);
    }

    // ── Sort newest first ──────────────────────────────
    transactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.id || '').localeCompare(a.id || '');
    });

    // ── Empty state ────────────────────────────────────
    if (transactions.length === 0) {
      listEl.innerHTML = `
        <p class="p-12 text-center text-sm text-ink-muted"
           data-i18n="no_transactions_recorded">
          No transactions recorded. Tap <strong>+</strong> to add your first entry.
        </p>`;
      return;
    }

    // ── Build rows ─────────────────────────────────────
    listEl.innerHTML = transactions.map(txn => buildTransactionRow(txn)).join('');

    // Bind delete buttons — each calls deleteTransaction(id)
    listEl.querySelectorAll('[data-txn-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-txn-delete');
        deleteTransaction(id);
      });
    });
  }

  /**
   * Build the HTML string for a single transaction row.
   *
   * @param  {Object} txn — transaction object
   * @return {string}     — HTML markup
   */
  function buildTransactionRow(txn) {
    const isIncome = txn.type === 'income';
    const sign     = isIncome ? '+' : '-';
    const color    = isIncome ? 'text-income' : 'text-expense';
    const bg       = isIncome ? 'bg-income-light' : 'bg-expense-light';
    const icon     = isIncome ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const category = (txn.category || '').replace(/_/g, ' ');

    return `
      <div class="flex items-center justify-between gap-4 px-5 py-4
                  transition-colors hover:bg-surface/60">
        <!-- Left: icon + details -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center
                      rounded-lg ${bg}">
            <i class="fa-solid ${icon} text-sm ${color}"></i>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink truncate">${escapeHtml(category)}</p>
            <p class="text-xs text-ink-muted truncate">${escapeHtml(txn.note || '—')}</p>
          </div>
        </div>

        <!-- Right: amount + date + delete -->
        <div class="flex items-center gap-3 flex-shrink-0 text-right">
          <div>
            <p class="text-sm font-semibold ${color}">${sign}${formatAmount(txn.amount)}</p>
            <p class="text-xs text-ink-muted">${escapeHtml(txn.date || '')}</p>
          </div>
          <button data-txn-delete="${txn.id}"
                  class="flex h-7 w-7 items-center justify-center rounded-md
                         text-ink-muted transition-colors
                         hover:bg-expense-light hover:text-expense"
                  title="Delete transaction">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>`;
  }

  // ──────────────────────────────────────────────────────
  // RENDER — RECENT TRANSACTIONS (dashboard)
  // ──────────────────────────────────────────────────────

  /**
   * Render the most recent transactions on the dashboard card.
   * Limited to RECENT_LIMIT items, newest first.
   */
  function renderRecentTransactions() {
    const recentEl = $(SEL.RECENT);
    if (!recentEl) return;

    const transactions = Storage.getTransactions()
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.id || '').localeCompare(a.id || '');
      })
      .slice(0, RECENT_LIMIT);

    if (transactions.length === 0) {
      recentEl.innerHTML = `
        <p class="py-8 text-center text-sm text-ink-muted"
           data-i18n="no_transactions">
          No transactions yet. Start by adding one!
        </p>`;
      return;
    }

    recentEl.innerHTML = transactions.map(txn => {
      const isIncome = txn.type === 'income';
      const sign     = isIncome ? '+' : '-';
      const color    = isIncome ? 'text-income' : 'text-expense';
      const category = (txn.category || '').replace(/_/g, ' ');

      return `
        <div class="flex items-center justify-between py-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink truncate">${escapeHtml(category)}</p>
            <p class="text-xs text-ink-muted">${escapeHtml(txn.date || '')}</p>
          </div>
          <p class="text-sm font-semibold ${color} flex-shrink-0 ml-3">
            ${sign}${formatAmount(txn.amount)}
          </p>
        </div>`;
    }).join('');
  }

  // ──────────────────────────────────────────────────────
  // DASHBOARD BALANCES — update summary cards
  // ──────────────────────────────────────────────────────

  /**
   * Recalculate and display the balance, income, and expense
   * summary cards on the dashboard.
   *
   * Fetches all transactions via Storage.getTransactions(),
   * computes totals for the current month, and updates the
   * #total-balance, #total-income, and #total-expense elements.
   *
   * Sums are computed from the current month's transactions only.
   */
  function updateDashboardBalances() {
    const transactions = Storage.getTransactions();

    // Current month boundaries (YYYY-MM)
    const now      = new Date();
    const year     = now.getFullYear();
    const month    = String(now.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    let totalIncome  = 0;
    let totalExpense = 0;

    transactions.forEach(txn => {
      // Only count current month
      if (txn.date && txn.date.startsWith(monthStr)) {
        if (txn.type === 'income') {
          totalIncome += txn.amount;
        } else if (txn.type === 'expense') {
          totalExpense += txn.amount;
        }
      }
    });

    const balance = totalIncome - totalExpense;

    // Update DOM
    const balanceEl = $(SEL.TOTAL_BAL);
    const incomeEl  = $(SEL.TOTAL_INCOME);
    const expenseEl = $(SEL.TOTAL_EXP);

    if (balanceEl) balanceEl.textContent = formatAmount(balance);
    if (incomeEl)  incomeEl.textContent  = formatAmount(totalIncome);
    if (expenseEl) expenseEl.textContent = formatAmount(totalExpense);
  }

  // ──────────────────────────────────────────────────────
  // FILTER BINDINGS
  // ──────────────────────────────────────────────────────

  /**
   * Attach change listeners to filter controls so the
   * transaction list re-renders when filters change.
   */
  function bindFilters() {
    const filterType = $(SEL.FILTER_TYPE);
    const filterDate = $(SEL.FILTER_DATE);

    if (filterType) {
      filterType.addEventListener('change', renderTransactionList);
    }
    if (filterDate) {
      filterDate.addEventListener('change', renderTransactionList);
    }
  }

  // ──────────────────────────────────────────────────────
  // FORMATTING HELPERS
  // ──────────────────────────────────────────────────────

  /**
   * Format a numeric amount with comma separators.
   * E.g. 1234567 → "1,234,567"
   *
   * @param  {number} value
   * @return {string}
   */
  function formatAmount(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

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
  // FORM INITIALISATION
  // ──────────────────────────────────────────────────────

  /**
   * Initialise all budget-related UI and data rendering.
   *
   * Called once by app.js during the main application bootstrap.
   * Sets up:
   *   - Transaction form (populate categories, default date, submit handler)
   *   - Type-change → category refresh binding
   *   - Filter controls
   *   - Initial render of the transaction list
   *   - Initial render of recent transactions on the dashboard
   *   - Dashboard balance summary cards
   */
  function initBudget() {
    const form = $(SEL.FORM);
    if (!form) {
      console.warn('[Budget] Transaction form (#transaction-form) not found in DOM.');
      return;
    }

    // ── Populate category dropdown for default type ─────
    const typeSelect = $(SEL.TYPE);
    if (typeSelect) {
      populateCategories(typeSelect.value || 'expense');
    }

    // ── Default date to today ──────────────────────────
    const dateInput = $(SEL.DATE);
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // ── Default currency from settings ─────────────────
    const currencyInput = $(SEL.CURRENCY);
    if (currencyInput) {
      const settings = Storage.getSettings();
      currencyInput.value = settings.currency || 'MMK';
    }

    // ── Bind events ────────────────────────────────────
    form.addEventListener('submit', handleFormSubmit);
    bindTypeChange();
    bindFilters();

    // ── Initial render ─────────────────────────────────
    renderTransactionList();
    renderRecentTransactions();
    updateDashboardBalances();
  }

  // ──────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────

  return Object.freeze({
    initBudget,
    renderTransactionList,
    deleteTransaction,
    renderRecentTransactions,
    updateDashboardBalances,
    validateTransaction,
    CATEGORIES,
  });
})();
