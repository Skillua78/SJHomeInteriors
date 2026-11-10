/**
 * Idempotent schema bootstrap / upgrade.
 *
 * Runs at most once per Worker isolate and costs a single indexed read once
 * the database is up to date (it replaces the old pattern of issuing an
 * ALTER TABLE on every request). The same DDL lives in /schema.sql and
 * /migrations for anyone who prefers to apply it with wrangler.
 */

export const SCHEMA_VERSION = 3;

const TABLES = [
    `CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,

    `CREATE TABLE IF NOT EXISTS products (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       price REAL NOT NULL CHECK(price >= 0),
       previous_price REAL DEFAULT NULL,
       description TEXT DEFAULT '',
       category TEXT NOT NULL,
       subcategory TEXT NOT NULL DEFAULT '',
       badge TEXT DEFAULT '',
       stock INTEGER DEFAULT NULL,
       is_popular INTEGER NOT NULL DEFAULT 0,
       is_trending INTEGER NOT NULL DEFAULT 0,
       delivery TEXT NOT NULL DEFAULT '',
       colors_json TEXT NOT NULL DEFAULT '[]',
       image TEXT NOT NULL DEFAULT '',
       images_json TEXT NOT NULL DEFAULT '[]',
       dimensions_json TEXT NOT NULL DEFAULT '[]',
       features_json TEXT NOT NULL DEFAULT '[]',
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,

    `CREATE TABLE IF NOT EXISTS product_options (
       product_id TEXT NOT NULL,
       grp TEXT NOT NULL,
       name TEXT NOT NULL,
       price_delta_pence INTEGER NOT NULL DEFAULT 0,
       position INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (product_id, grp, name)
     ) WITHOUT ROWID`,

    `CREATE TABLE IF NOT EXISTS media (
       id TEXT PRIMARY KEY,
       owner_type TEXT NOT NULL,
       owner_id TEXT NOT NULL,
       orphaned_at INTEGER DEFAULT NULL,
       mime TEXT NOT NULL,
       data TEXT NOT NULL
     )`,

    `CREATE TABLE IF NOT EXISTS reviews (
       id TEXT PRIMARY KEY,
       author TEXT NOT NULL,
       location TEXT DEFAULT '',
       rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
       date TEXT NOT NULL,
       product_name TEXT DEFAULT '',
       comment TEXT NOT NULL,
       images_json TEXT NOT NULL DEFAULT '[]',
       verified INTEGER NOT NULL DEFAULT 0,
       admin_response TEXT DEFAULT '',
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,

    `CREATE TABLE IF NOT EXISTS orders (
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
     )`,

    `CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT NOT NULL UNIQUE,
       phone TEXT DEFAULT '',
       password_hash TEXT,
       salt TEXT,
       google_id TEXT,
       role TEXT NOT NULL DEFAULT 'customer',
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,

    `CREATE TABLE IF NOT EXISTS site_settings (
       id INTEGER PRIMARY KEY CHECK (id = 1),
       settings_json TEXT NOT NULL,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,

    `CREATE TABLE IF NOT EXISTS rate_limits (
       key TEXT PRIMARY KEY,
       window_start INTEGER NOT NULL,
       count INTEGER NOT NULL
     ) WITHOUT ROWID`,
];

// Columns added after the original release. ALTER TABLE only runs when missing.
const COLUMNS = {
    products: {
        variations_json: "TEXT NOT NULL DEFAULT '{}'",
        delivery_fee_pence: 'INTEGER DEFAULT NULL',
        image_count: 'INTEGER NOT NULL DEFAULT 0',
        fabric_count: 'INTEGER NOT NULL DEFAULT 0',
        size_count: 'INTEGER NOT NULL DEFAULT 0',
        option_count: 'INTEGER NOT NULL DEFAULT 0',
        dim_summary: "TEXT NOT NULL DEFAULT ''",
        deleted_at: 'INTEGER DEFAULT NULL',
        schema_v: 'INTEGER NOT NULL DEFAULT 0',
    },
    reviews: {
        schema_v: 'INTEGER NOT NULL DEFAULT 0',
    },
    orders: {
        user_id: 'TEXT DEFAULT NULL',
        subtotal_pence: 'INTEGER DEFAULT NULL',
        delivery_pence: 'INTEGER DEFAULT NULL',
        total_pence: 'INTEGER DEFAULT NULL',
        payment_method: "TEXT NOT NULL DEFAULT 'cod'",
        payment_status: "TEXT NOT NULL DEFAULT 'unpaid'",
        stripe_session_id: 'TEXT DEFAULT NULL',
        stripe_payment_intent: 'TEXT DEFAULT NULL',
        stock_committed: 'INTEGER NOT NULL DEFAULT 1',
        updated_at: 'TEXT DEFAULT NULL',
    },
};

const INDEXES = [
    // Storefront listing: newest first, optionally inside one category.
    `CREATE INDEX IF NOT EXISTS idx_products_live_created ON products(created_at DESC) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_live_category ON products(category, subcategory, created_at DESC) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_live_price ON products(price) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_live_popular ON products(created_at DESC) WHERE is_popular = 1 AND deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_live_trending ON products(created_at DESC) WHERE is_trending = 1 AND deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_legacy ON products(schema_v) WHERE schema_v = 0`,
    `CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_type, owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_media_orphaned ON media(orphaned_at) WHERE orphaned_at IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(created_at DESC) WHERE verified = 1`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_id) WHERE google_id IS NOT NULL`,
];

// Superseded by the partial indexes above.
const DROP_INDEXES = [
    'DROP INDEX IF EXISTS idx_products_category',
    'DROP INDEX IF EXISTS idx_products_popular',
    'DROP INDEX IF EXISTS idx_reviews_verified',
];

let ready = null;

export function ensureSchema(env) {
    if (!ready) {
        ready = upgrade(env).catch((err) => {
            ready = null;
            throw err;
        });
    }
    return ready;
}

async function currentVersion(env) {
    try {
        const row = await env.DB.prepare("SELECT value FROM schema_meta WHERE key = 'version'").first();
        return Number(row?.value) || 0;
    } catch {
        return 0; // schema_meta does not exist yet
    }
}

async function upgrade(env) {
    if ((await currentVersion(env)) >= SCHEMA_VERSION) return;

    await env.DB.batch(TABLES.map((sql) => env.DB.prepare(sql)));

    for (const [table, columns] of Object.entries(COLUMNS)) {
        const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
        const existing = new Set((results || []).map((r) => r.name));
        for (const [name, ddl] of Object.entries(columns)) {
            if (!existing.has(name)) {
                await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl}`).run();
            }
        }
    }

    await env.DB.batch([...DROP_INDEXES, ...INDEXES].map((sql) => env.DB.prepare(sql)));

    await env.DB.prepare(
        `INSERT INTO schema_meta (key, value) VALUES ('version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
        .bind(String(SCHEMA_VERSION))
        .run();
}
