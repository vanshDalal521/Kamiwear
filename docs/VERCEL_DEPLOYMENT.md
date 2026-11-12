# Kamiwear — Vercel Deployment Guide

The project is a static HTML/CSS/JS storefront in `public/` plus an Express API in
`server.js`. It deploys with **Vercel's zero-configuration Express support**:

- `server.js` exports the Express app (`module.exports = app`) and is listed as
  `main` in `package.json`.
- `vercel.json` contains only cache headers — no `builds` or `routes`.
- Vercel runs the Express app as one Fluid function for `/api/*`.
- Vercel serves everything in `public/` from its CDN, including
  `public/assets/**`. `express.static()` is only used for local development;
  Vercel ignores it on purpose.

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
3. Framework preset: **Other** (Vercel auto-detects Express).
4. Leave the build command and output directory empty.
5. Add the environment variables below.
6. Deploy.

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
| `JWT_SECRET`           | Yes      | Long random string (`openssl rand -hex 32`)        |
| `MONGO_URI`            | Yes      | MongoDB Atlas connection string                    |
| `GOOGLE_CLIENT_ID`     | No       | Overrides the built-in public Google client ID     |
| `RAZORPAY_KEY_ID`      | For cards | Razorpay dashboard key ID                         |
| `RAZORPAY_KEY_SECRET`  | For cards | Razorpay dashboard key secret                     |
| `ENABLE_BANKING_SIM`   | No       | Keep `false` in production                         |
| `LOYALTY_EARN_RATE`    | No       | Defaults to `10`                                   |

`.env` is **not** deployed. On Vercel, environment variables are injected by the
platform and read through `process.env`. Client IDs (Google/Razorpay key ID) are
public; secrets (`JWT_SECRET`, `RAZORPAY_KEY_SECRET`, Mongo password) must stay
in Vercel only.

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

### Google Sign-In

The app ships a working public Google client ID as a fallback, so login works
without adding an environment variable. To use your own client:

1. In Google Cloud Console → APIs & Services → Credentials, create an OAuth
   2.0 Client ID of type **Web application**.
2. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-project.vercel.app`
   - your custom domain, if any
3. Optionally set `GOOGLE_CLIENT_ID` in Vercel to override the fallback.
4. Redeploy.

The frontend loads the ID from `/api/config`. If the button reports that Google
is unavailable, the deployed domain is almost always missing from **Authorized
JavaScript origins** for that client ID.

### Razorpay card payments

1. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel.
2. Redeploy. `/api/config` will advertise card payments and checkout will show
   the Razorpay option.
3. Clicking **PAY SECURELY WITH RAZORPAY** (or **COMPLETE MISSION** with the
   card method selected) creates a Razorpay order and opens hosted checkout.
4. The server verifies the payment signature, verifies the Razorpay order amount
   and owner, and rejects replayed payments before creating the order.

Without Razorpay, Cash on Delivery and UPI remain available. Keep
`ENABLE_BANKING_SIM=false` in production; it only enables local test-card
simulation.

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
* **Card option missing** — Razorpay keys are not set; COD/UPI still work.
* **Stale JS after a deploy** — JS includes use `?v=4` cache busters. Clear the
  Vercel build cache or hard-refresh the browser if an old bundle is still
  served.
