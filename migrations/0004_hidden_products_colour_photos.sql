-- SJ Home Interiors - schema v5
--
-- Applied automatically by the API on its first request after deploy
-- (server/schema.js). Kept here as the readable record; only run by hand
-- against a database that has not been upgraded yet:
--
--   npx wrangler d1 execute <your-database-name> --remote --file=migrations/0004_hidden_products_colour_photos.sql

-- 1 = hidden from the storefront, search and checkout; still listed in the admin.
ALTER TABLE products ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;

-- { "Grey": "/api/img/...", ... } - the first photo tagged with each colour,
-- so catalogue cards can switch photo when a colour swatch is picked.
-- (Each photo's colour tag is stored in variations_json.photoColors.)
ALTER TABLE products ADD COLUMN color_images_json TEXT NOT NULL DEFAULT '{}';

INSERT INTO schema_meta (key, value) VALUES ('version', '5')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
