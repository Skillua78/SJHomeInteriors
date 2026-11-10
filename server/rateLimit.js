/**
 * Fixed-window rate limiter backed by D1 (one atomic upsert per check).
 */
import { HttpError } from './http.js';

export async function rateLimit(env, key, limit, windowSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);

    const row = await env.DB.prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start = ?2 THEN count + 1 ELSE 1 END,
           window_start = ?2
         RETURNING count`
    )
        .bind(key.slice(0, 200), windowStart)
        .first();

    // Occasionally sweep expired counters so the table stays tiny.
    if (Math.random() < 0.02) {
        await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?')
            .bind(now - 86400)
            .run();
    }

    if (row && row.count > limit) {
        const err = new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
        err.headers = { 'Retry-After': String(windowStart + windowSeconds - now) };
        throw err;
    }
}
