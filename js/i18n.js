/**
 * ============================================================
 * i18n.js — Internationalisation Dictionary
 * ============================================================
 *
 * Translation map for English (en) and Myanmar (my).
 * Keys are flat dot-free identifiers — one per translatable
 * UI string. Elements in index.html reference these via
 * the `data-i18n` attribute (e.g. data-i18n="dashboard").
 *
 * Myanmar (my) translations use Unicode characters.
 *
 * Keys are grouped by UI region in this file for readability,
 * but the lookup is a flat namespace — no nesting.
 *
 * Usage (functions will be added later):
 *   translations.en.dashboard  →  "Dashboard"
 *   translations.my.dashboard  →  "ဒက်ရှ်ဘုတ်"
 * ============================================================
 */

const translations = Object.freeze({

  // ──────────────────────────────────────────────────
  // ENGLISH
  // ──────────────────────────────────────────────────
  en: {

    // — Sidebar navigation —
    dashboard:       'Dashboard',
    transactions:    'Transactions',
    budgets:         'Budgets',
    debts:           'Debts',
    goals:           'Goals',
    settings:        'Settings',
    lang_toggle:     'မြန်မာ / EN',

    // — Top bar —
    add:             'Add',

    // — Dashboard page —
    total_balance:   'Total Balance',
    month_income:    'This Month Income',
    month_expense:   'This Month Expense',
    spending_overview: 'Spending Overview',
    recent:          'Recent',
    view_all:        'View all →',
    no_transactions: 'No transactions yet. Start by adding one!',

    // — Transactions page —
    transactions_desc: 'Record and review all income & expenses',
    all_types:       'All Types',
    income:          'Income',
    expense:         'Expense',
    no_transactions_recorded: 'No transactions recorded. Tap + to add your first entry.',

    // — Budgets page —
    budgets_desc:    'Set spending limits and track progress per category',
    set_budget:      'Set Budget',
    no_budgets:      'No budgets set. Define spending limits for your categories.',

    // — Debts page —
    debts_desc:      'Track loans, repayments, and outstanding balances',
    add_debt:        'Add Debt',
    no_debts:        'No debts recorded. Add a debt to start tracking repayments.',

    // — Goals page —
    financial_goals: 'Financial Goals',
    goals_desc:      'Define savings targets and track your progress',
    new_goal:        'New Goal',
    no_goals:        'No goals yet. Set a savings goal to start tracking.',

    // — Settings page —
    settings_desc:   'Configure language, currency, and manage your data',
    language:        'Language / ဘာသာစကား',
    default_currency: 'Default Currency',
    data_management: 'Data Management',
    data_management_desc: 'Export all your data as a JSON file for backup, or import a previous backup to restore.',
    export_data:     'Export Data',
    import_data:     'Import Data',
    clear_all_data:  'Clear All Data',
    about:           'About',
    about_text:      'AthaPyar Htote (အသပြာထုပ်) v0.1.0<br>Offline-first personal budget management.<br>Built with ❤️ for Myanmar.',

    // — Currencies —
    currency_mmk:    'MMK — Myanmar Kyat',
    currency_usd:    'USD — US Dollar',
    currency_sgd:    'SGD — Singapore Dollar',
    currency_thb:    'THB — Thai Baht',
    currency_cny:    'CNY — Chinese Yuan',

    // — Common labels —
    mmk:             'MMK',
    category:        'Category',
    note:            'Note',
    date:            'Date',
    amount:          'Amount',
    save:            'Save',
    cancel:          'Cancel',
    delete:          'Delete',
    edit:            'Edit',
  },

  // ──────────────────────────────────────────────────
  // MYANMAR (မြန်မာ)
  // ──────────────────────────────────────────────────
  my: {

    // — Sidebar navigation —
    dashboard:       'ဒက်ရ်ဘုတ်',
    transactions:    'ငွေသွင်းငွေထုတ်',
    budgets:         'ဘတ်ဂျက်',
    debts:           'အကြွေး',
    goals:           'ရည်မှန်းချက်',
    settings:        'ဆက်တင်',
    lang_toggle:     'EN / မြန်မာ',

    // — Top bar —
    add:             'ထည့်ရန်',

    // — Dashboard page —
    total_balance:   'စုစုပေါင်းလက်ကျန်',
    month_income:    'ဒီလဝင်ငွေ',
    month_expense:   'ဒီလထွက်ငွေ',
    spending_overview: 'သုံးစွဲမှုအကျဉ်းချုပ်',
    recent:          'နောက်ဆုံး',
    view_all:        'အားလုံးကြည့်ရန် →',
    no_transactions: 'ငွေသွင်းငွေထုတ် မရှိသေးပါ။ ထည့်သွင်းခြင်းဖြင့် စတင်ပါ!',

    // — Transactions page —
    transactions_desc: 'ဝင်ငွေနှင့် ထွက်ငွေများကို မှတ်တမ်းတင်ပြီး ပြန်လည်ကြည့်ရှုပါ',
    all_types:       'အမျိုးအစားအားလုံး',
    income:          'ဝင်ငွေ',
    expense:         'ထွက်ငွေ',
    no_transactions_recorded: 'ငွေသွင်းငွေထုတ် မှတ်တမ်းမရှိသေးပါ။ + နှိပ်၍ ပထမဆုံးထည့်ပါ။',

    // — Budgets page —
    budgets_desc:    'အမျိုးအစားအလိုက် သုံးစွဲမှုကန့်သတ်ချက် သတ်မှတ်ပြီး တိုးတက်မှုကို ခြေရာခံပါ',
    set_budget:      'ဘတ်ဂျက်သတ်မှတ်ရန်',
    no_budgets:      'ဘတ်ဂျက် သတ်မှတ်မထားသေးပါ။ သုံးစွဲမှုကန့်သတ်ချက် သတ်မှတ်ပါ။',

    // — Debts page —
    debts_desc:      'ချေးငွေ၊ ပြန်ဆပ်ငွေနှင့် ကျန်ရှိငွေများကို ခြေရာခံပါ',
    add_debt:        'အကြွေးထည့်ရန်',
    no_debts:        'အကြွေး မှတ်တမ်းမရှိသေးပါ။ ပြန်ဆပ်မှု ခြေရာခံရန် အကြွေးထည့်ပါ။',

    // — Goals page —
    financial_goals: 'ငွေကြေးရည်မှန်းချက်',
    goals_desc:      'စုဆောင်းငွေ ပမာဏ သတ်မှတ်ပြီး တိုးတက်မှုကို ခြေရာခံပါ',
    new_goal:        'ရည်မှန်းချက်အသစ်',
    no_goals:        'ရည်မှန်းချက် မရှိသေးပါ။ စုဆောင်းငွေ ရည်မှန်းချက် သတ်မှတ်ပါ။',

    // — Settings page —
    settings_desc:   'ဘာသာစကား၊ ငွေကြေး ပြင်ဆင်ပြီး ဒေတာကို စီမံပါ',
    language:        'ဘာသာစကား / Language',
    default_currency: 'မူလငွေကြေး',
    data_management: 'ဒေတာစီမံခန့်ခွဲမှု',
    data_management_desc: 'သင့်ဒေတာအားလုံးကို အရန်သိမ်းဆည်းရန် JSON ဖိုင်အဖြစ် ထုတ်ယူပါ သို့မဟုတ် ယခင်အရန်မှ ပြန်လည်သွင်းယူပါ။',
    export_data:     'ဒေတာထုတ်ယူရန်',
    import_data:     'ဒေတာသွင်းယူရန်',
    clear_all_data:  'ဒေတာအားလုံးဖျက်ရန်',
    about:           'အကြောင်း',
    about_text:      'အသပြာထုပ် v0.1.0<br>အော့ဖ်လိုင်း ကိုယ်ပိုင်ဘတ်ဂျက် စီမံခန့်ခွဲမှု<br>မြန်မာအတွက် ❤️ ဖြင့် တည်ဆောက်ထားပါသည်။',

    // — Currencies —
    currency_mmk:    'MMK — မြန်မာကျပ်',
    currency_usd:    'USD — အမေရိကန်ဒေါ်လာ',
    currency_sgd:    'SGD — စင်ကာပူဒေါ်လာ',
    currency_thb:    'THB — ထိုင်းဘတ်',
    currency_cny:    'CNY — တရုတ်ယွမ်',

    // — Common labels —
    mmk:             'ကျပ်',
    category:        'အမျိုးအစား',
    note:            'မှတ်စု',
    date:            'ရက်စွဲ',
    amount:          'ပမာဏ',
    save:            'သိမ်းဆည်းရန်',
    cancel:          'ပယ်ဖျက်ရန်',
    delete:          'ဖျက်ရန်',
    edit:            'ပြင်ဆင်ရန်',
  },
});


// ──────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────

/**
 * Current active language code.
 * Initialised from localStorage (aph_settings.language),
 * falling back to 'my' (Myanmar) if nothing is stored yet —
 * the app's primary audience is Myanmar citizens.
 *
 * @type {string} 'en' | 'my'
 */
let currentLang = (() => {
  try {
    const raw = localStorage.getItem('aph_settings');
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.language && translations[settings.language]) {
        return settings.language;
      }
    }
  } catch (_) { /* corrupted JSON — ignore */ }
  return 'my';
})();


// ──────────────────────────────────────────────────────
// PUBLIC FUNCTIONS
// ──────────────────────────────────────────────────────

/**
 * Look up a single translation key for the current language.
 *
 * Falls back to the English string if the key is missing in
 * the active language, and to the raw key itself if missing
 * in both — so untranslated strings are visible rather than blank.
 *
 * @param  {string} key — flat key (e.g. 'dashboard', 'income')
 * @return {string}     — translated string
 *
 * @example
 *   t('dashboard')  // → 'Dashboard'  (en)  or  'ဒက်ရ်ဘုတ်' (my)
 *   t('missing')    // → 'missing'    (graceful fallback)
 */
function t(key) {
  const lang = translations[currentLang];
  if (lang && lang[key] !== undefined) return lang[key];

  // Fallback: English → raw key
  if (translations.en[key] !== undefined) return translations.en[key];
  return key;
}

/**
 * Switch the active language and update every element in the DOM
 * that carries a `data-i18n` attribute.
 *
 * The attribute value is the translation key. Two modes are handled:
 *
 *   data-i18n="key"        → sets element.textContent
 *   data-i18n-html="key"   → sets element.innerHTML (for strings with <br>)
 *
 * The chosen language is persisted to localStorage under
 * the `aph_settings` key (merged with existing settings)
 * so it survives page reloads.
 *
 * @param {string} lang — 'en' or 'my'
 *
 * @example
 *   changeLanguage('my')   // switch to Myanmar
 *   changeLanguage('en')   // switch back to English
 */
function changeLanguage(lang) {
  // Guard: ignore unknown language codes
  if (!translations[lang]) {
    console.warn(`[i18n] Unknown language: "${lang}"`);
    return;
  }

  currentLang = lang;

  // ── Update DOM: textContent ────────────────────────
  // Elements marked data-i18n="key" get their visible text replaced.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  // ── Update DOM: innerHTML ──────────────────────────
  // Elements marked data-i18n-html="key" get their HTML replaced.
  // Used for strings containing <br> or other inline markup.
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });

  // ── Update DOM: placeholders ───────────────────────
  // Inputs/selects marked data-i18n-placeholder="key".
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });

  // ── Update DOM: title attributes ───────────────────
  // Elements marked data-i18n-title="key" (tooltip text).
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });

  // ── Persist language choice ────────────────────────
  // Merge with existing settings so we don't overwrite currency, etc.
  try {
    const raw = localStorage.getItem('aph_settings');
    const settings = raw ? JSON.parse(raw) : {};
    settings.language = lang;
    localStorage.setItem('aph_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('[i18n] Failed to save language preference:', err);
  }

  // ── Update <html lang=""> ──────────────────────────
  document.documentElement.lang = lang === 'my' ? 'my' : 'en';
}

/**
 * Return the currently active language code.
 *
 * @return {string} 'en' or 'my'
 */
function getCurrentLanguage() {
  return currentLang;
}


// ──────────────────────────────────────────────────────
// AUTO-INITIALISE
// On page load, read the saved language preference from
// localStorage. If none exists, default to 'my' (Myanmar)
// since the app's primary audience is Myanmar citizens.
// Then apply translations to every data-i18n element.
// ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  let lang = 'my'; // default for first-time visitors

  try {
    const raw = localStorage.getItem('aph_settings');
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.language && translations[settings.language]) {
        lang = settings.language;
      }
    }
  } catch (_) { /* corrupted JSON — use default */ }

  // Apply translations and persist the resolved language
  changeLanguage(lang);
});
