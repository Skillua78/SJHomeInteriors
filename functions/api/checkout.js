/**
 * /api/checkout
 *   POST  place an order. Card / Klarna orders return a Stripe Checkout URL;
 *         pay-later orders (on delivery, in showroom, bank transfer) are
 *         confirmed immediately.
 *   GET   ?session_id=cs_...  order status after returning from Stripe.
 */
import { HttpError, json, readJson, cleanText, clientIp } from '../../server/http.js';
import { getSession } from '../../server/auth.js';
import { rateLimit } from '../../server/rateLimit.js';
import { loadSettings, deliveryFeePence, paymentOptions } from '../../server/settings.js';
import { createCheckoutSession, retrieveCheckoutSession } from '../../server/stripe.js';
import {
    ONLINE_METHODS,
    validateCustomer,
    quoteBasket,
    createOrder,
    attachStripeSession,
    loadOrderBySession,
    markOrderPaid,
    markOrderUnpaid,
    publicOrder,
} from '../../server/orders.js';
import { fromPence } from '../../shared/pricing.js';

export async function onRequestPost({ request, env }) {
    await rateLimit(env, `checkout:${clientIp(request)}`, 12, 600);
    const body = await readJson(request, 32 * 1024);

    const settings = await loadSettings(env);
    if (settings.paymentEnabled === false) {
        throw new HttpError(503, 'Online ordering is paused for maintenance. Please contact the showroom.');
    }

    const deliveryMethod = body.deliveryMethod === 'collection' ? 'collection' : 'delivery';
    const paymentMethod = cleanText(body.paymentMethod, 12);
    const available = paymentOptions(env, settings);
    if (!available[paymentMethod]) {
        throw new HttpError(400, 'That payment method is not available. Please choose another.');
    }
    if (paymentMethod === 'cod' && deliveryMethod !== 'delivery') {
        throw new HttpError(400, 'Pay on delivery is only available for home delivery orders.');
    }
    if (body.agreedTerms !== true) {
        throw new HttpError(400, 'Please agree to the Terms & Conditions before ordering.');
    }

    const customer = validateCustomer(body.customer, deliveryMethod);
    const { lines, totals } = await quoteBasket(env, body.items, deliveryMethod, deliveryFeePence(settings));

    // If prices changed since the basket was displayed, show the new figures before charging.
    if (Number.isFinite(Number(body.expectedTotalPence)) && Number(body.expectedTotalPence) !== totals.totalPence) {
        throw new HttpError(409, 'Some prices have been updated. Please review your new total and confirm.', {
            code: 'PRICE_CHANGED',
            quote: {
                lines: lines.map((l) => ({
                    id: l.id,
                    selections: l.selections,
                    unitPrice: fromPence(l.unitPence),
                    deliveryFee: fromPence(l.deliveryUnitPence),
                })),
                total: fromPence(totals.totalPence),
            },
        });
    }
    if (totals.totalPence <= 0) throw new HttpError(400, 'This order has nothing to pay for.');

    const session = await getSession(request, env);
    const orderId = await createOrder(env, {
        customer,
        deliveryMethod,
        paymentMethod,
        lines,
        totals,
        userId: session?.role === 'customer' ? session.id : null,
    });

    if (!ONLINE_METHODS.includes(paymentMethod)) {
        const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
        return json({ success: true, order: publicOrder(order) }, 201);
    }

    let checkout;
    try {
        checkout = await createCheckoutSession(env, {
            order: { id: orderId, email: customer.email },
            lines,
            deliveryPence: totals.deliveryPence,
            method: paymentMethod,
            origin: new URL(request.url).origin,
        });
    } catch (err) {
        await markOrderUnpaid(env, orderId, 'failed');
        throw err;
    }

    await attachStripeSession(env, orderId, checkout.id);
    return json({ success: true, orderId, redirectUrl: checkout.url }, 201);
}

export async function onRequestGet({ request, env }) {
    await rateLimit(env, `checkout-status:${clientIp(request)}`, 60, 600);

    const sessionId = cleanText(new URL(request.url).searchParams.get('session_id'), 200);
    if (!/^cs_[A-Za-z0-9_]{10,190}$/.test(sessionId)) throw new HttpError(400, 'Invalid checkout reference.');

    let order = await loadOrderBySession(env, sessionId);
    if (!order) throw new HttpError(404, 'Order not found.');

    // The webhook normally gets here first; this covers the customer arriving before it.
    if (order.payment_status === 'pending') {
        const session = await retrieveCheckoutSession(env, sessionId);
        if (session.payment_status === 'paid' && session.client_reference_id === order.id) {
            await markOrderPaid(env, order.id, {
                amountTotal: session.amount_total,
                paymentIntent: session.payment_intent,
            });
        } else if (session.status === 'expired') {
            await markOrderUnpaid(env, order.id, 'expired');
        }
        order = await loadOrderBySession(env, sessionId);
    }

    return json({ order: publicOrder(order) });
}
