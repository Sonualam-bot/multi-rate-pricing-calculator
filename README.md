# Multi-Rate Pricing Calculator (MRPC)

Create documents with line items, apply per-line discounts and tax, compute totals server-side, and view a summary report over a date range. Documents move through a draft → finalized lifecycle; once finalized, a document is immutable via the API.

**Live app:** https://multi-rate-pricing-calculator-psi.vercel.app
**API:** https://multi-rate-pricing-calculator-a27a.onrender.com
**Repo:** https://github.com/Sonualam-bot/multi-rate-pricing-calculator

No account needed to try it — click **Continue as guest** on the login screen. It creates a brand-new, isolated account on the spot (see [Assumptions & tradeoffs](#assumptions--tradeoffs)).

## Tech stack

- **Backend:** Node, Express, TypeScript, Mongoose (MongoDB), Zod, JWT
- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS
- **Tests:** Vitest, on the calculation module

## Prerequisites

- Node 20+
- A MongoDB connection string — either a local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Sonualam-bot/multi-rate-pricing-calculator.git
cd multi-rate-pricing-calculator
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in the values below
npm run dev             # starts on http://localhost:4000
```

| Variable        | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `MONGODB_URI`   | MongoDB connection string                                                     |
| `JWT_SECRET`    | Any long random string, used to sign session tokens                           |
| `CLIENT_ORIGIN` | The frontend's origin (`http://localhost:5173` in dev) — used for CORS        |
| `NODE_ENV`      | `development` locally; the app checks for `production` to decide cookie flags |

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to the backend's URL
npm run dev             # starts on http://localhost:5173
```

| Variable       | Description                                             |
| -------------- | ------------------------------------------------------- |
| `VITE_API_URL` | The backend's base URL (`http://localhost:4000` in dev) |

### 4. Tests

```bash
cd backend
npm test
```

Runs the calculation module's unit tests — per-line math for each line in the worked example below, the discount-exceeds-subtotal rejection case, and the full document totals.

## Calculation & rounding policy

All money is handled as **integer cents** end to end — request bodies, database, and calculations — never floats. This avoids the classic `0.1 + 0.2 !== 0.3` class of drift at every layer, not just storage.

**Per line, in this order:**

1. `subtotalCents = quantity × unitPriceCents`
2. Apply discount — **fixed cents subtracted, or a percent off the subtotal, never both** (enforced by the API's request schema, not just application logic). A fixed discount larger than the line's subtotal is **rejected** with a 400, not clamped — see [Assumptions & tradeoffs](#assumptions--tradeoffs) for why.
3. `taxCents = round(afterDiscountCents × taxPercent / 100)` — tax is computed on the **post-discount** amount, never the original subtotal.
4. `lineTotalCents = afterDiscountCents + taxCents`

**Rounding policy:** round-half-up, applied at exactly two points — after computing the discount amount (when it's a percent), and after computing the tax amount. Never before, never anywhere else in the pipeline, since `subtotalCents` and `afterDiscountCents` are always exact integer cents already.

**Document totals** are a straight sum of each line's already-rounded values — nothing is recomputed or re-rounded at the document level:

| Field          | Formula                 |
| -------------- | ----------------------- |
| Subtotal       | Σ line subtotals        |
| Total discount | Σ line discount amounts |
| Total tax      | Σ line tax amounts      |
| Grand total    | Σ line totals           |

### Worked example

| Line        | Qty | Unit price | Discount  | Tax |
| ----------- | --- | ---------- | --------- | --- |
| Widget A    | 2   | $100.00    | 10%       | 5%  |
| Widget B    | 1   | $50.00     | —         | 5%  |
| Service fee | 1   | $200.00    | $20 fixed | —   |

| Line        | Subtotal | Discount            | After discount | Tax                            | Line total |
| ----------- | -------- | ------------------- | -------------- | ------------------------------ | ---------- |
| Widget A    | $200.00  | $20.00 (10% of 200) | $180.00        | $9.00 (5% of **180**, not 200) | $189.00    |
| Widget B    | $50.00   | $0.00               | $50.00         | $2.50                          | $52.50     |
| Service fee | $200.00  | $20.00 (fixed)      | $180.00        | $0.00                          | $180.00    |

**Document totals:** subtotal $450.00, total discount $40.00, total tax $11.50, grand total $421.50 (= 189.00 + 52.50 + 180.00, or equivalently 450 − 40 + 11.50). This exact example is what `backend/src/calc/calc.test.ts` asserts against.

## Finalize / immutability rules

- A new document starts as `draft`: fully editable — title/customer/issue date, and add/edit/delete on any line item.
- `POST /documents/:id/finalize` flips it to `finalized` and stamps `finalizedAt`. It does **not** recompute totals — every mutating endpoint already keeps `totals` correct as it goes, so finalize has nothing left to do but lock the door.
- Finalizing requires **at least one line item** — a defensive check beyond what the spec asks for, since a zero-line "finalized invoice" isn't meaningful.
- Once `finalized`, **every** mutation is rejected with `409 Cannot modify a finalized document`: metadata edits, line item add/edit/delete, and — by our reading of "read-only" — **deleting the document itself**. Permanently destroying a finalized record would undermine the reason it was locked in the first place.
- Re-finalizing an already-finalized document is rejected with its own `409 Document is already finalized`.
- **Duplicate → new draft** (stretch goal): implemented via `POST /documents/:id/duplicate`. Copies `customer` and line items — input fields only (`description`/`quantity`/`unitPriceCents`/`discount`/`taxPercent`), never the computed cents fields, since the duplicate is created through the same `createDocument` path a brand-new document takes, so totals get recomputed from scratch rather than copied. `title` gets a **numbered** suffix ("Sugar" → "Sugar 1" → "Sugar 2", scanning the user's existing documents for the highest number already used on that base title) rather than a fixed `" (Copy)"` tag — a fixed tag compounds every time you duplicate a duplicate ("Sugar (Copy) (Copy) (Copy)"), which a number sequence doesn't. Two more deliberate choices beyond the spec's literal ask: it works on a document of **any** status, not just finalized ones (duplicating a draft is the same operation, no reason to forbid it), and the new document's `issueDate` resets to the current date rather than copying the original's, since the duplicate is a new document being created today, not a historical record.
- **Finalize validation — reject qty ≤ 0 or negative price** (the other stretch goal): not implemented as a separate check, because it's structurally unreachable. `quantity < 1` and negative `unitPriceCents` are already rejected by the request-validation schema on every line item write, so no line item with those values can ever exist in the database to begin with.

## API reference

All routes except `/auth/*` require a valid session cookie (`requireAuth` middleware). All request/response bodies use the same integer-cents fields as the calculation above.

| Method | Path                                    | Description                                                              |
| ------ | --------------------------------------- | ------------------------------------------------------------------------ |
| POST   | `/auth/signup`                          | Create an account                                                        |
| POST   | `/auth/login`                           | Log in                                                                   |
| POST   | `/auth/guest`                           | Create a fresh, isolated guest account and log in                        |
| POST   | `/auth/logout`                          | Clear the session                                                        |
| GET    | `/auth/me`                              | Current user, or 401                                                     |
| GET    | `/documents`                            | List the caller's documents                                              |
| POST   | `/documents`                            | Create a document (with optional initial line items)                     |
| GET    | `/documents/:id`                        | Get one document                                                         |
| PATCH  | `/documents/:id`                        | Update title/customer/issueDate (draft only)                             |
| DELETE | `/documents/:id`                        | Delete a document (draft only)                                           |
| POST   | `/documents/:id/line-items`             | Add a line item (draft only)                                             |
| PATCH  | `/documents/:id/line-items/:lineItemId` | Update a line item (draft only)                                          |
| DELETE | `/documents/:id/line-items/:lineItemId` | Delete a line item (draft only)                                          |
| POST   | `/documents/:id/finalize`               | Finalize a document                                                      |
| POST   | `/documents/:id/duplicate`              | Copy a document (any status) into a new draft                            |
| GET    | `/reports/summary?from=&to=`            | Document count + summed totals for finalized documents in the date range |

A document that doesn't exist **or** belongs to another user both return `404 Document not found` — identical responses, on purpose (see below).

## Assumptions & tradeoffs

- **Money as integer cents everywhere**, including API request/response bodies (Stripe-style) — not just internally. Keeps every layer, including the frontend's own display formatting, working off exact integers.
- **Fixed discount exceeding a line's subtotal is rejected (400), not clamped.** Clamping would silently change the number that was actually entered; rejecting surfaces what's likely a data-entry mistake immediately instead of quietly producing a different total than the user asked for.
- **404, not 403, for documents belonging to another user.** A caller who guesses another user's document ID gets the exact same response as a nonexistent ID — this prevents using the API to enumerate which document IDs exist for other accounts.
- **Report is scoped to finalized documents only.** Draft totals can still change at any time, so summing them into a report would make the report's numbers unstable/misleading; only locked-in numbers are counted.
- **Guest login creates a brand-new account per click**, rather than one shared seeded demo login. Two reviewers trying the app at the same time never see each other's data, and there's no seed script to run against a freshly deployed database — the account provisions itself on first click.
- **JWT in an httpOnly cookie**, payload is just `{ sub: userId }` — JWTs are signed, not encrypted, so nothing beyond an opaque ID belongs in one. Cookie `secure`/`sameSite` flags are gated on `NODE_ENV === "production"` (relaxed in dev, since frontend/backend are same-site-different-port on localhost; strict in production for a genuinely cross-origin deployment).
- **Printable view is browser-native print-to-PDF**, not a server-generated PDF file. Satisfies the stretch goal's "HTML or PDF output" without pulling in a heavy rendering dependency (e.g. headless Chromium), which would add real weight and cold-start cost on a free-tier host.
