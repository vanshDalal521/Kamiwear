# Kamiwear — Vercel Deployment Guide

The project is a static HTML/CSS/JS storefront in `public/` plus an Express API in
`server.js`. It deploys as **static files + Vercel serverless functions**:

- `server.js` exports the Express app (`module.exports = app`).
- `api/[...path].js`, `api/auth/[...path].js`, and `api/orders/[...path].js`
  re-export that app so Vercel routes `/api/*` there. The nested functions are
  required because a top-level catch-all only matches one path segment.
- `vercel.json` contains only cache headers — no `builds` or `routes`.
- Vercel serves everything in `public/` from its CDN, including
  `public/assets/**`. `express.static()` is only used for local development.
- API responses must be JSON. If `/api/health` returns HTML, the project is
  being served as a purely static site and the `api/` functions are missing.

Do not restore the old `builds`/`routes` configuration. It was the reason HTML
worked while `public/assets` images returned 404s in production.

## 1. Push the project

```bash
git init
git add .
git commit -m "Kamiwear store"
git remote add origin <your-repo-url>
git push -u origin main
```

`node_modules/`, `.env`, and `data/` are excluded from deployment by
`.vercelignore`. Never commit real secrets.

## 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the repository.
3. **Root Directory:** leave as the repository root (do not select
   `public/` or a legacy `structure/` folder).
4. Framework preset: **Other**.
5. Leave the build command and output directory empty.
6. Add the environment variables below.
7. Deploy.

If an older Vercel project still owns the `kamiwear.vercel.app` domain, move the
domain to the new project under **Project → Settings → Domains** and remove it
from the old project. A failed old project keeps serving its last successful
deployment, which can look like the push never happened.

Or with the CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for
Production (and Preview if you test preview URLs):

| Variable               | Required | Notes                                              |
| ---------------------- | -------- | -------------------------------------------------- |
| `JWT_SECRET`           | Yes      | 32+ random characters (`openssl rand -hex 32`)     |
| `MONGO_URI`            | Yes      | MongoDB Atlas connection string                    |
| `STORE_URL`            | Yes      | Public URL used in emails, e.g. `https://kamiwear.vercel.app` |
| `RESEND_API_KEY`       | For email | Resend API key (recommended on Vercel)            |
| `KAMIWEAR_EMAIL_FROM`  | For email | Verified sender, e.g. `Kamiwear Orders <orders@kamiwear.in>` |
| `KAMIWEAR_SUPPORT_EMAIL` | No     | Reply-to/support inbox (default `orders@kamiwear.in`) |
| `UPI_ID`               | No       | Defaults to `9253395564@ybl`                       |
| `UPI_PAYEE_NAME`       | No       | Defaults to `Kamiwear`                             |
| `ADMIN_API_KEY`        | For UPI verification | 16+ characters; enables `PATCH /api/orders/:id/verify-payment` |
| `ALLOWED_ORIGINS`      | No       | Extra comma-separated browser origins              |
| `RATE_LIMIT_REDIS_URL` | Recommended at scale | Shared rate-limit store (Upstash/Redis) |
| `GOOGLE_CLIENT_ID`     | No       | Overrides the built-in public Google client ID     |
| `AUTH_RETURN_TOKEN`    | No       | Keep `false`; sessions use httpOnly cookies        |
| `REQUIRE_MONGO`        | Recommended | `true` refuses API traffic if MongoDB is missing |
| `LOYALTY_EARN_RATE`    | No       | Defaults to `10`                                   |

`.env` is **not** deployed. On Vercel, environment variables are injected by the
platform and read through `process.env`. Client IDs are public; secrets
(`JWT_SECRET`, `RESEND_API_KEY`, `ADMIN_API_KEY`, Mongo password) must stay in
Vercel only. Rotate any secret that was ever committed to Git history.

### MongoDB (required for persistent accounts/orders)

Vercel's filesystem is read-only and ephemeral. Without MongoDB the app falls
back to `/tmp` (and then memory) so the UI keeps working, but accounts and
orders disappear when the function instance is recycled. Create a free MongoDB
Atlas cluster, allow Vercel's IPs (`0.0.0.0/0` for simplicity), and set
`MONGO_URI`:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/kamiwear
```

Check `GET /api/health` after deploying — `database.connected` should be `true`
and `storage` should be `mongodb`.

Create the correctness indexes (unique email, idempotency key, UTR, transaction
ID) once against the production database:

```bash
MONGO_URI="mongodb+srv://..." npm run db:indexes
```

The server also creates them lazily on the first database-backed request, but
running the script makes migration failures visible immediately.

### Google Sign-In

Google sign-in is disabled by default. The UI shows a short placeholder instead
of a broken button when no client ID is configured. To enable it:

1. In Google Cloud Console → APIs & Services → Credentials, create an OAuth
   2.0 Client ID of type **Web application**.
2. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-project.vercel.app`
   - your custom domain, if any
3. Set `GOOGLE_CLIENT_ID` in Vercel (and in local `.env` for local testing).
4. Redeploy.

The frontend loads the ID from `/api/config`. If the button reports that Google
is unavailable, the deployed domain is almost always missing from **Authorized
JavaScript origins** for that client ID.

### Email (order confirmations)

Resend is recommended because it works over HTTPS on serverless functions. SMTP
is supported as a fallback.

1. Create a Resend account and add/verify your sending domain (DNS records).
2. Create an API key and set `RESEND_API_KEY` in Vercel.
3. Set `KAMIWEAR_EMAIL_FROM` to an address on the verified domain, e.g.
   `Kamiwear Orders <orders@kamiwear.in>`.
4. Set `KAMIWEAR_SUPPORT_EMAIL` and `STORE_URL`.
5. Redeploy and place a test order. The response includes
   `email.status` (`sent`, `failed`, `not_configured`), and the confirmation page
   shows the result.

If you prefer SMTP, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
optionally `SMTP_SECURE=true`. Some hosts block outbound SMTP; Resend avoids
that. If the sender domain is not verified, the provider rejects the message and
the order still succeeds with `emailStatus: failed`.

### Payments: COD + UPI only

The store deliberately accepts only **Cash on Delivery** and **UPI**. Card and
Razorpay code paths have been removed. Checkout shows the uploaded QR
(`public/assets/payments/kamiwear-upi-scanner.png`), the UPI ID
`9253395564@ybl`, a copy button, and a `upi://pay` deep link with the order
amount.

For UPI:

1. The customer pays from any UPI app and enters the UTR/reference.
2. The order is stored with `paymentStatus: pending_verification`. UTRs are
   unique, so the same reference cannot be submitted twice.
3. Verify the credit in your bank/UPI app, then call:

   ```bash
   curl -X PATCH \
     -H "x-admin-key: $ADMIN_API_KEY" \
     https://your-domain/api/orders/<order-id>/verify-payment
   ```

   This marks the order paid and emails the customer a payment-verified
   confirmation. Without `ADMIN_API_KEY` the endpoint returns 404.

A personal UPI ID has no webhook or automatic reconciliation, so verification
is manual by design. If you need automatic payment confirmation, use a payment
gateway with server-side webhooks; do not trust a client-supplied "paid" flag.

### Security and sessions

* `JWT_SECRET` is required in production. The server refuses to fall back to a
  development secret when `NODE_ENV=production` or `VERCEL` is set.
* Sessions use an `httpOnly`, `Secure`, `SameSite=Lax` cookie. JWTs are not
  stored in `localStorage`.
* One active session per account. A new login rotates `activeSessionId` and
  `sessionVersion`; older devices get `SESSION_REPLACED` and must sign in again.
* Login failures return a generic message, use bcrypt cost 12, and lock the
  account for 15 minutes after 10 failures.
* Helmet CSP, a CORS allowlist, a CSRF origin guard, request sanitization,
  `no-store` API caching, and per-IP/per-account rate limits are enabled.
* Set `RATE_LIMIT_REDIS_URL` when running multiple instances so rate limits are
  shared rather than per-instance.

### Scale (10k–200k concurrent users)

The code is hardened for concurrency (atomic loyalty updates, unique indexes,
idempotent orders, connection pooling, compression), but no application can
guarantee 200k concurrent checkouts on a personal UPI ID. For that level:

1. Use MongoDB Atlas (M10+) with indexes created via `npm run db:indexes`.
2. Use Redis/Upstash for shared rate limits and session/cache data.
3. Use a real payment gateway with webhooks for automatic reconciliation.
4. Serve static assets from the Vercel CDN (already configured) and keep API
   functions in a region close to MongoDB.
5. Load test with k6/Artillery against staging, watch p95 latency, Mongo
   connection saturation, and provider rate limits.
6. Keep `REQUIRE_MONGO=true` in production so a misconfigured deployment fails
   loudly instead of losing orders to ephemeral storage.

## 4. Routes

| Request        | Handled by                                      |
| -------------- | ----------------------------------------------- |
| `/`            | `public/index.html` (Vercel CDN)                |
| `/shop.html`   | `public/shop.html` (Vercel CDN)                 |
| `/assets/*`    | `public/assets/*` (Vercel CDN, cache headers)   |
| `/js/*`        | `public/js/*` (Vercel CDN)                      |
| `/api/*`       | `server.js` Express function                    |

## 5. Troubleshooting

* **Images not showing** — confirm the deployment includes `public/` (it is not
  excluded) and that the request path is `/assets/...`. All imagery is local
  under `public/assets/`; filenames are lowercase-kebab-case to avoid Linux case
  issues. `js/core/assets.js` swaps any missing image for the local placeholder
  instead of showing a broken icon.
* **API returns 404** — Vercel must detect `server.js` as the Express entry
  point. Do not add `builds`/`routes` to `vercel.json`; check that `server.js`
  exports the app.
* **Accounts/orders disappear after a while** — `MONGO_URI` is missing or
  invalid. Check `/api/health` → `database`.
* **Google button says "not configured"** — `/api/config` did not return a
  client ID. Set `GOOGLE_CLIENT_ID` or use the built-in fallback.
* **Google sign-in fails after the button renders** — add the exact deployed
  origin (scheme + host, no trailing slash) under Authorized JavaScript origins.
* **Order confirmation email not delivered** — check `/api/health` →
  `email.configured`. Verify the sender domain in Resend, and inspect
  `emailStatus`/`emailLastError` on the order. Orders are never blocked by email
  failures.
* **UPI verification endpoint returns 404** — `ADMIN_API_KEY` is missing or
  shorter than 16 characters.
* **SESSION_REPLACED after signing in** — another device signed in with the same
  account. This is intentional: only one session is active per account.
* **Stale JS after a deploy** — JS includes use `?v=6` cache busters. Clear the
  Vercel build cache or hard-refresh the browser if an old bundle is still
  served.
