/**
 * Order creation and payment fulfilment.
 *
 * Every price is recomputed here from D1 - nothing the browser says about
 * prices or totals is trusted. Stock is committed exactly once per order:
 * immediately for pay-later orders, and when Stripe confirms payment for
 * card / Klarna orders.
 */
import { HttpError, cleanText, randomCode } from './http.js';
import { loadOptions } from './products.js';
import {
    priceSelection,
    computeTotals,
    resolveDeliveryFeePence,
    fromPence,
} from '../shared/pricing.js';

export const ONLINE_METHODS = ['card', 'klarna'];
export const OFFLINE_METHODS = ['cod', 'showroom', 'bacs'];
export const ORDER_STATUSES = [
    'AWAITING_PAYMENT',
    'PENDING_DISPATCH',
    'DISPATCHED',
    'COMPLETED',
    'CANCELLED',
];

const MAX_LINES = 30;
const MAX_QTY = 20;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function validateCustomer(raw, deliveryMethod) {
    const c = raw && typeof raw === 'object' ? raw : {};
    const customer = {
        fullName: cleanText(c.fullName, 100),
        email: cleanText(c.email, 254).toLowerCase(),
        phone: cleanText(c.phone, 30),
        address: cleanText(c.address, 200),
        city: cleanText(c.city, 60),
        postcode: cleanText(c.postcode, 10).toUpperCase(),
    };

    if (customer.fullName.length < 2) throw new HttpError(400, 'Please enter your full name.');
    if (!EMAIL.test(customer.email)) throw new HttpError(400, 'Please enter a valid email address.');
    if (customer.phone.replace(/\D/g, '').length < 7) {
        throw new HttpError(400, 'Please enter a valid contact telephone number.');
    }

    if (deliveryMethod === 'collection') {
        customer.address = 'Maltby Showroom Collection';
        customer.city = 'Maltby';
        customer.postcode = 'S66 8JE';
    } else {
        if (!customer.address || !customer.city) {
            throw new HttpError(400, 'Please enter your delivery address and town or city.');
        }
        if (!UK_POSTCODE.test(customer.postcode)) {
            throw new HttpError(400, 'Please enter a valid UK postcode.');
        }
    }
    return customer;
}

function normaliseItems(rawItems) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new HttpError(400, 'Your basket is empty.');
    }
    if (rawItems.length > MAX_LINES) throw new HttpError(400, 'Too many items in one order.');

    return rawItems.map((raw) => {
        const id = cleanText(raw?.id, 100);
        const qty = Math.floor(Number(raw?.qty));
        if (!id || !Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
            throw new HttpError(400, `Quantities must be between 1 and ${MAX_QTY} per item.`);
        }
        const s = raw?.selections && typeof raw.selections === 'object' ? raw.selections : {};
        return {
            id,
            qty,
            selections: {
                color: cleanText(s.color, 80),
                fabric: cleanText(s.fabric, 80),
                size: cleanText(s.size, 80),
                mattress: cleanText(s.mattress, 80),
                lift: cleanText(s.lift, 80),
            },
        };
    });
}

/** Re-price a basket from the database. Returns { lines, totals }. */
export async function quoteBasket(env, rawItems, deliveryMethod, defaultFeePence) {
    const items = normaliseItems(rawItems);
    const ids = [...new Set(items.map((i) => i.id))];

    const [{ results: products }, optionsByProduct] = await Promise.all([
        env.DB.prepare(
            `SELECT id, name, price, delivery_fee_pence FROM products
             WHERE deleted_at IS NULL AND id IN (${ids.map(() => '?').join(',')})`
        )
            .bind(...ids)
            .all(),
        loadOptions(env, ids),
    ]);
    const byId = new Map((products || []).map((p) => [p.id, p]));

    const lines = items.map((item) => {
        const product = byId.get(item.id);
        if (!product) {
            throw new HttpError(409, 'An item in your basket is no longer available. Please remove it and try again.', {
                code: 'ITEM_UNAVAILABLE',
                productId: item.id,
            });
        }
        const priced = priceSelection(
            Math.round(Number(product.price) * 100),
            optionsByProduct.get(item.id) || [],
            item.selections
        );
        if (!priced.ok) {
            throw new HttpError(409, `${product.name}: ${priced.error}`, {
                code: 'ITEM_UNAVAILABLE',
                productId: item.id,
            });
        }
        return {
            id: product.id,
            name: product.name,
            qty: item.qty,
            selections: priced.selections,
            label: priced.label,
            unitPence: priced.unitPence,
            deliveryUnitPence: resolveDeliveryFeePence(product.delivery_fee_pence, defaultFeePence),
        };
    });

    return { lines, totals: computeTotals(lines, deliveryMethod) };
}

function stockStatements(env, lines, guardSql = '', guardBinds = []) {
    const qtyById = new Map();
    for (const line of lines) qtyById.set(line.id, (qtyById.get(line.id) || 0) + line.qty);

    return [...qtyById.entries()].map(([id, qty]) =>
        env.DB.prepare(
            `UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND stock IS NOT NULL ${guardSql}`
        ).bind(qty, id, ...guardBinds)
    );
}

/** Persist a new order. Pay-later orders reserve stock in the same transaction. */
export async function createOrder(env, { customer, deliveryMethod, paymentMethod, lines, totals, userId }) {
    const online = ONLINE_METHODS.includes(paymentMethod);
    const id = `SJH-${randomCode(8)}`;

    const insert = env.DB.prepare(
        `INSERT INTO orders (
           id, customer_name, customer_email, customer_phone, delivery_address, city, postcode,
           delivery_method, items_json, total, status, user_id, subtotal_pence, delivery_pence,
           total_pence, payment_method, payment_status, stock_committed, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        id,
        customer.fullName,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.postcode,
        deliveryMethod,
        JSON.stringify(lines),
        fromPence(totals.totalPence),
        online ? 'AWAITING_PAYMENT' : 'PENDING_DISPATCH',
        userId || null,
        totals.subtotalPence,
        totals.deliveryPence,
        totals.totalPence,
        paymentMethod,
        online ? 'pending' : 'unpaid',
        online ? 0 : 1,
        new Date().toISOString()
    );

    await env.DB.batch(online ? [insert] : [insert, ...stockStatements(env, lines)]);
    return id;
}

export function attachStripeSession(env, orderId, sessionId) {
    return env.DB.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?')
        .bind(sessionId, orderId)
        .run();
}

export function loadOrderBySession(env, sessionId) {
    return env.DB.prepare('SELECT * FROM orders WHERE stripe_session_id = ?').bind(sessionId).first();
}

/**
 * Mark an order paid and commit its stock - atomically and idempotently, so
 * the Stripe webhook and the customer's return to the site can both call it.
 * The amount Stripe collected must equal the order total.
 */
export async function markOrderPaid(env, orderId, { amountTotal, paymentIntent }) {
    const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
    if (!order) return { ok: false, reason: 'not_found' };
    if (order.payment_status === 'paid') return { ok: true, already: true };
    if (Number(amountTotal) !== Number(order.total_pence)) {
        console.error(`Payment amount mismatch for ${orderId}: got ${amountTotal}, expected ${order.total_pence}`);
        return { ok: false, reason: 'amount_mismatch' };
    }

    let lines = [];
    try {
        lines = JSON.parse(order.items_json);
    } catch {
        lines = [];
    }

    const guard = `AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND payment_status = 'paid' AND stock_committed = 0)`;
    await env.DB.batch([
        env.DB.prepare(
            `UPDATE orders SET payment_status = 'paid', status = 'PENDING_DISPATCH',
                    stripe_payment_intent = ?, updated_at = ?
             WHERE id = ? AND payment_status != 'paid'`
        ).bind(paymentIntent || null, new Date().toISOString(), orderId),
        ...stockStatements(env, lines, guard, [orderId]),
        env.DB.prepare(
            `UPDATE orders SET stock_committed = 1 WHERE id = ? AND payment_status = 'paid'`
        ).bind(orderId),
    ]);
    return { ok: true };
}

/** A checkout session expired or its (delayed) payment failed. */
export function markOrderUnpaid(env, orderId, outcome) {
    return env.DB.prepare(
        `UPDATE orders SET payment_status = ?, status = 'CANCELLED', updated_at = ?
         WHERE id = ? AND payment_status = 'pending'`
    )
        .bind(outcome === 'expired' ? 'expired' : 'failed', new Date().toISOString(), orderId)
        .run();
}

/** Customer-facing view of an order (confirmation page). */
export function publicOrder(order) {
    let lines = [];
    try {
        lines = JSON.parse(order.items_json);
    } catch {
        lines = [];
    }
    return {
        id: order.id,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        deliveryMethod: order.delivery_method,
        customerName: order.customer_name,
        phone: order.customer_phone,
        subtotal: fromPence(order.subtotal_pence),
        delivery: fromPence(order.delivery_pence),
        total: order.total_pence === null ? Number(order.total) : fromPence(order.total_pence),
        items: lines.map((l) => ({
            name: l.name,
            label: l.label || l.selectedColor || '',
            qty: l.qty,
            lineTotal: fromPence((l.unitPence ?? Math.round(Number(l.price || 0) * 100)) * l.qty),
        })),
    };
}
