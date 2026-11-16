-- SJ Home Interiors - schema v4
--
-- Applied automatically by the API on its first request after deploy
-- (server/schema.js). Kept here as the readable record; only run by hand
-- against a database that has not been upgraded yet:
--
--   npx wrangler d1 execute <your-database-name> --remote --file=migrations/0003_delivery_distance_messages.sql

-- Enquiries from the contact form and website feedback, shown in Admin -> Messages.
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'contact',     -- contact | feedback
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Delivery is now charged by distance and assembly is an optional extra.
-- (products.delivery_fee_pence keeps its name but now holds the product's ASSEMBLY fee.)
ALTER TABLE orders ADD COLUMN assembly_pence INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN distance_miles REAL DEFAULT NULL;
-- Existing orders count as already seen; new ones are inserted with 0.
ALTER TABLE orders ADD COLUMN admin_seen INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_orders_unseen ON orders(admin_seen) WHERE admin_seen = 0;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = 0;

INSERT INTO schema_meta (key, value) VALUES ('version', '4')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
