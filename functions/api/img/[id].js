/**
 * GET /api/img/:id - serve an uploaded photo from the media table.
 * Ids are random and content never changes, so responses are cached forever
 * by the browser and at the Cloudflare edge (D1 is only read on a cache miss).
 */
import { HttpError } from '../../../server/http.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function onRequestGet({ request, env, params, waitUntil }) {
    const id = String(params.id || '');
    if (!/^[A-Za-z0-9_-]{16,40}$/.test(id)) throw new HttpError(404, 'Image not found.');

    const cache = caches.default;
    const cacheKey = new Request(`${new URL(request.url).origin}/api/img/${id}`);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const row = await env.DB.prepare('SELECT mime, data FROM media WHERE id = ?').bind(id).first();
    if (!row || !ALLOWED.has(row.mime)) throw new HttpError(404, 'Image not found.');

    const binary = atob(row.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const response = new Response(bytes, {
        headers: {
            'Content-Type': row.mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Security-Policy': "default-src 'none'",
        },
    });
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
}
