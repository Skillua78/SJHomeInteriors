/**
 * Product data layer.
 *
 * Storage model
 *   products          one narrow row per product (no image bytes, no option lists)
 *   product_options   one row per priced option  (fabric / size / mattress / lift)
 *   media             uploaded photos, served from /api/img/<id>
 *
 * The storefront list only reads the summary columns it renders, a page at a
 * time, so cost is flat no matter how many SKUs exist. Full detail (gallery,
 * options, dimensions) is loaded per product when it is opened.
 */
import { HttpError, cleanText } from './http.js';
import { planImages, orphanOwnerMedia, reviveOwnerMedia } from './media.js';
import { OPTION_GROUPS, toPence, fromPence, resolveDeliveryFeePence } from '../shared/pricing.js';

const SUMMARY_COLUMNS = `id, name, price, previous_price, substr(description, 1, 240) AS description,
    category, subcategory, badge, stock, is_popular, is_trending, delivery, colors_json,
    image, image_count, fabric_count, size_count, option_count, dim_summary, delivery_fee_pence`;

const SORTS = {
    featured: 'created_at DESC, id',
    low: 'price ASC, id',
    high: 'price DESC, id',
};

function parseJson(text, fallback) {
    try {
        const value = text ? JSON.parse(text) : fallback;
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function displayImage(url) {
    // Legacy rows that have not been migrated yet still hold inline data; never ship those in a list.
    return typeof url === 'string' && !url.startsWith('data:') ? url : '';
}

export function mapSummary(row, defaultFeePence) {
    return {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        previousPrice: row.previous_price === null ? null : Number(row.previous_price),
        description: row.description || '',
        category: row.category,
        subcategory: row.subcategory || '',
        badge: row.badge || '',
        stock: row.stock === null ? null : Number(row.stock),
        isPopular: Boolean(row.is_popular),
        isTrending: Boolean(row.is_trending),
        delivery: row.delivery || '',
        colors: parseJson(row.colors_json, []),
        image: displayImage(row.image),
        imageCount: Number(row.image_count) || 0,
        fabricCount: Number(row.fabric_count) || 0,
        sizeCount: Number(row.size_count) || 0,
        hasOptions: Number(row.option_count) > 0,
        dimSummary: row.dim_summary || '',
        deliveryFee: fromPence(resolveDeliveryFeePence(row.delivery_fee_pence, defaultFeePence)),
    };
}

/* ---------- reads ---------- */

/**
 * Paginated, filtered listing.
 * params: { category, subcategory, q, sort, stock, limit, offset }
 */
export async function listProducts(env, params, defaultFeePence) {
    const where = ['deleted_at IS NULL'];
    const binds = [];

    if (params.category === 'Popular') where.push('is_popular = 1');
    else if (params.category === 'Trending') where.push('is_trending = 1');
    else if (params.category && params.category !== 'All') {
        where.push('category = ?');
        binds.push(params.category);
    }

    if (params.subcategory && params.subcategory !== 'All') {
        where.push('subcategory = ?');
        binds.push(params.subcategory);
    }

    if (params.stock === 'hidden') where.push('stock IS NULL');
    else if (params.stock === 'in_stock') where.push('stock > 0');
    else if (params.stock === 'out_of_stock') where.push('stock = 0');

    if (params.q) {
        const like = `%${params.q.replace(/[\\%_]/g, '\\$&')}%`;
        where.push(
            `(name LIKE ?1 ESCAPE '\\' OR category LIKE ?1 ESCAPE '\\' OR subcategory LIKE ?1 ESCAPE '\\'
              OR id LIKE ?1 ESCAPE '\\' OR description LIKE ?1 ESCAPE '\\')`.replaceAll(
                '?1',
                `?${binds.length + 1}`
            )
        );
        binds.push(like);
    }

    const order = SORTS[params.sort] || SORTS.featured;
    const whereSql = where.join(' AND ');
    const limit = params.limit;
    const offset = params.offset;

    const statements = [
        env.DB.prepare(
            `SELECT ${SUMMARY_COLUMNS} FROM products WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`
        ).bind(...binds, limit + 1, offset),
    ];
    // The total is only needed for the first page.
    if (offset === 0) {
        statements.push(
            env.DB.prepare(`SELECT COUNT(*) AS n FROM products WHERE ${whereSql}`).bind(...binds)
        );
    }

    const [page, count] = await env.DB.batch(statements);
    const rows = page.results || [];
    const hasMore = rows.length > limit;

    return {
        items: rows.slice(0, limit).map((r) => mapSummary(r, defaultFeePence)),
        nextOffset: hasMore ? offset + limit : null,
        total: count ? Number(count.results?.[0]?.n) || 0 : undefined,
    };
}

/** Category / subcategory counts for navigation (one grouped index scan). */
export async function loadFacets(env) {
    const [groups, covers] = await env.DB.batch([
        env.DB.prepare(
            `SELECT category, subcategory, COUNT(*) AS n,
                    SUM(is_popular) AS popular, SUM(is_trending) AS trending
             FROM products WHERE deleted_at IS NULL
             GROUP BY category, subcategory`
        ),
        env.DB.prepare(
            `SELECT category, image, MAX(created_at) AS newest
             FROM products
             WHERE deleted_at IS NULL AND image != '' AND substr(image, 1, 5) != 'data:'
             GROUP BY category`
        ),
    ]);

    const coverByCategory = new Map((covers.results || []).map((r) => [r.category, r.image]));
    const byCategory = new Map();
    let total = 0;
    let popular = 0;
    let trending = 0;

    for (const row of groups.results || []) {
        const name = (row.category || '').trim();
        if (!name) continue;
        const entry = byCategory.get(name) || {
            name,
            count: 0,
            image: coverByCategory.get(row.category) || '',
            subcategories: [],
        };
        entry.count += Number(row.n);
        if (row.subcategory) entry.subcategories.push({ name: row.subcategory, count: Number(row.n) });
        byCategory.set(name, entry);
        total += Number(row.n);
        popular += Number(row.popular) || 0;
        trending += Number(row.trending) || 0;
    }

    return { total, popular, trending, categories: [...byCategory.values()] };
}

export async function loadOptions(env, productIds) {
    if (productIds.length === 0) return new Map();
    const { results } = await env.DB.prepare(
        `SELECT product_id, grp, name, price_delta_pence FROM product_options
         WHERE product_id IN (${productIds.map(() => '?').join(',')})
         ORDER BY product_id, grp, position`
    )
        .bind(...productIds)
        .all();

    const map = new Map();
    for (const row of results || []) {
        const list = map.get(row.product_id) || [];
        list.push({ grp: row.grp, name: row.name, deltaPence: Number(row.price_delta_pence) });
        map.set(row.product_id, list);
    }
    return map;
}

/** Full product for the detail modal / admin editor. */
export async function getProduct(env, id, defaultFeePence) {
    const [productRes, optionRes] = await env.DB.batch([
        env.DB.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL').bind(id),
        env.DB.prepare(
            'SELECT grp, name, price_delta_pence FROM product_options WHERE product_id = ? ORDER BY grp, position'
        ).bind(id),
    ]);
    const row = productRes.results?.[0];
    if (!row) return null;

    const extras = parseJson(row.variations_json, {});
    const variations = {
        fabrics: [],
        sizes: [],
        mattresses: [],
        liftOptions: [],
        priceDeltas: { fabrics: {}, sizes: {}, mattresses: {}, liftOptions: {} },
        structuredDimensions: extras.structuredDimensions || undefined,
    };
    if (extras.assemblyText !== undefined) variations.assemblyText = extras.assemblyText;

    for (const opt of optionRes.results || []) {
        const group = OPTION_GROUPS.find((g) => g.key === opt.grp);
        if (!group) continue;
        variations[group.field].push(opt.name);
        if (opt.price_delta_pence) {
            variations.priceDeltas[group.field][opt.name] = fromPence(opt.price_delta_pence);
        }
    }

    const images = parseJson(row.images_json, []).map(displayImage).filter(Boolean);
    const summary = mapSummary({ ...row, description: row.description }, defaultFeePence);

    return {
        ...summary,
        description: row.description || '',
        images: images.length ? images : summary.image ? [summary.image] : [],
        dimensions: parseJson(row.dimensions_json, []),
        features: parseJson(row.features_json, []),
        deliveryFeeOverride:
            row.delivery_fee_pence === null ? null : fromPence(row.delivery_fee_pence),
        variations,
    };
}

/* ---------- validation ---------- */

function optionalStock(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : Math.min(1_000_000, Math.max(0, n));
}

function optionalMoney(raw, max = 1_000_000) {
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : null;
}

function stringArray(value, maxItems, maxLen) {
    if (!Array.isArray(value)) return [];
    const out = [];
    for (const item of value) {
        const clean = cleanText(item, maxLen);
        if (clean && !out.includes(clean)) out.push(clean);
        if (out.length >= maxItems) break;
    }
    return out;
}

function cleanDimension(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    return {
        length: cleanText(d.length, 60),
        width: cleanText(d.width, 60),
        depth: cleanText(d.depth, 60),
        custom: cleanText(d.custom, 200),
    };
}

export function slugId(name) {
    const slug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    const suffix = Math.floor(Math.random() * 46656)
        .toString(36)
        .padStart(3, '0');
    return `${slug || 'item'}-${suffix}`;
}

/** Validate an admin product payload into storable values. Throws HttpError(400). */
export function validateProduct(body) {
    const name = cleanText(body.name, 120);
    const price = Number(body.price);
    if (!name) throw new HttpError(400, 'A product title is required.');
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
        throw new HttpError(400, 'A valid base price is required.');
    }
    const category = cleanText(body.category, 60);
    if (!category) throw new HttpError(400, 'A category is required.');

    const v = body.variations && typeof body.variations === 'object' ? body.variations : {};
    const deltas = v.priceDeltas && typeof v.priceDeltas === 'object' ? v.priceDeltas : {};

    const options = [];
    for (const group of OPTION_GROUPS) {
        const groupDeltas =
            deltas[group.field] && typeof deltas[group.field] === 'object' ? deltas[group.field] : {};
        stringArray(v[group.field], 60, 80).forEach((optionName, position) => {
            const delta = Number(groupDeltas[optionName]);
            options.push({
                grp: group.key,
                name: optionName,
                deltaPence:
                    Number.isFinite(delta) && Math.abs(delta) <= 100_000 ? toPence(delta) : 0,
                position,
            });
        });
    }

    const rawDims = v.structuredDimensions && typeof v.structuredDimensions === 'object'
        ? v.structuredDimensions
        : {};
    const sizeNames = options.filter((o) => o.grp === 'size').map((o) => o.name);
    const bySize = {};
    for (const [sizeName, dim] of Object.entries(
        rawDims.bySize && typeof rawDims.bySize === 'object' ? rawDims.bySize : {}
    )) {
        if (sizeNames.includes(sizeName)) bySize[sizeName] = cleanDimension(dim);
    }
    const structuredDimensions = { default: cleanDimension(rawDims.default), bySize };

    const extras = { structuredDimensions };
    if (typeof v.assemblyText === 'string') extras.assemblyText = cleanText(v.assemblyText, 120);

    const dimensions = stringArray(body.dimensions, 10, 300);
    const def = structuredDimensions.default;
    const dimSummary =
        [
            def.length ? `L: ${def.length}` : '',
            def.width ? `W: ${def.width}` : '',
            def.depth ? `D: ${def.depth}` : '',
        ]
            .filter(Boolean)
            .join(' × ') ||
        dimensions[0] ||
        '';

    const deliveryFee = optionalMoney(body.deliveryFeeOverride, 2000);

    return {
        name,
        price: Math.round(price * 100) / 100,
        previousPrice: optionalMoney(body.previousPrice) || null,
        description: cleanText(body.description, 4000),
        category,
        subcategory: cleanText(body.subcategory, 60),
        badge: cleanText(body.badge, 40),
        stock: optionalStock(body.stock),
        isPopular: body.isPopular ? 1 : 0,
        isTrending: body.isTrending ? 1 : 0,
        delivery: cleanText(body.delivery, 60),
        colors: stringArray(body.colors, 60, 60),
        dimensions,
        features: stringArray(body.features, 30, 160),
        deliveryFeePence: deliveryFee === null ? null : toPence(deliveryFee),
        options,
        extras,
        dimSummary: dimSummary.slice(0, 200),
        imagesInput: Array.isArray(body.images) && body.images.length ? body.images : [body.image],
    };
}

/* ---------- writes ---------- */

function optionStatements(env, productId, options) {
    const statements = [
        env.DB.prepare('DELETE FROM product_options WHERE product_id = ?').bind(productId),
    ];
    for (const opt of options) {
        statements.push(
            env.DB.prepare(
                `INSERT INTO product_options (product_id, grp, name, price_delta_pence, position)
                 VALUES (?, ?, ?, ?, ?)`
            ).bind(productId, opt.grp, opt.name, opt.deltaPence, opt.position)
        );
    }
    return statements;
}

/** Insert or fully replace a product (one atomic batch). */
export async function saveProduct(env, id, p, { create }) {
    const { urls, statements } = await planImages(env, 'product', id, p.imagesInput, 10);

    const values = [
        p.name,
        p.price,
        p.previousPrice,
        p.description,
        p.category,
        p.subcategory,
        p.badge,
        p.stock,
        p.isPopular,
        p.isTrending,
        p.delivery,
        JSON.stringify(p.colors),
        urls[0] || '',
        JSON.stringify(urls),
        urls.length,
        JSON.stringify(p.dimensions),
        JSON.stringify(p.features),
        JSON.stringify(p.extras),
        p.deliveryFeePence,
        p.options.filter((o) => o.grp === 'fabric').length,
        p.options.filter((o) => o.grp === 'size').length,
        p.options.length,
        p.dimSummary,
    ];

    const upsert = create
        ? env.DB.prepare(
              `INSERT INTO products (
                 name, price, previous_price, description, category, subcategory, badge, stock,
                 is_popular, is_trending, delivery, colors_json, image, images_json, image_count,
                 dimensions_json, features_json, variations_json, delivery_fee_pence,
                 fabric_count, size_count, option_count, dim_summary, schema_v, id
               ) VALUES (${values.map(() => '?').join(',')}, 1, ?)`
          ).bind(...values, id)
        : env.DB.prepare(
              `UPDATE products SET
                 name = ?, price = ?, previous_price = ?, description = ?, category = ?,
                 subcategory = ?, badge = ?, stock = ?, is_popular = ?, is_trending = ?,
                 delivery = ?, colors_json = ?, image = ?, images_json = ?, image_count = ?,
                 dimensions_json = ?, features_json = ?, variations_json = ?, delivery_fee_pence = ?,
                 fabric_count = ?, size_count = ?, option_count = ?, dim_summary = ?,
                 schema_v = 1, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
          ).bind(...values, id);

    await env.DB.batch([...statements, upsert, ...optionStatements(env, id, p.options)]);
}

/** Soft delete so the admin "undo" can restore the product with its photos and options. */
export async function softDeleteProduct(env, id) {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.batch([
        env.DB.prepare('UPDATE products SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').bind(now, id),
        orphanOwnerMedia(env, 'product', id),
        // Permanently remove anything deleted more than a day ago.
        env.DB.prepare(
            `DELETE FROM product_options WHERE product_id IN
               (SELECT id FROM products WHERE deleted_at < ?)`
        ).bind(now - 86400),
        env.DB.prepare('DELETE FROM products WHERE deleted_at < ?').bind(now - 86400),
        env.DB.prepare('DELETE FROM media WHERE orphaned_at < ?').bind(now - 86400),
    ]);
}

export async function restoreProduct(env, id) {
    const [res] = await env.DB.batch([
        env.DB.prepare('UPDATE products SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL').bind(id),
        reviveOwnerMedia(env, 'product', id),
    ]);
    return (res.meta?.changes || 0) > 0;
}

/* ---------- one-off migration of rows written by the old code ---------- */

let legacyDone = false;

/**
 * Old rows keep their gallery (often megabytes of base64) and option lists in
 * JSON columns. Convert a few per request until none are left; each product
 * is converted in a single atomic batch, so this is safe to re-run.
 */
export async function migrateLegacyProducts(env, maxProducts = 6) {
    if (legacyDone) return;

    const { results: pending } = await env.DB.prepare(
        'SELECT id FROM products WHERE schema_v = 0 LIMIT ?'
    )
        .bind(maxProducts)
        .all();

    if (!pending || pending.length === 0) {
        legacyDone = true;
        return;
    }

    for (const { id } of pending) {
        const row = await env.DB.prepare(
            'SELECT image, images_json, variations_json, dimensions_json FROM products WHERE id = ?'
        )
            .bind(id)
            .first();
        if (!row) continue;

        const gallery = parseJson(row.images_json, []);
        const inputs = Array.isArray(gallery) && gallery.length ? gallery : [row.image];
        const { urls, statements } = await planImages(env, 'product', id, inputs, 10);

        const legacy = parseJson(row.variations_json, {});
        const parsed = validateProduct({
            name: 'x',
            price: 0,
            category: 'x',
            variations: legacy,
            dimensions: parseJson(row.dimensions_json, []),
        });

        statements.push(
            env.DB.prepare(
                `UPDATE products SET image = ?, images_json = ?, image_count = ?, variations_json = ?,
                   fabric_count = ?, size_count = ?, option_count = ?, dim_summary = ?, schema_v = 1
                 WHERE id = ?`
            ).bind(
                urls[0] || '',
                JSON.stringify(urls),
                urls.length,
                JSON.stringify(parsed.extras),
                parsed.options.filter((o) => o.grp === 'fabric').length,
                parsed.options.filter((o) => o.grp === 'size').length,
                parsed.options.length,
                parsed.dimSummary,
                id
            ),
            ...optionStatements(env, id, parsed.options)
        );
        await env.DB.batch(statements);
    }
}
