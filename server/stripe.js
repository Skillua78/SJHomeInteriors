/**
 * Minimal Stripe client for Workers (REST + fetch, no SDK).
 * Card and Klarna payments both go through Stripe Checkout: Stripe hosts the
 * payment page, so no card data ever touches this site (PCI SAQ-A).
 */
import { HttpError } from './http.js';

const API = 'https://api.stripe.com/v1';
const enc = new TextEncoder();

/** Flatten nested objects/arrays into Stripe's bracketed form encoding. */
export function formEncode(value, prefix = '', out = new URLSearchParams()) {
    if (value === null || value === undefined) return out;
    if (Array.isArray(value)) {
        value.forEach((item, idx) => formEncode(item, `${prefix}[${idx}]`, out));
    } else if (typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
            formEncode(item, prefix ? `${prefix}[${key}]` : key, out);
        }
    } else {
        out.append(prefix, String(value));
    }
    return out;
}

async function stripeRequest(env, method, path, params, idempotencyKey) {
    if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, 'Online payment is not available right now.');

    const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const init = { method, headers };
    if (params) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        init.body = formEncode(params).toString();
    }

    let res;
    try {
        // STRIPE_API_BASE is only for pointing local development at a mock server.
        res = await fetch(`${env.STRIPE_API_BASE || API}${path}`, init);
    } catch (err) {
        console.error('Stripe network error:', err);
        throw new HttpError(502, 'Could not reach the payment provider. Please try again.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('Stripe API error:', res.status, data?.error?.type, data?.error?.code, data?.error?.message);
        // Card/validation errors are safe to show; anything else stays generic.
        const safe = ['card_error', 'invalid_request_error'].includes(data?.error?.type)
            ? data.error.message
            : null;
        throw new HttpError(
            502,
            safe
                ? `The payment provider declined this request: ${safe}`
                : 'The payment provider could not start this payment. Please try another method.'
        );
    }
    return data;
}

/**
 * Create a hosted Checkout Session for an order.
 * @param method 'card' | 'klarna'
 * @param lines  [{ name, label, unitPence, qty }]
 */
export function createCheckoutSession(env, { order, lines, deliveryPence, method, origin }) {
    const lineItems = lines.map((line) => ({
        quantity: line.qty,
        price_data: {
            currency: 'gbp',
            unit_amount: line.unitPence,
            product_data: {
                name: line.name.slice(0, 120),
                ...(line.label && line.label !== 'Standard'
                    ? { description: line.label.slice(0, 300) }
                    : {}),
            },
        },
    }));

    if (deliveryPence > 0) {
        lineItems.push({
            quantity: 1,
            price_data: {
                currency: 'gbp',
                unit_amount: deliveryPence,
                product_data: { name: 'Two-person delivery & assembly' },
            },
        });
    }

    return stripeRequest(
        env,
        'POST',
        '/checkout/sessions',
        {
            mode: 'payment',
            payment_method_types: [method === 'klarna' ? 'klarna' : 'card'],
            line_items: lineItems,
            customer_email: order.email,
            client_reference_id: order.id,
            locale: 'en-GB',
            metadata: { order_id: order.id },
            payment_intent_data: {
                description: `SJ Home Interiors order ${order.id}`,
                metadata: { order_id: order.id },
            },
            expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
            success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/?checkout=cancelled&order=${encodeURIComponent(order.id)}`,
        },
        `checkout-${order.id}`
    );
}

export function retrieveCheckoutSession(env, sessionId) {
    return stripeRequest(env, 'GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

function hexToBytes(hex) {
    if (!/^([0-9a-f]{2})+$/i.test(hex)) return null;
    return new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));
}

/**
 * Verify a Stripe-Signature header (scheme v1: HMAC-SHA256 over "<t>.<body>").
 * Rejects replays older than the tolerance window. Returns true/false.
 */
export async function verifyStripeSignature(rawBody, header, secret, toleranceSeconds = 300, now = Date.now()) {
    if (!header || !secret) return false;

    let timestamp = '';
    const candidates = [];
    for (const part of String(header).split(',')) {
        const [key, value] = part.trim().split('=');
        if (key === 't') timestamp = value;
        if (key === 'v1' && value) candidates.push(value);
    }
    const ts = Number(timestamp);
    if (!ts || candidates.length === 0) return false;
    if (Math.abs(Math.floor(now / 1000) - ts) > toleranceSeconds) return false;

    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    const message = enc.encode(`${timestamp}.${rawBody}`);

    for (const candidate of candidates) {
        const sig = hexToBytes(candidate);
        // crypto.subtle.verify performs a constant-time comparison.
        if (sig && (await crypto.subtle.verify('HMAC', key, sig, message))) return true;
    }
    return false;
}
