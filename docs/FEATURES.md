# Features

Every requirement in the challenge brief, and where to find it. ✅ = implemented and covered by automated or
browser tests; ➕ = goes beyond the brief.

## 1. Authentication & users

| Requirement | Status | Notes |
|---|---|---|
| User accounts with roles | ✅ | Administrator, Manager, Cashier — see the permission table in [ARCHITECTURE.md](ARCHITECTURE.md#roles-and-permissions) |
| Administrator: full access | ✅ | Plus user management, settings, activity log |
| Cashier: create sales, view relevant transactions, print receipts | ✅ | Cashiers only ever see their **own** sales and receipts |
| Manager: reports, inventory, sales performance | ✅ | Also products, refunds, suppliers and purchase orders |
| Additional roles if appropriate | ➕ | Role set is data-driven; a permission map in one file |
| — | ➕ | Create/deactivate users, reset passwords; cannot remove the last or your own admin access |
| — | ➕ | Login lockout (per account+IP and per IP), activity log of sign-ins and changes |

## 2. Product management

| Requirement | Status |
|---|---|
| Add / edit products | ✅ |
| Delete or deactivate | ✅ — products with sales or order history can only be deactivated, so receipts stay intact |
| Assign categories | ✅ — category management page |
| Buying cost · selling price | ✅ — warns before saving a price below cost |
| Stock quantity · minimum stock level | ✅ |
| Product images | ✅ — PNG/JPEG/WebP ≤ 500 KB, validated by file signature |
| SKUs / product codes | ✅ — auto-generated if blank; ➕ barcode field for scanners |

## 3. Inventory management

| Requirement | Status |
|---|---|
| Automatic update when products are sold | ✅ — atomic; stock can never go negative, even with simultaneous sales |
| Stock additions · reductions · adjustments | ✅ — add, remove, write off damaged/expired, set an exact count (stock take) |
| Stock history | ✅ — a complete ledger: every change with who, when, why and the balance afterwards |
| Low-stock alerts · out-of-stock products | ✅ — dashboard, inventory page and low-stock report |
| Inventory valuation | ✅ — at cost and at retail |
| **Bonus:** suppliers | ✅ |
| **Bonus:** purchase orders | ✅ — draft → ordered → received / cancelled; printable |
| **Bonus:** purchase invoices | ◐ — the supplier's invoice number is recorded when stock is received; there is no separate accounts-payable module |
| **Bonus:** stock receiving | ✅ — full or partial deliveries, logged against the order number |

## 4. Sales / POS interface

| Requirement | Status |
|---|---|
| Search products | ✅ — by name, SKU or barcode; category filters |
| Add to cart · change quantities · remove items | ✅ |
| Apply discounts | ✅ — amount or percent; cashiers are limited to a configurable percentage, enforced on the server |
| Subtotal · total | ✅ — always recalculated on the server from database prices |
| Select payment method | ✅ — Cash, Mobile Money, Card, Bank transfer (with optional reference) |
| Complete the sale · generate a receipt | ✅ — numbered `RCP-YYYYMMDD-NNNN`, printable |
| Change calculation, quick-cash buttons, barcode-scanner entry, F2/F9 shortcuts, parked sales, mobile checkout bar | ➕ |

## 5. Sales management

| Requirement | Status |
|---|---|
| View sales · search transactions | ✅ — by receipt number, customer, phone or product |
| Filter by date · cashier · payment method | ✅ — plus status |
| View individual receipts | ✅ |
| Process permitted returns / refunds | ✅ — managers/admins; partial or full; refunds respect the original discount; optional restock |

## 6. Dashboard

| Requirement | Status |
|---|---|
| Today's sales · number of transactions | ✅ — with change versus yesterday |
| Total products · low-stock products | ✅ |
| Best-selling products · gross profit | ✅ |
| Sales by payment method | ✅ |
| Charts | ✅ — sales trend (hover/keyboard tooltips), best sellers, payment mix; every chart also has a table view |

## 7. Reports

| Requirement | Status |
|---|---|
| Sales · profit · inventory · best-selling · low-stock | ✅ |
| Sales by cashier · sales by payment method | ✅ |
| Daily / weekly / monthly sales | ✅ — grouping selector on the sales and profit reports |
| Date filtering | ✅ — presets and custom range |
| Export to CSV / PDF | ✅ — CSV from the server; PDF via the browser's *Save as PDF* from a print-styled page |

## Hosting & submission requirements

| Requirement | Status |
|---|---|
| Hosted online, judges can use it | ✅ — https://pos-tawny-psi.vercel.app |
| Live URL · test account | ✅ — see the [README](../README.md#try-it) |
| Source repository | ✅ |
| Database structure / schema | ✅ — [DATABASE.md](DATABASE.md), [schema.sql](schema.sql) |
| Short technical documentation | ✅ — [ARCHITECTURE.md](ARCHITECTURE.md) |
| Screenshots | ✅ — [docs/screenshots](screenshots) |
| Technologies · implemented features · setup / deployment instructions | ✅ — README, this file, [DEPLOYMENT.md](DEPLOYMENT.md) |

## Quality

| | |
|---|---|
| Automated tests | 52 tests: stock ledger and concurrency, sales, returns and refunds, reporting SQL, permissions, time zones, CSV/report parameters |
| Security | Server-side permission checks on every action and page, hashed passwords, signed httpOnly cookies, strict CSP and security headers, login throttling, upload validation, parameterised SQL |
| Accessibility & responsiveness | Works on phones and tablets; charts have keyboard support and table views |
