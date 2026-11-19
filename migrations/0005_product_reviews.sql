-- SJ Home Interiors - schema v6: reviews linked to products
--
-- Applied automatically by the API on its first request after deploy
-- (server/schema.js). Kept here as the readable record; only run by hand
-- against a database that has not been upgraded yet:
--
--   npx wrangler d1 execute <your-database-name> --remote --file=migrations/0005_product_reviews.sql
--
-- The existing `reviews` table is extended rather than replaced, so current reviews,
-- photos and replies are kept. Mapping to the fields in the brief:
--   id -> id, product_id -> product_id (new), author_name -> author, rating -> rating,
--   comment -> comment, verified_purchase -> verified (approved by the shop), created_at -> created_at

ALTER TABLE reviews ADD COLUMN product_id TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON reviews(product_id, created_at DESC) WHERE verified = 1;

-- Link older reviews (which only stored the product's name) to the matching product.
UPDATE reviews SET product_id = (
  SELECT id FROM products
  WHERE products.name = reviews.product_name AND deleted_at IS NULL
  LIMIT 1
)
WHERE product_id IS NULL AND product_name != '';

INSERT INTO schema_meta (key, value) VALUES ('version', '6')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
