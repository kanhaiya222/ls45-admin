# LS45 — Admin Portal

Single-vendor admin console for **LS45** wellness travel. Manage the journey catalogue, departures,
bookings, taxonomy, CMS pages, blog, and reports.

## Stack

- **Angular 20** — standalone components, **signals**, SPA (no SSR; it's an authed app)
- Same teal/coral design tokens as the customer web portal
- Auth: JWT in `localStorage`; admin endpoints under `/api/v1/admin/**` require `TENANT_ADMIN`

## Run

```bash
npm install
npx ng serve --port 4201      # 4200 is used by the customer web portal
```

→ `http://localhost:4201`. Needs the backend running on `:8080`.

## Test / build

```bash
npm test          # Karma + Jasmine (headless Chrome)
npm run build
```

## Features

Dashboard (booking stats + 30-day revenue + top journeys + departure fill bars) · Packages
(list / create / edit / content / departures) · Bookings (+ payments, cancel) · Reports · Taxonomy ·
CMS pages · Blog. Shell niceties: grouped collapsible sidebar with a hamburger drawer, live nav
badges, breadcrumbs, a **⌘/Ctrl+K command palette**, **dark mode**, toasts and confirm dialogs.

## Structure

```
src/app/
  features/   dashboard · packages · bookings · reports · taxonomy · content · blog · layout (shell) · auth
  core/       services (PackageAdmin, ReportService, Toast, Confirm, QuickFind, Theme), auth, models
  shared/     reusable UI (ListState, toast container, confirm dialog, quick-find)
```

Reuse `<app-list-state>` for any new list screen (loading / error / empty / content states).
