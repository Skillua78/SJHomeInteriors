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

All set in Admin → Settings → Delivery & assembly.

- **Delivery** is free within a radius of the showroom (default 10 miles) and a flat charge beyond
  it (default £50). Showroom collection is always free.
- Distance is the straight-line distance from the showroom postcode to the customer's postcode,
  looked up with postcodes.io (a free UK postcode service; only the postcode is sent). If that
  service is unreachable the order is not charged for delivery and shows "distance not checked"
  in Admin → Orders so you can confirm by phone.
- **Assembly** is optional: the customer ticks "Add assembly" at checkout. One charge per order
  (default £50). A product can have its own assembly fee (Products → Essentials → "Assembly fee");
  an order pays the highest fee among its items, and 0 means that product needs no assembly.

## 4b. Messages and notifications

- The contact form and the "Leave feedback" bar save to Admin → Messages.
- The Admin button shows a count of new orders, unread messages and reviews awaiting moderation;
  each dashboard tab shows its own count. Opening Orders clears the new-order count.
- These are on-site notifications only. Nothing is emailed to you yet; that needs an email
  sending service to be chosen and connected.

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

## 7. Hiding products, colour photos and sales history

- **Hide a product** (Products → Edit → Essentials → "Hide from the website", or the
  "Hide from site" button in the inventory list). Hidden products disappear from the catalogue,
  search, category counts and checkout, but stay in the admin. Filter the inventory by
  "Hidden from website" to find them.
- **Colour photos**: in Products → Edit → Photos, choose the colour each photo shows. On the
  website, picking that colour on the product card or in the product view switches to its photo.
- **Sales history**: Orders shows order count, order value, items sold and best sellers for 7 days,
  30 days, 90 days, 12 months or all time. Orders still waiting for card/Klarna payment and
  cancelled orders are not counted.
- **Deleting an order** is permanent and does not refund anything in Stripe. Setting the status to
  "Cancelled" keeps the record instead (useful for HMRC record keeping).

## 8. Import and export (JSON)

- **AI import**: "Copy AI prompt" asks the AI to rewrite each description (2–3 sentences, facts from
  your notes only) and to estimate a price when the notes have none (`"priceIsEstimate": true`).
- **Estimated or missing prices** are imported hidden and marked "Price to check". The product
  cannot go on the website until you open it, set the real price and press "Price is correct".
- **Export**: "Export all (JSON)" in the inventory list downloads every product; "Export JSON" in the
  editor downloads the one you are editing. Edit the file and import it again: products keep their
  `id`, so they are updated rather than duplicated. Remove an `id` to create a new product instead.

## 9. Storefront extras (promotion, reviews, compare, WhatsApp)

- **Promotion banner**: Settings → Promotion banner. Turn it on, write the headline, set the real
  end date and, if you like, an "Up to … % off" figure. The countdown runs to that date and the
  banner hides itself when it passes. The percentage is only text in the banner: actual reductions
  come from each product's "Was" price, which also shows the "Sale" and "Save £X" labels on cards.
  UK consumer law (CMA guidance) treats fake or resetting countdowns as misleading, so only use
  dates the offer really ends.
- **Product reviews**: customers can review a product from its product view (or from the reviews
  section on the home page). Every review waits in Reviews until you press "Verify & publish";
  only published reviews count towards the stars on cards. The database change is
  `migrations/0005_product_reviews.sql`. It is applied automatically on the first request after
  deploying, or you can run it by hand:
  `npx wrangler d1 execute <your-database-name> --remote --file=migrations/0005_product_reviews.sql`
- **Compare**: shoppers tick "Compare" on up to 4 cards and open a side-by-side table. Nothing is
  stored on the server.
- **WhatsApp**: the green button opens a chat with the WhatsApp number in Settings (or the shop
  phone number if that is empty). "Ask about this on WhatsApp" in the product view fills in the
  product, chosen options and price.
- **Similar products** in the product view come from the same subcategory, then the same category,
  and never include hidden products.
- The home page's delivery & assembly tile has been replaced by the trust bar, so its settings were
  removed. Its wording now comes from your delivery radius and payment options.
