/**
 * Runs before every /api/* handler:
 *  - makes sure the D1 schema is current (one cheap read per isolate)
 *  - blocks cross-site state-changing requests (CSRF)
 *  - converts thrown errors into clean JSON without leaking internals
 *  - adds baseline security headers
 */
import { ensureSchema } from '../../server/schema.js';
import { assertSameOrigin, errorResponse, json } from '../../server/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function onRequest(context) {
    const { request, env, next } = context;
    let response;

    try {
        if (!env.DB) return json({ error: 'Database is not configured.' }, 503);

        const path = new URL(request.url).pathname;
        // Stripe calls the webhook server-to-server; it is authenticated by signature instead.
        if (!SAFE_METHODS.has(request.method) && path !== '/api/stripe-webhook') {
            assertSameOrigin(request);
        }

        await ensureSchema(env);
        response = await next();
    } catch (err) {
        response = errorResponse(err);
    }

    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers });
}
