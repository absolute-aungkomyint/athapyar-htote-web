/**
 * ============================================================
 * budget.js — Transaction & Budget Form Handler
 * ============================================================
 *
 * Handles:
 *   - Transaction form submission (add income / expense)
 *   - Budget form submission (set spending limits per category)
 *   - Input validation (positive amounts, category required)
 *   - Building the transaction object per CLAUDE.md schema
 *   - Delegating persistence to Storage.addTransaction() / Storage.setBudget()
 *   - Rendering the transaction list, recent transactions, and budget cards
 *   - Updating dashboard balance summary cards after changes
 *
 * Depends on (must load first):
 *   - js/storage.js — Storage.addTransaction(), Storage.setBudget(),
 *                      Storage.getTransactions(), Storage.getBudgets()
 *
 * Schema (from CLAUDE.md):
 *   Transactions: { id, type: 'income'|'expense', amount, category, note, date, currency }
 *   Budgets:      Object<category, { limit, period }>
 *
 * Forms expected in DOM:
 *   #transaction-form  — <form> with inputs for type, amount, category,
 *                        note, and date
 *   #budget-form       — <form> with inputs for category, limit, and period
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
  // STORAGE RESOLUTION
  // The browser has a built-in window.Storage (Web Storage API).
  // Our custom module is exposed on window.AphStorage to avoid
  // any naming conflict. Resolve it once here so every helper
  // in this IIFE can use `Storage` safely.
  // ──────────────────────────────────────────────────────

  const Storage = AphStorage;

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

    // Budget form selectors
    BUDGET_FORM:       '#budget-form',
    BUDGET_CATEGORY:   '#budget-category',
    BUDGET_LIMIT:      '#budget-limit',
    BUDGET_PERIOD:     '#budget-period',
    BUDGET_ERROR:      '#budget-error',
    BUDGET_WRAPPER:    '#budget-form-wrapper',
    BUDGET_GRID:       '#budgets-grid',
    BTN_ADD_BUDGET:    '#btn-add-budget',
    BUDGET_CANCEL:     '#budget-cancel',
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
  // BUDGET VALIDATION
  // ──────────────────────────────────────────────────────

  /**
   * Validate the budget form inputs.
   * Returns an object with `valid: boolean` and `errors: string[]`.
   *
   * Rules:
   *   - category must be a non-empty string
   *   - limit must be a positive number (> 0)
   *   - period defaults to 'monthly' if empty
   *
   * @param  {Object}               data — { category, limit, period }
   * @return {{ valid: boolean, errors: string[] }}
   */
  function validateBudget(data) {
    const errors = [];

    // ── Category ───────────────────────────────────────
    if (!data.category || !data.category.trim()) {
      errors.push('Please select a category.');
    }

    // ── Limit ──────────────────────────────────────────
    const limit = parseFloat(data.limit);
    if (isNaN(limit) || limit <= 0) {
      errors.push('Budget limit must be a positive number greater than zero.');
    }

    // ── Period (optional — defaults to monthly) ────────
    if (data.period && !['monthly', 'weekly'].includes(data.period)) {
      errors.push('Period must be monthly or weekly.');
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
   *      (including budget progress bars if a matching budget exists)
   *
   * @param {SubmitEvent} e — the form submit event
   */
  function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('[Budget] handleFormSubmit fired');

    try {
      // Guard: ensure our custom Storage (from storage.js) is loaded.
      // Storage is resolved from window.AphStorage at the top of this IIFE.
      if (!Storage || typeof Storage.addTransaction !== 'function') {
        console.error('[Budget] Storage module not loaded — cannot save.');
        const errorEl = $(SEL.ERROR_MSG);
        showError(errorEl, ['Storage unavailable. Please reload the page.']);
        return;
      }

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

      console.log('[Budget] Form values:', rawData);

      // ── 2. Validate ────────────────────────────────────
      const { valid, errors } = validateTransaction(rawData);

      if (!valid) {
        console.warn('[Budget] Validation failed:', errors);
        showError(errorEl, errors);
        return;
      }

      // ── 3. Build transaction object ────────────────────
      //    Schema: { id, type, amount, category, note, date, currency }
      //    `id` is auto-generated by Storage.addTransaction().
      //
      //    Currency is read directly from the #txn-currency <select>
      //    via getElementById to avoid any selector ambiguity.
      //    Falls back to the user's saved default from Settings,
      //    then to 'MMK' as an absolute last resort.
      const currencyEl = document.getElementById('txn-currency');
      const settings   = Storage.getSettings();
      const txnCurrency = (currencyEl && currencyEl.value)
                            ? currencyEl.value
                            : (settings.currency || 'MMK');

      console.log('[Budget] Resolved currency:', txnCurrency,
                  '| dropdown:', currencyEl ? currencyEl.value : '(not found)',
                  '| settings:', settings.currency);

      const transaction = {
        type:     rawData.type,
        amount:   parseFloat(rawData.amount),
        category: rawData.category.trim(),
        note:     noteInput ? noteInput.value.trim() : '',
        date:     dateInput && dateInput.value
                    ? dateInput.value
                    : new Date().toISOString().split('T')[0], // YYYY-MM-DD
        currency: txnCurrency,
      };

      console.log('[Budget] Persisting transaction:', transaction);

      // ── 4. Persist ─────────────────────────────────────
      Storage.addTransaction(transaction);

      // ── 5. Reset form & clear errors ───────────────────
      form.reset();
      hideError(errorEl);

      // Restore today's date after reset (form clears it)
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }

      // Re-populate categories after reset (reset clears options)
      const typeSelect = $(SEL.TYPE);
      if (typeSelect) {
        populateCategories(typeSelect.value || 'expense');
      }

      // Re-sync currency dropdown with the user's saved default.
      // form.reset() reverts the <select> to its HTML default (MMK,
      // the first <option>), which discards the user's choice. Read
      // the current setting and apply it so the next submission picks
      // up the correct currency without requiring manual re-selection.
      const freshSettings = Storage.getSettings();
      if (currencyEl && freshSettings.currency) {
        currencyEl.value = freshSettings.currency;
      }

      // ── 6. Refresh UI ──────────────────────────────────
      renderTransactionList();
      renderRecentTransactions();
      updateDashboardBalances();
      renderBudgetList();

      console.log('[Budget] Transaction saved successfully');

    } catch (err) {
      console.error('[Budget] handleFormSubmit error:', err);
      const errorEl = $(SEL.ERROR_MSG);
      showError(errorEl, ['Something went wrong. Please try again.']);
    }
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
   *   5. Re-render budget progress bars (spent amounts may change)
   *
   * @param {string} id — the transaction id to delete
   */
  function deleteTransaction(id) {
    if (!id) return;
    Storage.removeTransaction(id);
    renderTransactionList();
    renderRecentTransactions();
    updateDashboardBalances();
    renderBudgetList();
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
        <p class="p-12 text-center text-sm leading-loose text-ink-muted"
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
            <p class="text-sm font-semibold ${color}">${sign}${Utils.formatCurrency(txn.amount)}</p>
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
        <p class="py-8 text-center text-sm leading-loose text-ink-muted"
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
            ${sign}${Utils.formatCurrency(txn.amount)}
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

    if (balanceEl) balanceEl.textContent = Utils.formatCurrency(balance);
    if (incomeEl)  incomeEl.textContent  = Utils.formatCurrency(totalIncome);
    if (expenseEl) expenseEl.textContent = Utils.formatCurrency(totalExpense);
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
  // BUDGET FORM — submission handler
  // ──────────────────────────────────────────────────────

  /**
   * Handle the budget form submission.
   *
   * Flow:
   *   1. Prevent default form submission (no page reload)
   *   2. Read and sanitise form inputs
   *   3. Validate (category selected, positive limit)
   *   4. Persist via Storage.setBudget()
   *   5. Reset form, hide it, refresh budget display
   *
   * @param {SubmitEvent} e — the form submit event
   */
  function handleBudgetFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('[Budget] handleBudgetFormSubmit fired');

    try {
      // Guard: ensure our custom Storage (from storage.js) is loaded.
      if (!Storage || typeof Storage.setBudget !== 'function') {
        console.error('[Budget] Storage module not loaded — cannot save budget.');
        const errorEl = $(SEL.BUDGET_ERROR);
        showError(errorEl, ['Storage unavailable. Please reload the page.']);
        return;
      }

      const form = $(SEL.BUDGET_FORM);
      if (!form) return;

      // ── 1. Read raw inputs ─────────────────────────────
      const categoryInput = $(SEL.BUDGET_CATEGORY);
      const limitInput    = $(SEL.BUDGET_LIMIT);
      const periodInput   = $(SEL.BUDGET_PERIOD);
      const errorEl       = $(SEL.BUDGET_ERROR);

      const rawData = {
        category: categoryInput ? categoryInput.value : '',
        limit:    limitInput ? limitInput.value : '',
        period:   periodInput ? periodInput.value : 'monthly',
      };

      console.log('[Budget] Budget form values:', rawData);

      // ── 2. Validate ────────────────────────────────────
      const { valid, errors } = validateBudget(rawData);

      if (!valid) {
        console.warn('[Budget] Budget validation failed:', errors);
        showError(errorEl, errors);
        return;
      }

      // ── 3. Persist ─────────────────────────────────────
      const limit = parseFloat(rawData.limit);
      Storage.setBudget(rawData.category.trim(), limit, rawData.period || 'monthly');

      console.log('[Budget] Budget saved:', {
        category: rawData.category.trim(),
        limit,
        period: rawData.period || 'monthly',
      });

      // ── 4. Reset form & hide it ────────────────────────
      form.reset();
      hideError(errorEl);

      const wrapper = $(SEL.BUDGET_WRAPPER);
      if (wrapper) wrapper.classList.add('hidden');

      // ── 5. Refresh budget display ──────────────────────
      renderBudgetList();

    } catch (err) {
      console.error('[Budget] handleBudgetFormSubmit error:', err);
      const errorEl = $(SEL.BUDGET_ERROR);
      showError(errorEl, ['Something went wrong. Please try again.']);
    }
  }

  // ──────────────────────────────────────────────────────
  // BUDGET FORM — category dropdown population
  // ──────────────────────────────────────────────────────

  /**
   * Populate the budget category <select> with expense categories.
   * Budgets are typically set for expense categories only.
   */
  function populateBudgetCategories() {
    const select = $(SEL.BUDGET_CATEGORY);
    if (!select) return;

    const categories = CATEGORIES.expense || [];
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

  // ──────────────────────────────────────────────────────
  // BUDGET FORM — show/hide & event binding
  // ──────────────────────────────────────────────────────

  /**
   * Wire up the budget form: submit handler, cancel button,
   * "Set Budget" toggle button, and category population.
   *
   * Called once by initBudget() during bootstrap.
   */
  function bindBudgetForm() {
    const form    = $(SEL.BUDGET_FORM);
    const btnAdd  = $(SEL.BTN_ADD_BUDGET);
    const btnCancel = $(SEL.BUDGET_CANCEL);
    const wrapper = $(SEL.BUDGET_WRAPPER);

    // ── Submit handler ─────────────────────────────────
    if (form) {
      form.addEventListener('submit', handleBudgetFormSubmit);
    }

    // ── "Set Budget" button — toggle form visibility ───
    if (btnAdd && wrapper) {
      btnAdd.addEventListener('click', () => {
        const isHidden = wrapper.classList.contains('hidden');
        wrapper.classList.toggle('hidden');

        if (isHidden) {
          // Populate categories when opening the form
          populateBudgetCategories();
        }
      });
    }

    // ── Cancel button — hide form and reset ────────────
    if (btnCancel && wrapper && form) {
      btnCancel.addEventListener('click', () => {
        form.reset();
        const errorEl = $(SEL.BUDGET_ERROR);
        hideError(errorEl);
        wrapper.classList.add('hidden');
      });
    }
  }

  // ──────────────────────────────────────────────────────
  // RENDER — BUDGET CARDS
  // ──────────────────────────────────────────────────────

  /**
   * Render all saved budgets as cards in #budgets-grid.
   *
   * Each card shows:
   *   - Category name
   *   - Budget limit
   *   - Period (monthly / weekly)
   *   - Delete button → removes the budget
   */
  function renderBudgets() {
    const gridEl = $(SEL.BUDGET_GRID);
    if (!gridEl) return;

    const budgets = Storage.getBudgets();
    const categories = Object.keys(budgets);

    if (categories.length === 0) {
      gridEl.innerHTML = `
        <p class="col-span-full p-12 text-center text-sm leading-loose text-ink-muted"
           data-i18n="no_budgets">
          No budgets set. Define spending limits for your categories.
        </p>`;
      return;
    }

    gridEl.innerHTML = categories.map(category => {
      const budget = budgets[category];
      const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const limit = Utils.formatCurrency(budget.limit);
      const period = (budget.period || 'monthly').toLowerCase();

      return `
        <div class="rounded-xl border border-surface-dark bg-surface-card
                    p-5 shadow-sm transition-shadow hover:shadow-md">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-ink">${escapeHtml(label)}</span>
            <button data-budget-delete="${escapeHtml(category)}"
                    class="flex h-7 w-7 items-center justify-center rounded-md
                           text-ink-muted transition-colors
                           hover:bg-expense-light hover:text-expense"
                    title="Remove budget">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
          <p class="font-display text-xl text-ink">${limit}</p>
          <p class="mt-1 text-xs text-ink-muted capitalize">${escapeHtml(period)}</p>
        </div>`;
    }).join('');

    // Bind delete buttons
    gridEl.querySelectorAll('[data-budget-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-budget-delete');
        if (category) {
          Storage.removeBudget(category);
          renderBudgets();
        }
      });
    });
  }

  // ──────────────────────────────────────────────────────
  // RENDER — BUDGET LIST WITH PROGRESS BARS
  // ──────────────────────────────────────────────────────

  /**
   * Build a date-range string prefix for the current period.
   *
   * For 'monthly': returns 'YYYY-MM' to match transaction dates.
   * For 'weekly':  returns an array of 'YYYY-MM-DD' strings for
   *                the 7 days of the current week (Mon–Sun).
   *
   * @param  {string}             period — 'monthly' or 'weekly'
   * @return {{ prefix?: string, dates?: string[] }}
   */
  function _getPeriodRange(period) {
    const now = new Date();

    if (period === 'weekly') {
      // Build array of YYYY-MM-DD strings for current week (Mon–Sun)
      const day = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7)); // shift to Monday

      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return { dates };
    }

    // Monthly — default
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return { prefix: `${year}-${month}` };
  }

  /**
   * Calculate the total amount spent in a given category for the
   * current budget period (monthly or weekly).
   *
   * Filters transactions by:
   *   - type === 'expense'
   *   - category matches exactly
   *   - date falls within the current period
   *
   * @param  {string} category — the budget category key
   * @param  {string} period   — 'monthly' or 'weekly'
   * @return {number}          — total spent
   */
  function _calculateSpent(category, period) {
    const transactions = Storage.getTransactions();
    const range = _getPeriodRange(period);

    return transactions
      .filter(txn => {
        if (txn.type !== 'expense') return false;
        if (txn.category !== category) return false;
        if (!txn.date) return false;

        if (range.dates) {
          // Weekly — exact date match within the 7-day array
          return range.dates.includes(txn.date);
        }
        // Monthly — prefix match (YYYY-MM)
        return txn.date.startsWith(range.prefix);
      })
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);
  }

  /**
   * Render all saved budgets with spending progress bars in #budgets-grid.
   *
   * Fetches all budgets and all transactions, then for each budget
   * category calculates the total spent in the current period. Renders a
   * visual progress bar showing usage percentage.
   *
   * Visual rules:
   *   - 0–99%   → primary teal bar
   *   - ≥ 100%  → red (expense) bar to warn the user
   *   - Bar width is capped at 100% visually even if overspent
   *
   * Each card displays:
   *   - Category name + period badge
   *   - Spent / Limit amounts
   *   - Progress bar with percentage label
   *   - Delete button → confirm dialog → removes budget from
   *     localStorage (aph_budgets) → re-renders list immediately
   */
  function renderBudgetList() {
    const gridEl = $(SEL.BUDGET_GRID);
    if (!gridEl) return;

    const budgets = Storage.getBudgets();
    const categories = Object.keys(budgets);

    // ── Empty state ────────────────────────────────────
    if (categories.length === 0) {
      gridEl.innerHTML = `
        <p class="col-span-full p-12 text-center text-sm leading-loose text-ink-muted"
           data-i18n="no_budgets">
          No budgets set. Define spending limits for your categories.
        </p>`;
      return;
    }

    // ── Build cards ────────────────────────────────────
    gridEl.innerHTML = categories.map(category => {
      const budget  = budgets[category];
      const limit   = budget.limit || 0;
      const period  = (budget.period || 'monthly').toLowerCase();
      const spent   = _calculateSpent(category, period);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const isOver  = percent >= 100;

      // Visual width — capped at 100% for the bar fill
      const barWidth = Math.min(percent, 100);

      // Bar colour: red when over budget, primary teal otherwise
      const barColor    = isOver ? 'bg-expense' : 'bg-primary';
      const textColor   = isOver ? 'text-expense' : 'text-primary';
      const borderColor = isOver ? 'border-expense/30' : 'border-surface-dark';

      const label = category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      return `
        <div class="rounded-xl border ${borderColor} bg-surface-card
                    p-5 shadow-sm transition-shadow hover:shadow-md">

          <!-- Header: category + delete -->
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-ink">${escapeHtml(label)}</span>
            <button data-budget-delete="${escapeHtml(category)}"
                    class="flex h-7 w-7 items-center justify-center rounded-md
                           text-ink-muted transition-colors
                           hover:bg-expense-light hover:text-expense"
                    title="Remove budget">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>

          <!-- Amounts: spent / limit -->
          <div class="mb-3 flex items-baseline justify-between">
            <p class="font-display text-xl text-ink">
              ${Utils.formatCurrency(spent)}
              <span class="text-sm font-body text-ink-muted">/ ${Utils.formatCurrency(limit)}</span>
            </p>
            <span class="text-xs font-medium capitalize text-ink-muted
                         rounded-full bg-surface-dark px-2 py-0.5">
              ${escapeHtml(period)}
            </span>
          </div>

          <!-- Progress bar track -->
          <div class="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-dark">
            <div class="${barColor} h-full rounded-full transition-all duration-500"
                 style="width: ${barWidth}%;">
            </div>
          </div>

          <!-- Percentage label -->
          <p class="text-right text-xs font-medium ${textColor}">
            ${percent}% used
          </p>
        </div>`;
    }).join('');

    // ── Bind delete buttons ────────────────────────────
    //    Each button carries a data-budget-delete attribute
    //    holding the category key. On click:
    //      1. Confirm the user intends to delete
    //      2. Remove the budget from localStorage (aph_budgets)
    //      3. Re-render the list immediately
    gridEl.querySelectorAll('[data-budget-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-budget-delete');
        if (!category) return;

        const label = category
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        // ── Confirmation ───────────────────────────────
        const confirmed = window.confirm(
          `Remove the budget for "${label}"?\nThis will not delete any transactions.`
        );
        if (!confirmed) return;

        // ── Delete from localStorage ───────────────────
        try {
          if (!Storage || typeof Storage.removeBudget !== 'function') {
            console.error('[Budget] Storage.removeBudget unavailable.');
            return;
          }

          const removed = Storage.removeBudget(category);
          console.log('[Budget] Budget removed:', category, '| success:', removed);

          // ── Re-render ──────────────────────────────
          renderBudgetList();
        } catch (err) {
          console.error('[Budget] Failed to delete budget:', err);
        }
      });
    });
  }

  // ──────────────────────────────────────────────────────
  // FORMATTING HELPERS
  // ──────────────────────────────────────────────────────

  /**
   * Format a numeric amount with the active currency symbol
   * and thousand separators. Delegates to Utils.formatCurrency().
   *
   * @param  {number} value
   * @return {string}
   */
  function formatAmount(value) {
    return Utils.formatCurrency(value);
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

    // ── Bind submit handler FIRST — before anything that ──
    //    might throw (e.g. Storage.getSettings). This way
    //    the form always works even if optional setup fails.
    form.addEventListener('submit', handleFormSubmit);
    bindTypeChange();
    bindFilters();
    bindBudgetForm();

    // ── Populate category dropdown for default type ─────
    try {
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
    } catch (err) {
      console.warn('[Budget] Optional setup failed (form still works):', err);
    }

    // ── Initial render ─────────────────────────────────
    renderTransactionList();
    renderRecentTransactions();
    updateDashboardBalances();
    renderBudgetList();

    console.log('[Budget] initBudget complete — submit handler attached');
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
    renderBudgets,
    renderBudgetList,
    validateTransaction,
    validateBudget,
    CATEGORIES,
  });
})();
