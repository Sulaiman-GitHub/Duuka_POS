# Duuka POS

A web-based point-of-sale, inventory and reporting system for small and medium retail shops — built for the
**DVN Digital Skills Challenge 1 · Programming Challenge**.

Ring up sales at a fast cashier screen, keep stock accurate with a full audit trail, handle returns and refunds, order
from suppliers, and see how the shop is doing on a live dashboard — with role-based access for administrators,
managers and cashiers.

| | |
|---|---|
| **Live demo** | https://pos-tawny-psi.vercel.app |
| **Source** | https://github.com/Sulaiman-GitHub/POS |
| **Stack** | Next.js 16 (App Router) · TypeScript · React 19 · PostgreSQL · Prisma 7 · Tailwind CSS 4 |
| **Hosting** | Vercel (app) + Neon (PostgreSQL) |

## Try it

Sign in at the live URL with any of these demo accounts (demo data only — there is no real customer data in this system):

| Role | Email | Password | Can do |
|---|---|---|---|
| Administrator | `admin@pos.test` | `Admin@123` | Everything, including users, settings and the activity log |
| Manager | `manager@pos.test` | `Manager@123` | POS, sales & refunds, products, inventory, suppliers/orders, reports, dashboard |
| Cashier | `cashier@pos.test` | `Cashier@123` | POS, own sales and receipts, read-only products & stock |

The database comes pre-loaded with a demo mini-mart: 44 products in 8 categories, about 60 days of sales, two suppliers
and an open purchase order, so every dashboard, chart and report has something to show.

**A 3-minute tour:** sign in as *cashier* → **Point of Sale** → search "bread", tap products, set a discount, pick
*Mobile Money*, **Complete sale** → print the receipt. Then sign in as *manager* → **Sales** → open the receipt →
**Return / refund**, check **Inventory → Stock history**, and open the **Dashboard** and **Reports** (export to CSV or
save as PDF).

## Screenshots

| | |
|---|---|
| ![Dashboard](docs/screenshots/02-dashboard.png) **Dashboard** | ![POS](docs/screenshots/03-pos.png) **Point of sale** |
| ![Receipt](docs/screenshots/04-receipt.png) **Receipt** | ![Products](docs/screenshots/05-products.png) **Products** |
| ![Inventory](docs/screenshots/06-inventory.png) **Inventory & valuation** | ![Stock history](docs/screenshots/07-stock-history.png) **Stock history** |
| ![Sales](docs/screenshots/08-sales.png) **Sales** | ![Return](docs/screenshots/09-return.png) **Returns & refunds** |
| ![Sales report](docs/screenshots/10-reports-sales.png) **Sales report** | ![Profit report](docs/screenshots/11-reports-profit.png) **Profit report** |
| ![Purchase orders](docs/screenshots/12-purchase-orders.png) **Purchase orders** | ![Receive stock](docs/screenshots/13-purchase-order-detail.png) **Receiving stock** |
| ![Users](docs/screenshots/14-users.png) **Users** | ![Settings](docs/screenshots/15-settings.png) **Settings** |
| ![Activity log](docs/screenshots/16-activity-log.png) **Activity log** | ![Login](docs/screenshots/01-login.png) **Sign in** |

Works on phones and tablets too:

<img src="docs/screenshots/17-mobile-pos.png" width="240" alt="POS on a phone"> <img src="docs/screenshots/18-mobile-dashboard.png" width="240" alt="Dashboard on a phone">

## Features

Full checklist against the challenge brief: **[docs/FEATURES.md](docs/FEATURES.md)**. Highlights:

- **Roles & security** — administrator / manager / cashier with server-enforced permissions, hashed passwords,
  signed sessions, login lockout, strict security headers, activity log.
- **Products** — categories, SKUs and barcodes, buying cost and selling price, stock and minimum level, images,
  deactivate or delete.
- **Inventory** — automatic deduction on sale, additions, reductions, damage write-offs and stock-take adjustments,
  a complete **stock ledger**, low-stock and out-of-stock alerts, inventory valuation at cost and retail.
- **Point of sale** — product grid, search and barcode-scanner entry, quantities, discounts (with a cashier limit),
  cash / Mobile Money / card / bank transfer, change calculation, printable receipts, **parked sales**, keyboard
  shortcuts (F2 search, F9 pay).
- **Sales management** — search and filter by date, cashier, payment method and status; receipts; **returns and refunds**
  that respect discounts and put stock back.
- **Dashboard & reports** — today's figures, sales trend, best sellers, payment mix; seven reports with date filters,
  daily/weekly/monthly grouping, **CSV export** and **print / save as PDF**.
- **Bonus** — suppliers, purchase orders, partial stock receiving with supplier invoice numbers.

## Run it locally

Requirements: **Node.js 22+** and **PostgreSQL 14+**.

```bash
git clone https://github.com/Sulaiman-GitHub/POS.git && cd POS
npm install

createdb pos                         # or create any empty PostgreSQL database
cp .env.example .env                 # then edit DATABASE_URL and SESSION_SECRET
npx prisma migrate deploy            # create the tables
npm run db:seed                      # load the demo data (users, products, sales, ...)

npm run dev                          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (also migrates, and seeds an empty database) / run it |
| `npm test` | 52 automated tests (a separate `pos_test` database is created automatically) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:seed` | **Wipes** the database and reloads the demo data |

## Deploy

Step-by-step guide for Vercel + Neon: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. In short: connect the repository
to Vercel, attach a Neon Postgres database, set `SESSION_SECRET`, deploy — the build creates the tables and loads the
demo data on its own.

## Documentation

| Document | Contents |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | Every feature, mapped to the challenge requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical documentation: design, security, money rules, concurrency, testing |
| [docs/DATABASE.md](docs/DATABASE.md) | Database structure with an ER diagram · raw SQL in [docs/schema.sql](docs/schema.sql) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup and deployment instructions |

## Technologies

Next.js 16 (App Router, Server Components & Server Actions) · React 19 · TypeScript · Tailwind CSS 4 ·
PostgreSQL · Prisma 7 (with the `pg` driver adapter) · Zod (validation) · bcryptjs (password hashing) · jose (signed
session tokens) · lucide-react (icons) · Vitest (tests) · hand-built SVG charts. No third-party scripts, fonts or
analytics are loaded.

## Honest notes & limitations

- Demo passwords are public on purpose so judges can sign in; use real, private credentials for a real shop.
- Product images are stored in the database (the host has no persistent disk); they are limited to 500 KB each.
- *Parked sales* are saved in the cashier's browser, so they stay on that device.
- "PDF export" uses the browser's *Save as PDF* from a print-styled page; CSV is generated on the server.
- `npm audit` reports advisories inside Prisma's **command-line tooling** (build-time only, not part of the running
  app). No patched 7.x release exists yet; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#known-limitations).

## AI disclosure

This project was built with the assistance of an AI coding assistant (Claude) working in the repository under the
author's direction. The author directed the work, chose the product scope, tested the live deployment, and operates it.
