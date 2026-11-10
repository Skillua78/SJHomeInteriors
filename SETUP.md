# SJ Home Interiors – setup & deployment notes

React + Vite storefront on Cloudflare Pages, with Pages Functions (`/functions`) backed by D1.

## 1. Secrets to set in Cloudflare (required before going live)

Cloudflare dashboard → Workers & Pages → your project → Settings → Variables and Secrets.
Add each as a **Secret**, for Production (and Preview if you use it), then redeploy.

| Name | What it is |
| --- | --- |
| `JWT_SECRET` | Long random string (32+ characters). Signs login sessions. |
| `ADMIN_PASSWORD_HASH` | Run `npm run hash-password` and paste the output. |
| `STRIPE_SECRET_KEY` | From Stripe → Developers → API keys. Use `sk_test_…` first. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the webhook endpoint you create in step 2. |
| `GOOGLE_CLIENT_ID` | Same value as `VITE_GOOGLE_CLIENT_ID`. Google sign-in stays off until this is set. |
| `ADMIN_EMAIL` | Optional. Defaults to `info@sjhomeinteriors.co.uk`. |

The D1 binding must be called `DB` (unchanged).

**Rotate `ADMIN_API_KEY`.** Older versions of the site sent this key to the admin's browser and
kept it in localStorage, so treat the current value as exposed. Once `JWT_SECRET` and
`ADMIN_PASSWORD_HASH` are set it is no longer used and can be deleted.

## 2. Stripe + Klarna

Card and Klarna both run through Stripe Checkout (Stripe hosts the payment page).

1. Stripe dashboard → Settings → Payment methods → enable **Klarna** (and cards).
2. Developers → Webhooks → Add endpoint: `https://sjhomeinteriors.co.uk/api/stripe-webhook`
   with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`.
3. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Test with `sk_test_…` keys and Stripe's test cards / Klarna test flow, then switch to live keys.

Until the Stripe secrets exist the checkout simply does not offer card or Klarna.

## 3. Database

Nothing to run by hand. On the first request after deploy the API upgrades the schema
(`server/schema.js`) and then converts existing products a few at a time: photos stored inside
product rows move to the `media` table and option lists move to `product_options`.
The same changes are written out in `migrations/0002_catalogue_orders_security.sql`.

Take a backup first: `npx wrangler d1 export <database-name> --remote --output=backup.sql`

## 4. Delivery & assembly charges

- Standard fee: Admin → Settings → Delivery & assembly (default £50 per order).
- Per product: Admin → Products → Essentials → "Delivery & assembly (£)". Blank = standard, 0 = free.
- Charged once per order: extra items do not add to it. If items have different fees the order
  pays the highest one. Never charged for showroom collection.

## 5. Local development

```
npm install
npm run dev        # storefront only, with the bundled demo catalogue
npm run dev:cf     # full stack: Pages Functions + a local D1 (copy .dev.vars.example to .dev.vars)
npm test           # unit tests
```

## 6. Where things live

```
functions/api/      HTTP endpoints (thin)
server/             auth, rate limiting, schema, products, orders, Stripe, settings
shared/pricing.js   price rules used by both the browser and the API
src/hooks/          useCatalog (paginated catalogue), useCart
src/components/
  product/          product quick-view (gallery, options, swatches, dimensions)
  checkout/         basket, checkout form, payment picker, confirmation, Stripe return
  admin/            dashboard shell + products/, orders/, reviews/, settings/
tests/              vitest unit tests
```
