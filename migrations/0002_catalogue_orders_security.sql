-- SJ Home Interiors - schema v3
--
-- You do NOT normally need to run this by hand: the API applies the same
-- changes automatically the first time it runs (see server/schema.js) and
-- then converts old product rows in the background (server/products.js).
-- It is kept here as the readable record of what changed, and for anyone who
-- prefers to apply it explicitly:
--
--   npx wrangler d1 execute <your-database-name> --remote --file=migrations/0002_catalogue_orders_security.sql
--
-- ALTER TABLE ... ADD COLUMN fails if the column already exists, so only run
-- this once against a database that has not been upgraded yet.

CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- One row per priced option instead of option lists inside a JSON blob.
CREATE TABLE IF NOT EXISTS product_options (
  product_id TEXT NOT NULL,
  grp TEXT NOT NULL,                       -- fabric | size | mattress | lift
  name TEXT NOT NULL,
  price_delta_pence INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, grp, name)
) WITHOUT ROWID;

-- Uploaded photos, one per row, served from /api/img/<id>.
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,                -- product | review | site
  owner_id TEXT NOT NULL,
  orphaned_at INTEGER DEFAULT NULL,
  mime TEXT NOT NULL,
  data TEXT NOT NULL                       -- base64
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  settings_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN delivery_fee_pence INTEGER DEFAULT NULL;   -- NULL = site default (GBP 50)
ALTER TABLE products ADD COLUMN image_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN fabric_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN size_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN option_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN dim_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN deleted_at INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN schema_v INTEGER NOT NULL DEFAULT 0;       -- 0 = not yet converted

ALTER TABLE reviews ADD COLUMN schema_v INTEGER NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN user_id TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN subtotal_pence INTEGER DEFAULT NULL;
ALTER TABLE orders ADD COLUMN delivery_pence INTEGER DEFAULT NULL;
ALTER TABLE orders ADD COLUMN total_pence INTEGER DEFAULT NULL;
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN stripe_session_id TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN stripe_payment_intent TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN stock_committed INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN updated_at TEXT DEFAULT NULL;

DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_popular;
DROP INDEX IF EXISTS idx_reviews_verified;

CREATE INDEX IF NOT EXISTS idx_products_live_created ON products(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_live_category ON products(category, subcategory, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_live_price ON products(price) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_live_popular ON products(created_at DESC) WHERE is_popular = 1 AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_live_trending ON products(created_at DESC) WHERE is_trending = 1 AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_legacy ON products(schema_v) WHERE schema_v = 0;
CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_orphaned ON media(orphaned_at) WHERE orphaned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(created_at DESC) WHERE verified = 1;
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_id) WHERE google_id IS NOT NULL;

INSERT INTO schema_meta (key, value) VALUES ('version', '3')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
