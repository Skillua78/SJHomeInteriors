/**
 * /api/products
 * GET: Public global product catalog fetch
 * POST: Admin-authenticated product creation
 * PUT: Admin-authenticated product/stock updates
 * DELETE: Admin-authenticated product deletion
 */

function verifyAdmin(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const validSecret = env.ADMIN_API_KEY;
    if (!validSecret || token !== validSecret) {
        return false;
    }
    return true;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': status === 200 ? 'public, s-maxage=30, max-age=10' : 'no-store',
        },
    });
}

function mapProductFromRow(row) {
    return {
        id: row.id,
        name: row.name,
        price: row.price,
        category: row.category,
        subcategory: row.subcategory,
        badge: row.badge,
        stock: row.stock,
        isPopular: Boolean(row.is_popular),
        isTrending: Boolean(row.is_trending),
        delivery: row.delivery,
        colors: JSON.parse(row.colors_json || '[]'),
        image: row.image,
        dimensions: JSON.parse(row.dimensions_json || '[]'),
        features: JSON.parse(row.features_json || '[]'),
    };
}

export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM products ORDER BY created_at DESC'
        ).all();

        const formatted = (results || []).map(mapProductFromRow);
        return jsonResponse(formatted);
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
        if (!p.id || !p.name || typeof p.price !== 'number' || p.price < 0) {
            return jsonResponse({ error: 'Invalid payload attributes.' }, 400);
        }

        await env.DB.prepare(
            `INSERT INTO products (
        id, name, price, category, subcategory, badge, stock,
        is_popular, is_trending, delivery, colors_json, image,
        dimensions_json, features_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
            p.id,
            p.name.slice(0, 120),
            p.price,
            p.category || 'Sofas',
            p.subcategory || '',
            p.badge || '',
            Math.max(0, parseInt(p.stock, 10) || 0),
            p.isPopular ? 1 : 0,
            p.isTrending ? 1 : 0,
            p.delivery || '2–10 days',
            JSON.stringify(p.colors || []),
            p.image,
            JSON.stringify(p.dimensions || []),
            JSON.stringify(p.features || [])
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
            const sanitizedStock = Math.max(0, parseInt(stock, 10) || 0);
            await env.DB.prepare(
                'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(sanitizedStock, id).run();

            return jsonResponse({ success: true, id, stock: sanitizedStock });
        }

        await env.DB.prepare(
            `UPDATE products SET
        name = ?, price = ?, category = ?, subcategory = ?, badge = ?, stock = ?,
        is_popular = ?, is_trending = ?, delivery = ?, colors_json = ?, image = ?,
        dimensions_json = ?, features_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
        ).bind(
            body.name.slice(0, 120),
            body.price,
            body.category,
            body.subcategory,
            body.badge,
            Math.max(0, parseInt(body.stock, 10) || 0),
            body.isPopular ? 1 : 0,
            body.isTrending ? 1 : 0,
            body.delivery,
            JSON.stringify(body.colors || []),
            body.image,
            JSON.stringify(body.dimensions || []),
            JSON.stringify(body.features || []),
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