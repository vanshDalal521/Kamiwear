# Kamiwear

Anime streetwear e-commerce store. A static HTML/CSS/JS frontend is served by a
small Express API that handles authentication, orders, payments, and loyalty
points.

## Project structure

```
Kamiwear-main/
├── public/                 # Frontend (served as static files)
│   ├── *.html              # Home, shop, product, checkout, profile, collections…
│   ├── assets/
│   │   ├── brand/          # Logo, QR code, placeholder
│   │   ├── cdn/            # Product/collection imagery (downloaded locally)
│   │   ├── collections/    # Collection banners
│   │   ├── generated/      # Generated product artwork
│   │   ├── hoodies/        # Hoodie product images
│   │   ├── t-shirts/       # T-shirt product images
│   │   ├── accessories/    # Accessory product images
│   │   └── wallpapers/     # Background wallpapers
│   └── js/
│       ├── core/           # App bootstrap / interactions
│       ├── components/     # Cart drawer, search, profile modal, badges
│       └── store/          # API client + local state
├── config/                 # Database connection + catalog helpers
├── controllers/            # Route handlers (auth, orders)
├── middleware/             # JWT auth middleware
├── models/                 # MongoDB models with JSON/in-memory fallback
├── routes/                 # Express API routes
├── services/               # Transactional email (Resend/SMTP)
├── middleware/             # Auth, rate limiting, sanitization, CSRF origin guard
├── scripts/                # Index creation + original soundtrack generator
├── data/                   # Local development data (git-ignored)
├── docs/                   # Design system, screenshots, planning, deployment notes
├── server.js               # Express server entry point
├── vercel.json             # Vercel static + serverless configuration
└── package.json
```

## Getting started

```bash
npm install
cp .env.example .env        # then fill in your values
npm run dev                 # http://localhost:3000
```

Production:

```bash
npm start
```

## Environment variables

| Variable               | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `PORT`                 | Server port (default `3000`)                                   |
| `STORE_URL`            | Public store URL used in emails (no trailing slash)            |
| `JWT_SECRET`           | Signing secret, **32+ characters required in production**      |
| `AUTH_RETURN_TOKEN`    | `true` returns a JWT in the response body; keep `false` for browsers |
| `MONGO_URI`            | MongoDB connection string. Required for durable production data |
| `MONGO_MAX_POOL_SIZE`  | MongoDB connection pool size (default `50`)                    |
| `REQUIRE_MONGO`        | `true` refuses API traffic when MongoDB is not configured      |
| `GOOGLE_CLIENT_ID`     | Google Sign-In client ID                                       |
| `ALLOWED_ORIGINS`      | Extra comma-separated browser origins allowed to call the API  |
| `RATE_LIMIT_REDIS_URL` | Optional shared Redis store for rate limits across instances   |
| `ADMIN_API_KEY`        | Enables manual UPI verification endpoint (16+ characters)      |
| `UPI_ID`               | Receiving UPI ID (default `9253395564@ybl`)                    |
| `UPI_PAYEE_NAME`       | Payee name shown in the UPI deep link (default `Kamiwear`)     |
| `RESEND_API_KEY`       | Preferred transactional email provider (HTTPS, Vercel-safe)    |
| `SMTP_*`               | SMTP fallback (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) |
| `KAMIWEAR_EMAIL_FROM`  | Verified sender, e.g. `Kamiwear Orders <orders@kamiwear.in>`   |
| `KAMIWEAR_SUPPORT_EMAIL` | Reply-to/support address                                    |
| `LOYALTY_EARN_RATE`    | ₹ spent per 1 KamiKoin (default `10`)                          |

Generate secrets with `openssl rand -hex 32`. Never commit `.env`.

### Storage behaviour

* **With a valid `MONGO_URI`** — users and orders are stored in MongoDB.
* **Without MongoDB (local dev)** — data is stored in `data/*.json`.
* **Without MongoDB on serverless (Vercel)** — the app falls back to a writable
  temporary directory (`/tmp/kamiwear-data`), then memory. This keeps the store
  usable, but accounts/orders will not survive a cold start. Set `MONGO_URI` in
  Vercel for real persistence.

## Payments

Checkout intentionally supports exactly two methods:

* **Cash on Delivery** — the order is created immediately and the customer pays
  the delivery partner.
* **UPI** — the customer scans the Kamiwear QR
  (`public/assets/payments/kamiwear-upi-scanner.png`), pays to
  `9253395564@ybl`, and submits the UPI reference (UTR). The order is created as
  `Payment pending verification`; an admin verifies the UTR and marks it paid.

Server-side rules:

* Card/Razorpay support is removed. `CARD`, `RAZORPAY`, and any other method are
  rejected with `Only Cash on Delivery and UPI are accepted at checkout.`
* The server recalculates the total from the line items; client-supplied totals
  are ignored.
* Every checkout carries an idempotency key, so retries return the original
  order instead of creating a duplicate.
* Each UTR and transaction ID has a unique index, so one payment reference
  cannot be attached to two orders.
* Admin verification: `PATCH /api/orders/:id/verify-payment` with an
  `x-admin-key: $ADMIN_API_KEY` header. In production this is the point where
  you confirm the credit in your bank/UPI app.

Personal UPI has no automatic reconciliation or webhook. For fully automatic
verification and payment-scale guarantees you need a payment gateway.

## Email

Each order triggers a branded confirmation email containing the order number,
items, total, shipping address, payment method, UPI ID/UTR (for UPI), and the
current payment status. Delivery is attempted through Resend first, then SMTP.
Email failures are recorded on the order (`emailStatus`) and never cancel or
block a confirmed order. Configure `RESEND_API_KEY` and verify the sender domain
in Resend (or set SMTP credentials) before expecting delivery.

## Security

* JWT is stored in an `httpOnly`, `SameSite=Lax` cookie; `localStorage` never
  holds the session token.
* One active session per account: a new login rotates a server-side session ID,
  and the previous device receives `SESSION_REPLACED` on its next request.
* Helmet CSP, CORS allowlist, CSRF origin guard, request sanitization, strict
  JSON body limits, bcrypt cost 12, account lockout, and per-IP/per-account rate
  limiting are enabled by default.
* API responses are `Cache-Control: no-store`; HTML is always revalidated.
* Passwords, session internals, and login IPs are never serialized to clients.

See [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) for production
hardening and scale notes.

## API

| Method | Route                          | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/api/config`                  | Public runtime config (no secrets)   |
| GET    | `/api/health`                  | Health + database status             |
| POST   | `/api/auth/register`           | Create an account                    |
| POST   | `/api/auth/login`              | Sign in and receive a JWT            |
| POST   | `/api/auth/google`             | Google Sign-In                       |
| GET    | `/api/auth/me`                 | Current user (auth)                  |
| PUT    | `/api/auth/update-profile`     | Update profile (auth)                |
| POST   | `/api/auth/logout`             | Clear the session cookie (auth)      |
| POST   | `/api/orders/create`           | Place an order (auth, idempotent)    |
| GET    | `/api/orders/history`          | Order history (auth)                 |
| PATCH  | `/api/orders/:id/verify-payment` | Manually verify a UPI payment (`x-admin-key`) |

## Images

All product, collection, trending, wishlist, and avatar imagery is bundled under
`public/assets/`. No image is hot-linked from Google/Stitch or DiceBear, so pages
render correctly on Vercel and other static hosts.

## Media

Both demo videos use an original, fully owned anime/taiko-style instrumental
synthesized by `scripts/generate-soundtrack.js` (no copyrighted anime audio is
embedded). The encoded audio is already muxed into:

* `public/assets/video/kamiwear-anthem.mp4` (homepage anthem)
* `docs/demo/kamiwear-walkthrough.mp4` (product walkthrough)

Regenerate the score and remux with ffmpeg if you change the videos.

## Deployment

See [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md). The project deploys
as a static frontend from `public/` plus Vercel serverless functions in `api/`
that mount the Express app for `/api/*`. `server.js` still exports the app for
local development, and `vercel.json` only adds cache headers.
