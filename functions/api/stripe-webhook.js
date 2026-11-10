/**
 * POST /api/stripe-webhook
 *
 * Source of truth for payment results (the customer may close the tab before
 * returning to the site, and Klarna can settle asynchronously). Every event
 * is authenticated with the Stripe-Signature header; handlers are idempotent
 * because Stripe retries deliveries.
 *
 * Subscribe this endpoint to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 */
import { json } from '../../server/http.js';
import { verifyStripeSignature } from '../../server/stripe.js';
import { markOrderPaid, markOrderUnpaid } from '../../server/orders.js';

export async function onRequestPost({ request, env }) {
    if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Webhook is not configured.' }, 503);

    const rawBody = await request.text();
    if (rawBody.length > 512 * 1024) return json({ error: 'Payload too large.' }, 413);

    const valid = await verifyStripeSignature(
        rawBody,
        request.headers.get('Stripe-Signature'),
        env.STRIPE_WEBHOOK_SECRET
    );
    if (!valid) return json({ error: 'Invalid signature.' }, 400);

    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return json({ error: 'Invalid payload.' }, 400);
    }

    const session = event?.data?.object || {};
    const orderId = session.client_reference_id || session.metadata?.order_id;
    if (!orderId) return json({ received: true });

    switch (event.type) {
        case 'checkout.session.completed':
            // Delayed methods complete the session first and confirm payment later.
            if (session.payment_status !== 'paid') break;
        // falls through
        case 'checkout.session.async_payment_succeeded': {
            const result = await markOrderPaid(env, orderId, {
                amountTotal: session.amount_total,
                paymentIntent: session.payment_intent,
            });
            if (!result.ok) console.error(`Could not fulfil order ${orderId}: ${result.reason}`);
            break;
        }
        case 'checkout.session.async_payment_failed':
            await markOrderUnpaid(env, orderId, 'failed');
            break;
        case 'checkout.session.expired':
            await markOrderUnpaid(env, orderId, 'expired');
            break;
        default:
            break;
    }

    return json({ received: true });
}
