/**
 * GET /api/notifications (admin) - how many things are waiting for attention.
 * Three indexed counts in one round trip; the dashboard polls this.
 */
import { json } from '../../server/http.js';
import { requireAdmin } from '../../server/auth.js';
import { NEW_ORDER_FILTER } from '../../server/orders.js';

export async function onRequestGet({ request, env }) {
    await requireAdmin(request, env);

    const [orders, messages, reviews] = await env.DB.batch([
        env.DB.prepare(`SELECT COUNT(*) AS n FROM orders WHERE ${NEW_ORDER_FILTER}`),
        env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0'),
        env.DB.prepare('SELECT COUNT(*) AS n FROM reviews WHERE verified = 0'),
    ]);

    const count = (res) => Number(res.results?.[0]?.n) || 0;
    const result = { orders: count(orders), messages: count(messages), reviews: count(reviews) };
    return json({ ...result, total: result.orders + result.messages + result.reviews });
}
