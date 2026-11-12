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
| `JWT_SECRET`           | Secret used to sign auth tokens — use a long random value      |
| `MONGO_URI`            | MongoDB connection string. Required for durable production data |
| `GOOGLE_CLIENT_ID`     | Google Sign-In client ID (also expose it to the browser via `/api/config`) |
| `RAZORPAY_KEY_ID`      | Razorpay key ID (enables card payments)                        |
| `RAZORPAY_KEY_SECRET`  | Razorpay key secret (server-side only)                         |
| `ENABLE_BANKING_SIM`   | `true` enables local sandbox card payments (never in production) |
| `LOYALTY_EARN_RATE`    | ₹ spent per 1 KamiKoin (default `10`)                          |

### Storage behaviour

* **With a valid `MONGO_URI`** — users and orders are stored in MongoDB.
* **Without MongoDB (local dev)** — data is stored in `data/*.json`.
* **Without MongoDB on serverless (Vercel)** — the app falls back to a writable
  temporary directory (`/tmp/kamiwear-data`), then memory. This keeps the store
  usable, but accounts/orders will not survive a cold start. Set `MONGO_URI` in
  Vercel for real persistence.

## Payments

* **Cash on Delivery** and **UPI** work without any third-party account.
* **Card payments** use Razorpay when `RAZORPAY_KEY_ID` and
  `RAZORPAY_KEY_SECRET` are configured. The checkout opens Razorpay's hosted
  checkout and the server verifies the payment signature before creating the
  order.
* **Sandbox mode** (`ENABLE_BANKING_SIM=true`) accepts test cards locally only.

The server always recalculates the order total from the submitted line items;
the old silent "offline success" fallback has been removed, so failed payments
are reported honestly.

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
| POST   | `/api/orders/create`           | Place an order (auth)                |
| GET    | `/api/orders/history`          | Order history (auth)                 |
| POST   | `/api/orders/razorpay/create`  | Create a Razorpay order (auth)       |

## Images

All product, collection, trending, wishlist, and avatar imagery is bundled under
`public/assets/`. No image is hot-linked from Google/Stitch or DiceBear, so pages
render correctly on Vercel and other static hosts.

## Deployment

See [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md). The project uses
Vercel's zero-configuration Express support: `server.js` exports the app,
`public/` is served by Vercel's CDN, and `/api/*` is handled by the Express
function. `vercel.json` only adds cache headers.
