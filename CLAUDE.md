# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AthaPyar Htote (အသပြာထုပ်) — an offline-first personal budget management web app targeting Myanmar citizens. No build step, no server, no internet required. Everything runs client-side in the browser.

## Tech Stack

- **HTML5** with semantic tags — single `index.html` entry point
- **Tailwind CSS** via CDN (no PostCSS/build pipeline)
- **Vanilla JavaScript (ES6+)** — no frameworks, no bundler
- **localStorage** for persistence — all data stored as JSON on the user's machine
- **Chart.js or ApexCharts** (CDN) for visualizations — lightweight, no build required

## Architecture

This is a pure client-side SPA. There is no `package.json`, no `node_modules`, no build commands. Open `index.html` directly in a browser or serve with any static file server:

```
# Any of these work:
open index.html
python3 -m http.server 8000
npx serve .
```

Data flows: `User Input → JS validation → localStorage (JSON) → DOM update / Chart render`

All state lives in `localStorage` under namespaced keys. Export/import should serialize to/from JSON files for backup.

## Key Constraints

- **Offline-first**: every feature must work with zero network connectivity after initial page load (CDN assets should be cached or bundled locally if needed)
- **Bilingual**: all UI text must support both Myanmar (မြန်မာ) and English — use a translation map, not hardcoded strings
- **Multi-currency**: support at minimum MMK (Kyat), USD, SGD, THB, CNY — exchange rates stored locally, user-configurable
- **No frameworks**: vanilla JS only. No React, Vue, Svelte, etc.
- **No build tools**: no webpack, vite, rollup, or similar. CDN imports only.

## Development

Since there's no build system, development is direct file editing + browser refresh. Use browser DevTools for debugging localStorage and DOM state.

For local development with live reload, any static server works. The simplest:
```
python3 -m http.server 8000
```

## Project Structure (planned)

The app should be organized as:
```
index.html          — single entry point, all sections/pages as hidden/shown divs
css/
  styles.css        — custom styles beyond Tailwind utility classes
js/
  app.js            — main init, routing between "pages" (div toggling)
  storage.js        — localStorage CRUD helpers, data schema, import/export
  budget.js         — income/expense/budget logic
  charts.js         — Chart.js or ApexCharts rendering
  i18n.js           — Myanmar/English translation map and switching
  currency.js       — exchange rate handling
  utils.js          — shared helpers
assets/
  icons/            — any local icons or images
```

## Data Schema (localStorage)

Transactions, budgets, debts, and goals are stored as JSON arrays/objects under keys like:
- `aph_transactions` — array of `{ id, type: 'income'|'expense', amount, category, note, date, currency }`
- `aph_budgets` — object keyed by category with `{ limit, period }`
- `aph_goals` — array of `{ id, name, targetAmount, savedAmount, deadline }`
- `aph_debts` — array of `{ id, creditor, amount, dueDate, paid, note }`
- `aph_settings` — `{ language, currency, exchangeRates }`

Prefix all keys with `aph_` to avoid collisions with other localStorage users.

## Skills

The `.claude/skills/` directory contains installed skills. Relevant ones:
- `frontend-design` — guidance for distinctive UI design (avoid generic AI-generated looks)
- `data-visualization` — charting patterns (note: this skill assumes matplotlib/Python; adapt the principles for Chart.js/ApexCharts in-browser)
- `code-documentation-doc-generate` — for generating docs from code once implementation exists
