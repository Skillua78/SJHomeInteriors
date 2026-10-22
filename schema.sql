CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  previous_price REAL DEFAULT NULL CHECK(previous_price IS NULL OR previous_price >= 0),
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  badge TEXT DEFAULT '',
  stock INTEGER DEFAULT NULL CHECK(stock IS NULL OR stock >= 0),
  is_popular INTEGER NOT NULL DEFAULT 0 CHECK(is_popular IN (0, 1)),
  is_trending INTEGER NOT NULL DEFAULT 0 CHECK(is_trending IN (0, 1)),
  delivery TEXT NOT NULL DEFAULT '',
  colors_json TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL,
  images_json TEXT NOT NULL DEFAULT '[]',
  dimensions_json TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  location TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  date TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  comment TEXT NOT NULL,
  images_json TEXT NOT NULL DEFAULT '[]',
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0, 1)),
  admin_response TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  delivery_method TEXT NOT NULL DEFAULT 'delivery',
  items_json TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_DISPATCH',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  password_hash TEXT,