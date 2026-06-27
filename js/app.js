/**
 * ============================================================
 * app.js — Main Application Controller
 * ============================================================
 *
 * Initialises the single-page application on DOMContentLoaded.
 * Handles:
 *   - Page routing via showSection() (toggles .active on #page-*)
 *   - Sidebar navigation link binding
 *   - Active nav-link highlighting
 *   - Page title updates (bilingual via i18n.t())
 *   - Mobile hamburger menu toggle
 *   - Quick-add button placeholder
 *
 * Depends on (must load first):
 *   - js/storage.js  — localStorage helpers
 *   - js/i18n.js     — t(), changeLanguage(), getCurrentLanguage()
 *
 * Section visibility model (from CSS):
 *   .page-section          { display: none; }
 *   .page-section.active   { display: block; fadeIn animation }
 *
 * Sidebar nav links use data-page="xxx" to map to #page-xxx sections.
 * ============================================================
 */

(() => {
  'use strict';

  // ──────────────────────────────────────────────────────
  // CONSTANTS
  // ──────────────────────────────────────────────────────

  /**
   * Map of section IDs to their i18n title keys.
   * Used by showSection() to update the top-bar page title.
   *
   * @type {Object<string, string>}
   */
  const PAGE_TITLES = {
    dashboard:    'dashboard',
    transactions: 'transactions',
    budgets:      'budgets',
    debts:        'debts',
    goals:        'goals',
    settings:     'settings',
  };

  /**
   * Default section shown on first load.
   *
   * @type {string}
   */
  const DEFAULT_SECTION = 'dashboard';

  // ──────────────────────────────────────────────────────
  // DOM REFERENCES
  // Cached once on init to avoid repeated queries.
  // ──────────────────────────────────────────────────────

  /** @type {HTMLElement|null} Top-bar page title element */
  let pageTitleEl = null;

  /** @type {NodeListOf<HTMLElement>} All sidebar nav links */
  let navLinks = null;

  /** @type {NodeListOf<HTMLElement>} All page sections */
  let sections = null;

  /** @type {HTMLElement|null} Mobile menu button */
  let btnMobileMenu = null;

  /** @type {HTMLElement|null} Sidebar element */
  let sidebar = null;

  // ──────────────────────────────────────────────────────
  // showSection — SPA ROUTING
  // ──────────────────────────────────────────────────────

  /**
   * Show a specific page section and hide all others.
   *
   * This is the core "router" for the SPA. It:
   *   1. Finds all .page-section elements
   *   2. Removes .active from every section
   *   3. Adds .active to the target #{sectionId}-section
   *   4. Updates the top-bar page title (via i18n key)
   *   5. Highlights the matching sidebar nav link
   *   6. Closes the mobile sidebar (if open)
   *
   * @param {string} sectionId — the page identifier (e.g. 'dashboard', 'transactions')
   *
   * @example
   *   showSection('budgets')    // shows #budgets-section, hides the rest
   *   showSection('settings')   // shows #settings-section
   */
  function showSection(sectionId) {
    // ── Guard: validate the section exists ─────────────
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (!targetSection) {
      console.warn(`[app] showSection: unknown section "${sectionId}"`);
      return;
    }

    // ── Hide all sections ─────────────────────────────
    sections.forEach(section => {
      section.classList.remove('active');
    });

    // ── Show the target section ───────────────────────
    targetSection.classList.add('active');

    // ── Update page title ─────────────────────────────
    // Uses i18n key from PAGE_TITLES so the title respects
    // the current language.
    if (pageTitleEl) {
      const titleKey = PAGE_TITLES[sectionId];
      pageTitleEl.textContent = titleKey ? t(titleKey) : sectionId;
    }

    // ── Highlight active nav link ─────────────────────
    // Match sidebar links by data-page attribute.
    navLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === sectionId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // ── Close mobile sidebar (if open) ────────────────
    if (sidebar && sidebar.classList.contains('translate-x-0')) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    }

    // ── Update URL hash (no page reload) ──────────────
    // Allows deep-linking and browser back/forward.
    if (window.location.hash !== `#${sectionId}`) {
      history.pushState(null, '', `#${sectionId}`);
    }
  }

  // ──────────────────────────────────────────────────────
  // NAVIGATION INIT
  // ──────────────────────────────────────────────────────

  /**
   * Initialise sidebar navigation.
   *
   * Attaches click event listeners to all navigation links and buttons
   * that carry a `data-page` attribute (sidebar links, "View all →"
   * in-page links, etc.).
   *
   * On click each link:
   *   1. Prevents the default anchor behaviour (no page jump / reload)
   *   2. Calls showSection() with the target page identifier
   *   3. showSection() in turn applies the `active` CSS class to the
   *      matching sidebar nav-link and removes it from all others,
   *      giving the user a clear visual indicator of the current page.
   *
   * The `active` class is styled in CSS (gold left-border + tinted
   * background) — see index.html <style> block.
   */
  function initNavigation() {
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        if (page) showSection(page);
      });
    });
  }

  // ──────────────────────────────────────────────────────
  // MOBILE MENU
  // ──────────────────────────────────────────────────────

  /**
   * Toggle the sidebar visibility on mobile (< lg breakpoint).
   * Uses Tailwind's translate classes to slide the sidebar in/out.
   */
  function bindMobileMenu() {
    if (!btnMobileMenu || !sidebar) return;

    btnMobileMenu.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('translate-x-0');

      if (isOpen) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
      } else {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      }
    });

    // Close sidebar when clicking outside (on the overlay area)
    document.addEventListener('click', (e) => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (!isMobile) return;
      if (!sidebar.contains(e.target) && !btnMobileMenu.contains(e.target)) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // HASH ROUTING
  // ──────────────────────────────────────────────────────

  /**
   * Read the URL hash on load and navigate to that section.
   * Supports deep-linking (e.g. opening /#budgets directly).
   */
  function handleHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash && PAGE_TITLES[hash]) {
      showSection(hash);
    } else {
      showSection(DEFAULT_SECTION);
    }
  }

  /**
   * Listen for browser back/forward navigation.
   */
  function bindPopState() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && PAGE_TITLES[hash]) {
        showSection(hash);
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // LANGUAGE CHANGE LISTENER
  // When the language changes, re-apply the current page
  // title so it updates to the new language.
  // ──────────────────────────────────────────────────────

  /**
   * After a language switch, refresh the page title
   * to reflect the new translation.
   */
  function bindLanguageListener() {
    // The i18n module dispatches a custom event after changing language.
    // If it doesn't, we can poll — but let's listen for storage changes.
    window.addEventListener('storage', (e) => {
      if (e.key === 'aph_settings') {
        // Re-apply current section title
        const hash = window.location.hash.replace('#', '');
        if (hash && PAGE_TITLES[hash] && pageTitleEl) {
          pageTitleEl.textContent = t(PAGE_TITLES[hash]);
        }
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // QUICK-ADD BUTTON
  // Placeholder — will open the transaction form once built.
  // ──────────────────────────────────────────────────────

  function bindQuickAdd() {
    const btn = document.getElementById('btn-quick-add');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // Navigate to transactions section where the form will live.
      showSection('transactions');
      // TODO: open the add-transaction modal/form once built.
    });
  }

  // ──────────────────────────────────────────────────────
  // SETTINGS — Default Currency Dropdown
  // ──────────────────────────────────────────────────────

  /**
   * Wire up the Settings page #setting-currency dropdown so that
   * changing the selection persists the new default currency to
   * localStorage (aph_settings.currency) immediately.
   *
   * Also syncs the transaction form's #txn-currency dropdown to
   * match, so the next submission uses the updated default.
   */
  function bindSettingsCurrency() {
    const currencyDropdown = document.getElementById('setting-currency');
    if (!currencyDropdown) return;

    // Set dropdown to saved currency on load
    try {
      if (typeof AphStorage !== 'undefined' && AphStorage.getSettings) {
        const settings = AphStorage.getSettings();
        if (settings.currency) {
          currencyDropdown.value = settings.currency;
        }
      }
    } catch (_) { /* ignore */ }

    currencyDropdown.addEventListener('change', (e) => {
      const newCurrency = e.target.value;
      try {
        if (typeof AphStorage !== 'undefined' && AphStorage.updateSettings) {
          AphStorage.updateSettings({ currency: newCurrency });
          console.log('[App] Default currency changed to:', newCurrency);
        }
      } catch (err) {
        console.error('[App] Failed to save currency setting:', err);
      }

      // Sync the transaction form's currency dropdown immediately
      const txnCurrency = document.getElementById('txn-currency');
      if (txnCurrency) {
        txnCurrency.value = newCurrency;
      }
    });
  }

  // ──────────────────────────────────────────────────────
  // DATA MANAGEMENT — Export / Import / Clear
  // ──────────────────────────────────────────────────────

  /**
   * Wire up the three Settings data-management buttons:
   *
   *   #btn-export-data  — download all app data as a .json file
   *   #btn-import-data  — upload a .json backup and restore
   *   #btn-clear-data   — wipe all app data from localStorage
   *
   * Export:
   *   Calls Storage.exportDataAsJSON() to get a JSON string,
   *   creates a Blob, generates a download link via URL.createObjectURL,
   *   and triggers the download. The filename includes the current
   *   date for easy identification.
   *
   * Import:
   *   Reads the selected .json file via FileReader, passes the
   *   contents to Storage.importDataFromJSON(), and reloads the
   *   page on success so all modules re-initialise with the
   *   restored data.
   *
   * Clear:
   *   Asks for double confirmation, then calls Storage.clearAll()
   *   and reloads the page.
   */
  function bindDataManagement() {
    const btnExport = document.getElementById('btn-export-data');
    const btnImport = document.getElementById('btn-import-data');
    const btnClear  = document.getElementById('btn-clear-data');

    // ── Export ─────────────────────────────────────────
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        try {
          if (typeof AphStorage === 'undefined' || !AphStorage.exportDataAsJSON) {
            alert('Storage module not loaded. Please reload the page.');
            return;
          }

          const json = AphStorage.exportDataAsJSON();
          const blob = new Blob([json], { type: 'application/json' });
          const url  = URL.createObjectURL(blob);

          // Build filename: aph-backup-YYYY-MM-DD.json
          const date = new Date().toISOString().split('T')[0];
          const a    = document.createElement('a');
          a.href     = url;
          a.download = `aph-backup-${date}.json`;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          console.log('[App] Data exported successfully');
        } catch (err) {
          console.error('[App] Export failed:', err);
          alert('Export failed. Please try again.');
        }
      });
    }

    // ── Import ─────────────────────────────────────────
    if (btnImport) {
      btnImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            if (typeof AphStorage === 'undefined' || !AphStorage.importDataFromJSON) {
              alert('Storage module not loaded. Please reload the page.');
              return;
            }

            const result = AphStorage.importDataFromJSON(event.target.result);

            if (result.success) {
              console.log('[App] Data imported:', result.imported);
              alert('Data imported successfully. The page will now reload.');
              window.location.reload();
            } else {
              console.warn('[App] Import failed:', result.message);
              alert('Import failed: ' + result.message);
            }
          } catch (err) {
            console.error('[App] Import error:', err);
            alert('Import failed. The file may be corrupted or in the wrong format.');
          }
        };

        reader.onerror = () => {
          console.error('[App] FileReader error');
          alert('Failed to read the file. Please try again.');
        };

        reader.readAsText(file);

        // Reset the input so the same file can be re-selected
        btnImport.value = '';
      });
    }

    // ── Clear All Data ─────────────────────────────────
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const firstConfirm = window.confirm(
          'Are you sure you want to delete ALL data?\n\n' +
          'This includes all transactions, budgets, debts, goals, and settings.\n' +
          'This action cannot be undone.'
        );
        if (!firstConfirm) return;

        const secondConfirm = window.confirm(
          'This is your last chance.\n\n' +
          'All data will be permanently erased. Continue?'
        );
        if (!secondConfirm) return;

        try {
          if (typeof AphStorage === 'undefined' || !AphStorage.clearAll) {
            alert('Storage module not loaded. Please reload the page.');
            return;
          }

          AphStorage.clearAll();
          console.log('[App] All data cleared');
          alert('All data has been cleared. The page will now reload.');
          window.location.reload();
        } catch (err) {
          console.error('[App] Clear failed:', err);
          alert('Failed to clear data. Please try again.');
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────
  // INITIALISE — initApp()
  // ──────────────────────────────────────────────────────

  /**
   * Main application initialiser — runs on DOMContentLoaded.
   *
   * Boot sequence:
   *   1. Cache frequently-accessed DOM references
   *   2. Bind sidebar navigation click handlers (initNavigation)
   *   3. Bind auxiliary UI: mobile menu, popstate, quick-add
   *   4. Bind language-change listener so page titles update live
   *   5. Show the default section (dashboard) or honour the URL hash
   *
   * i18n compatibility:
   *   js/i18n.js is loaded before js/app.js (see index.html script
   *   order) and its own DOMContentLoaded listener fires first.
   *   By the time initApp() runs, changeLanguage() has already been
   *   called and every data-i18n element in the DOM has been
   *   translated. showSection() therefore resolves t('dashboard')
   *   correctly without any extra synchronisation.
   */
  function initApp() {
    // ── 1. Cache DOM references ─────────────────────────
    pageTitleEl   = document.getElementById('page-title');
    navLinks      = document.querySelectorAll('[data-page]');
    sections      = document.querySelectorAll('.page-section');
    btnMobileMenu = document.getElementById('btn-mobile-menu');
    sidebar       = document.getElementById('sidebar');

    // ── 2. Initialise sidebar navigation ────────────────
    //    Attaches click handlers to every [data-page] link.
    //    On click → preventDefault + showSection(page).
    //    showSection() applies the 'active' CSS class to the
    //    matching nav-link so the user sees which page they're on.
    initNavigation();

    // ── 3. Bind auxiliary UI handlers ────────────────────
    bindMobileMenu();
    bindPopState();
    bindQuickAdd();
    bindSettingsCurrency();
    bindDataManagement();

    // ── 4. Keep page titles in sync after language switch ─
    bindLanguageListener();

    // ── 5. Initialise budget module ──────────────────────
    //    Sets up the transaction form, renders the transaction
    //    list, recent transactions, and dashboard summary cards.
    //    Budget (js/budget.js) must be loaded before this point.
    if (typeof Budget !== 'undefined' && Budget.initBudget) {
      Budget.initBudget();
    }

    // ── 6. Initialise debts module ────────────────────────
    //    Sets up the debt form, renders the debt card list.
    //    Debts (js/debts.js) must be loaded before this point.
    if (typeof Debts !== 'undefined' && Debts.initDebts) {
      Debts.initDebts();
    }

    // ── 7. Initialise goals module ────────────────────────
    //    Sets up the goal form, renders the goal card list.
    //    Goals (js/goals.js) must be loaded before this point.
    if (typeof Goals !== 'undefined' && Goals.initGoals) {
      Goals.initGoals();
    }

    // ── 8. Show default view ─────────────────────────────
    //    If the URL carries a valid hash (#transactions, etc.)
    //    deep-link to that section; otherwise show the dashboard
    //    as the default landing page.
    handleHashRoute();

    console.log('[app] AthaPyar Htote initialised');
  }

  // ── Run on DOM ready ────────────────────────────────
  document.addEventListener('DOMContentLoaded', initApp);

})();
