/**
 * /api/checkout
 *   POST ?action=quote  price a basket (items, delivery by distance, optional assembly)
 *                       without placing an order
 *   POST                place an order. Card / Klarna orders return a Stripe Checkout URL;
 *                       pay-later orders (on delivery, in showroom, bank transfer) are
 *                       confirmed immediately.
 *   GET  ?session_id=cs_...  order status after returning from Stripe.
 */
import { HttpError, json, readJson, cleanText, clientIp } from '../../server/http.js';
import { getSession } from '../../server/auth.js';
import { rateLimit } from '../../server/rateLimit.js';
import { loadSettings, assemblyFeePence, paymentOptions } from '../../server/settings.js';
import { deliveryCharge } from '../../server/delivery.js';
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
import { computeTotals, orderAssemblyPence, fromPence } from '../../shared/pricing.js';

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/**
 * Everything the browser may not decide for itself: item prices, whether this
 * address is charged for delivery, and what assembly costs.
 */
async function priceOrder(env, settings, { items, deliveryMethod, postcode, assembly }) {
    const lines = await quoteBasket(env, items, assemblyFeePence(settings));

    let delivery = { pence: 0, miles: null, checked: true };
    if (deliveryMethod === 'delivery' && postcode) {
        delivery = await deliveryCharge(settings, postcode);
    }

    // Assembly happens in the customer's home, so it is only offered with delivery.
    const wantsAssembly = deliveryMethod === 'delivery' && assembly === true;
    const totals = computeTotals(lines, { deliveryPence: delivery.pence, assembly: wantsAssembly });
    return { lines, totals, delivery, assemblyOfferPence: orderAssemblyPence(lines) };
}

function quoteResponse({ lines, totals, delivery, assemblyOfferPence }) {
    return {
        lines: lines.map((l) => ({
            id: l.id,
            selections: l.selections,
            unitPrice: fromPence(l.unitPence),
            assemblyFee: fromPence(l.assemblyUnitPence),
        })),
        subtotal: fromPence(totals.subtotalPence),
        delivery: fromPence(totals.deliveryPence),
        assembly: fromPence(totals.assemblyPence),
        total: fromPence(totals.totalPence),
        totalPence: totals.totalPence,
        assemblyOffer: fromPence(assemblyOfferPence),
        distanceMiles: delivery.miles,
        distanceChecked: delivery.checked,
    };
}

export async function onRequestPost({ request, env }) {
    const ip = clientIp(request);
    const isQuote = new URL(request.url).searchParams.get('action') === 'quote';
    await rateLimit(env, `${isQuote ? 'quote' : 'checkout'}:${ip}`, isQuote ? 60 : 12, 600);

    const body = await readJson(request, 32 * 1024);
    const settings = await loadSettings(env);
    const deliveryMethod = body.deliveryMethod === 'collection' ? 'collection' : 'delivery';

    if (isQuote) {
        const postcode = cleanText(body.postcode, 10);
        const priced = await priceOrder(env, settings, {
            items: body.items,
            deliveryMethod,
            postcode: UK_POSTCODE.test(postcode) ? postcode : '',
            assembly: body.assembly === true,
        });
        return json(quoteResponse(priced));
    }

    if (settings.paymentEnabled === false) {
        throw new HttpError(503, 'Online ordering is paused for maintenance. Please contact the showroom.');
    }

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
    const priced = await priceOrder(env, settings, {
        items: body.items,
        deliveryMethod,
        postcode: customer.postcode,
        assembly: body.assembly === true,
    });
    const { lines, totals, delivery } = priced;

    // If the total differs from what the basket displayed, show the new figures before charging.
    if (Number.isFinite(Number(body.expectedTotalPence)) && Number(body.expectedTotalPence) !== totals.totalPence) {
        throw new HttpError(409, 'Your total has been updated. Please review it and confirm.', {
            code: 'PRICE_CHANGED',
            quote: quoteResponse(priced),
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
        distanceMiles: deliveryMethod === 'delivery' ? delivery.miles : null,
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
            assemblyPence: totals.assemblyPence,
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
