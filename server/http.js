/**
 * Shared HTTP helpers for Pages Functions.
 * Errors thrown as HttpError become clean JSON responses; anything else is
 * logged server-side and returned as a generic 500 (no internals leaked).
 */

export class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message);
        this.status = status;
        this.extra = extra;
    }
}

export function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...headers,
        },
    });
}

export function errorResponse(err) {
    if (err instanceof HttpError) {
        return json({ error: err.message, ...err.extra }, err.status, err.headers || {});
    }
    console.error('Unhandled API error:', err?.stack || err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
}

/** Read a JSON body with a hard size cap (default 64 KB). */
export async function readJson(request, maxBytes = 64 * 1024) {
    const type = request.headers.get('Content-Type') || '';
    if (!type.toLowerCase().includes('application/json')) {
        throw new HttpError(415, 'Content-Type must be application/json.');
    }
    const declared = Number(request.headers.get('Content-Length') || 0);
    if (declared > maxBytes) throw new HttpError(413, 'Request is too large.');

    const text = await request.text();
    if (text.length > maxBytes) throw new HttpError(413, 'Request is too large.');

    let body;
    try {
        body = JSON.parse(text);
    } catch {
        throw new HttpError(400, 'Request body is not valid JSON.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new HttpError(400, 'Request body must be a JSON object.');
    }
    return body;
}

export function clientIp(request) {
    return request.headers.get('CF-Connecting-IP') || 'local';
}

/**
 * CSRF defence for cookie-authenticated requests: a state-changing request
 * that carries an Origin header must come from this site.
 */
export function assertSameOrigin(request) {
    const origin = request.headers.get('Origin');
    if (!origin) return; // non-browser client; cookies are SameSite=Strict anyway
    if (origin !== new URL(request.url).origin) {
        throw new HttpError(403, 'Cross-site requests are not allowed.');
    }
}

/** Trim, strip control characters and cap length. Non-strings become ''. */
export function cleanText(value, max = 200) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value)
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, max);
}

export function intParam(value, fallback, min, max) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Random Crockford-base32 string (5 bits per char). */
export function randomCode(length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let out = '';
    for (const b of bytes) out += B32[b & 31];
    return out;
}

export function randomId(bytes = 16) {
    const buf = crypto.getRandomValues(new Uint8Array(bytes));
    let bin = '';
    for (const b of buf) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
