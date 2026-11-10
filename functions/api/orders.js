/**
 * /api/orders (administrators only - customers place orders via /api/checkout)
 *   GET  ?limit=&offset=&status=   newest first
 *   PUT  { id, status }            update fulfilment status
 */
import { HttpError, json, readJson, cleanText, intParam } from '../../server/http.js';
import { requireAdmin } from '../../server/auth.js';
import { ORDER_STATUSES, publicOrder } from '../../server/orders.js';

export async function onRequestGet({ request, env }) {
    await requireAdmin(request, env);
    const q = new URL(request.url).searchParams;
    const limit = intParam(q.get('limit'), 25, 1, 100);
    const offset = intParam(q.get('offset'), 0, 0, 100000);
    const status = cleanText(q.get('status'), 30);

    const where = ORDER_STATUSES.includes(status) ? 'WHERE status = ?' : '';
    const binds = where ? [status] : [];

    const { results } = await env.DB.prepare(
        `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
        .bind(...binds, limit + 1, offset)
        .all();

    const rows = results || [];
    return json({
        items: rows.slice(0, limit).map((o) => ({
            ...publicOrder(o),
            email: o.customer_email,
            address: [o.delivery_address, o.city, o.postcode].filter(Boolean).join(', '),
            createdAt: o.created_at,
        })),
        nextOffset: rows.length > limit ? offset + limit : null,
    });
}

export async function onRequestPut({ request, env }) {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const id = cleanText(body.id, 40);
    const status = cleanText(body.status, 30);
    if (!id || !ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid order update.');

    const res = await env.DB.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
        .bind(status, new Date().toISOString(), id)
        .run();
    if (!res.meta?.changes) throw new HttpError(404, 'Order not found.');
    return json({ success: true, id, status });
}

// The old public "POST /api/orders" trusted browser-supplied prices and is retired.
export function onRequestPost() {
    throw new HttpError(410, 'Please place orders through the checkout.');
}
