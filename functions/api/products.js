/**
 * /api/products
 *   GET     public   paginated summaries: ?category=&subcategory=&q=&sort=&stock=&limit=&offset=
 *   POST    admin    create            (?action=restore&id= undoes a delete)
 *   PUT     admin    replace a product, or { id, stockOnly, stock }
 *   DELETE  admin    soft delete ?id=
 */
import { HttpError, json, readJson, cleanText, intParam } from '../../server/http.js';
import { requireAdmin } from '../../server/auth.js';
import { loadSettings, deliveryFeePence } from '../../server/settings.js';
import {
    listProducts,
    migrateLegacyProducts,
    validateProduct,
    saveProduct,
    softDeleteProduct,
    restoreProduct,
    slugId,
} from '../../server/products.js';

// Product payloads may carry up to 10 freshly uploaded (client-compressed) photos.
const MAX_PRODUCT_BODY = 16 * 1024 * 1024;

export async function onRequestGet({ request, env }) {
    const q = new URL(request.url).searchParams;

    await migrateLegacyProducts(env);
    const settings = await loadSettings(env);

    const result = await listProducts(
        env,
        {
            category: cleanText(q.get('category'), 60),
            subcategory: cleanText(q.get('subcategory'), 60),
            q: cleanText(q.get('q'), 80),
            sort: cleanText(q.get('sort'), 12),
            stock: cleanText(q.get('stock'), 16),
            limit: intParam(q.get('limit'), 24, 1, 60),
            offset: intParam(q.get('offset'), 0, 0, 100000),
        },
        deliveryFeePence(settings)
    );
    return json(result, 200, { 'Cache-Control': 'public, max-age=20' });
}

export async function onRequestPost({ request, env }) {
    await requireAdmin(request, env);
    const url = new URL(request.url);

    if (url.searchParams.get('action') === 'restore') {
        const id = cleanText(url.searchParams.get('id'), 100);
        if (!(await restoreProduct(env, id))) throw new HttpError(404, 'Nothing to restore.');
        return json({ success: true, id });
    }

    const product = validateProduct(await readJson(request, MAX_PRODUCT_BODY));
    const id = slugId(product.name);
    await saveProduct(env, id, product, { create: true });
    return json({ success: true, id }, 201);
}

export async function onRequestPut({ request, env }) {
    await requireAdmin(request, env);
    const body = await readJson(request, MAX_PRODUCT_BODY);
    const id = cleanText(body.id, 100);
    if (!id) throw new HttpError(400, 'Product ID required.');

    const exists = await env.DB.prepare('SELECT 1 FROM products WHERE id = ? AND deleted_at IS NULL')
        .bind(id)
        .first();
    if (!exists) throw new HttpError(404, 'Product not found.');

    if (body.stockOnly) {
        let stock = null;
        if (body.stock !== null && body.stock !== undefined && body.stock !== '') {
            const n = parseInt(body.stock, 10);
            if (Number.isNaN(n) || n < 0) throw new HttpError(400, 'Stock must be zero or more.');
            stock = Math.min(1_000_000, n);
        }
        await env.DB.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(stock, id)
            .run();
        return json({ success: true, id, stock });
    }

    await saveProduct(env, id, validateProduct(body), { create: false });
    return json({ success: true, id });
}

export async function onRequestDelete({ request, env }) {
    await requireAdmin(request, env);
    const id = cleanText(new URL(request.url).searchParams.get('id'), 100);
    if (!id) throw new HttpError(400, 'Missing id query parameter.');
    await softDeleteProduct(env, id);
    return json({ success: true, deleted: id });
}
