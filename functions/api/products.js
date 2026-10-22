/**
 * /api/products
 * Supports optional stock (null = hidden, 0 = out of stock, >0 = count),
 * previousPrice (strikethrough price), description, and multi-image galleries.
 */

function verifyAdmin(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const validSecret = env.ADMIN_API_KEY;
    return Boolean(validSecret && token === validSecret);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': status === 200 ? 'no-cache' : 'no-store',
        },
    });
}

function parseStockValue(rawStock) {
    if (rawStock === null || rawStock === undefined || rawStock === '') {
        return null;
    }
    const parsed = parseInt(rawStock, 10);
    if (Number.isNaN(parsed)) return null;
    return Math.max(0, parsed);
}

function parsePreviousPrice(rawPrev) {
    if (rawPrev === null || rawPrev === undefined || rawPrev === '') {
        return null;
    }
    const parsed = parseFloat(rawPrev);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
}

function mapProductFromRow(row) {
    const parsedImages = JSON.parse(row.images_json || '[]');
    const primaryImage = row.image || parsedImages[0] || '';
    const gallery = parsedImages.length > 0 ? parsedImages : primaryImage ? [primaryImage] : [];

    return {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        previousPrice: row.previous_price !== null && row.previous_price !== undefined ? Number(row.previous_price) : null,
        description: row.description || '',
        category: row.category,
        subcategory: row.subcategory || '',
        badge: row.badge || '',
        stock: row.stock === null || row.stock === undefined ? null : Number(row.stock),
        isPopular: Boolean(row.is_popular),
        isTrending: Boolean(row.is_trending),
        delivery: row.delivery || '',
        colors: JSON.parse(row.colors_json || '[]'),
        image: primaryImage,
        images: gallery,
        dimensions: JSON.parse(row.dimensions_json || '[]'),
        features: JSON.parse(row.features_json || '[]'),
    };
}

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM products ORDER BY created_at DESC'
        ).all();
        return jsonResponse((results || []).map(mapProductFromRow));
    } catch (err) {
        return jsonResponse({ error: 'Database read failed', details: err.message }, 500);
    }
}

export async function onRequestPost({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Invalid administrative credentials.' }, 401);
    }

    try {
        const p = await request.json();
        const numericPrice = parseFloat(p.price);
        if (!p.id || !p.name || Number.isNaN(numericPrice) || numericPrice < 0) {
            return jsonResponse({ error: 'Valid product ID, name, and price are required.' }, 400);
        }

        const stockVal = parseStockValue(p.stock);
        const prevPriceVal = parsePreviousPrice(p.previousPrice);
        const imagesArray = Array.isArray(p.images) && p.images.length > 0
            ? p.images.slice(0, 10)
            : p.image ? [p.image] : [];
        const primaryImage = imagesArray[0] || p.image || '';

        await env.DB.prepare(
            `INSERT INTO products (
        id, name, price, previous_price, description, category, subcategory, badge,
        stock, is_popular, is_trending, delivery, colors_json, image, images_json,
        dimensions_json, features_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
            String(p.id).slice(0, 100),
            String(p.name).slice(0, 120),
            numericPrice,
            prevPriceVal,
            String(p.description || '').slice(0, 2000),
            String(p.category || 'Sofas').slice(0, 60),
            String(p.subcategory || '').slice(0, 60),
            String(p.badge || '').slice(0, 40),
            stockVal,
            p.isPopular ? 1 : 0,
            p.isTrending ? 1 : 0,
            String(p.delivery || '').slice(0, 60),
            JSON.stringify(Array.isArray(p.colors) ? p.colors : []),
            primaryImage,
            JSON.stringify(imagesArray),
            JSON.stringify(Array.isArray(p.dimensions) ? p.dimensions : []),
            JSON.stringify(Array.isArray(p.features) ? p.features : [])
        ).run();

        return jsonResponse({ success: true, id: p.id }, 201);
    } catch (err) {
        return jsonResponse({ error: 'Insert failed', details: err.message }, 500);
    }
}

export async function onRequestPut({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Invalid administrative credentials.' }, 401);
    }

    try {
        const body = await request.json();
        const { id, stockOnly, stock } = body;

        if (!id) {
            return jsonResponse({ error: 'Product ID required.' }, 400);
        }

        if (stockOnly) {
            const sanitizedStock = parseStockValue(stock);
            await env.DB.prepare(
                'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(sanitizedStock, id).run();

            return jsonResponse({ success: true, id, stock: sanitizedStock });
        }

        const numericPrice = parseFloat(body.price);
        const stockVal = parseStockValue(body.stock);
        const prevPriceVal = parsePreviousPrice(body.previousPrice);
        const imagesArray = Array.isArray(body.images) && body.images.length > 0
            ? body.images.slice(0, 10)
            : body.image ? [body.image] : [];
        const primaryImage = imagesArray[0] || body.image || '';

        await env.DB.prepare(
            `UPDATE products SET
        name = ?, price = ?, previous_price = ?, description = ?, category = ?,
        subcategory = ?, badge = ?, stock = ?, is_popular = ?, is_trending = ?,
        delivery = ?, colors_json = ?, image = ?, images_json = ?,
        dimensions_json = ?, features_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
        ).bind(
            String(body.name || '').slice(0, 120),
            numericPrice,
            prevPriceVal,
            String(body.description || '').slice(0, 2000),
            String(body.category || '').slice(0, 60),
            String(body.subcategory || '').slice(0, 60),
            String(body.badge || '').slice(0, 40),
            stockVal,
            body.isPopular ? 1 : 0,
            body.isTrending ? 1 : 0,
            String(body.delivery || '').slice(0, 60),
            JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
            primaryImage,
            JSON.stringify(imagesArray),
            JSON.stringify(Array.isArray(body.dimensions) ? body.dimensions : []),
            JSON.stringify(Array.isArray(body.features) ? body.features : []),
            id
        ).run();

        return jsonResponse({ success: true, id });
    } catch (err) {
        return jsonResponse({ error: 'Update failed', details: err.message }, 500);
    }
}

export async function onRequestDelete({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Invalid administrative credentials.' }, 401);
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'Missing id query parameter.' }, 400);

        await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, deleted: id });
    } catch (err) {
        return jsonResponse({ error: 'Delete failed', details: err.message }, 500);
    }
}