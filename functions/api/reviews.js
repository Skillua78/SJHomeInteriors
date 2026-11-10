/**
 * /api/reviews
 *   GET     public: verified reviews + real average rating; admin: everything
 *   POST    public: submit a review (rate limited, held for moderation)
 *   PUT     admin:  verify / respond
 *   DELETE  admin:  remove
 */
import { HttpError, json, readJson, cleanText, clientIp, intParam, randomId } from '../../server/http.js';
import { isAdmin, requireAdmin } from '../../server/auth.js';
import { rateLimit } from '../../server/rateLimit.js';
import { planImages, orphanOwnerMedia } from '../../server/media.js';

const MAX_REVIEW_BODY = 5 * 1024 * 1024; // up to 3 client-compressed photos

function parseImages(text) {
    try {
        const list = JSON.parse(text || '[]');
        return Array.isArray(list)
            ? list.filter((u) => typeof u === 'string' && !u.startsWith('data:'))
            : [];
    } catch {
        return [];
    }
}

function mapReview(row) {
    return {
        id: row.id,
        author: row.author,
        location: row.location || '',
        rating: row.rating,
        date: row.date,
        productName: row.product_name || '',
        comment: row.comment,
        images: parseImages(row.images_json),
        verified: Boolean(row.verified),
        adminResponse: row.admin_response || '',
    };
}

/** Move inline photos written by the old code into the media table (a few per request). */
let legacyDone = false;

async function migrateLegacyReviews(env) {
    if (legacyDone) return;
    const { results } = await env.DB.prepare(
        'SELECT id, images_json FROM reviews WHERE schema_v = 0 LIMIT 5'
    ).all();
    if (!results || results.length === 0) {
        legacyDone = true;
        return;
    }
    for (const row of results) {
        let inputs = [];
        try {
            inputs = JSON.parse(row.images_json || '[]');
        } catch {
            inputs = [];
        }
        const { urls, statements } = await planImages(env, 'review', row.id, inputs, 3);
        statements.push(
            env.DB.prepare('UPDATE reviews SET images_json = ?, schema_v = 1 WHERE id = ?').bind(
                JSON.stringify(urls),
                row.id
            )
        );
        await env.DB.batch(statements);
    }
}

export async function onRequestGet({ request, env }) {
    await migrateLegacyReviews(env);

    const admin = await isAdmin(request, env);
    const url = new URL(request.url);
    const limit = intParam(url.searchParams.get('limit'), admin ? 200 : 30, 1, 200);
    const offset = intParam(url.searchParams.get('offset'), 0, 0, 100000);
    const filter = admin ? '' : 'WHERE verified = 1';

    const [list, stats] = await env.DB.batch([
        env.DB.prepare(
            `SELECT id, author, location, rating, date, product_name, comment, images_json,
                    verified, admin_response
             FROM reviews ${filter} ORDER BY created_at DESC LIMIT ? OFFSET ?`
        ).bind(limit, offset),
        env.DB.prepare('SELECT COUNT(*) AS n, AVG(rating) AS average FROM reviews WHERE verified = 1'),
    ]);

    const s = stats.results?.[0] || {};
    return json({
        items: (list.results || []).map(mapReview),
        stats: {
            count: Number(s.n) || 0,
            average: s.average ? Math.round(Number(s.average) * 10) / 10 : null,
        },
    });
}

export async function onRequestPost({ request, env }) {
    await rateLimit(env, `review:${clientIp(request)}`, 3, 3600);
    const body = await readJson(request, MAX_REVIEW_BODY);

    const author = cleanText(body.author, 60);
    const comment = cleanText(body.comment, 1000);
    const rating = parseInt(body.rating, 10);
    if (!author || comment.length < 3) {
        throw new HttpError(400, 'Please enter your name and a review comment.');
    }
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Please choose a rating from 1 to 5.');

    const id = `rev_${randomId(10)}`;
    const { urls, statements } = await planImages(env, 'review', id, body.images, 3);
    const date = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    statements.push(
        env.DB.prepare(
            `INSERT INTO reviews (id, author, location, rating, date, product_name, comment,
                                  images_json, verified, admin_response, schema_v)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', 1)`
        ).bind(
            id,
            author,
            cleanText(body.location, 60),
            rating,
            date,
            cleanText(body.productName, 120),
            comment,
            JSON.stringify(urls)
        )
    );
    await env.DB.batch(statements);

    return json({ success: true, id, message: 'Review submitted for moderation.' }, 201);
}

export async function onRequestPut({ request, env }) {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const id = cleanText(body.id, 60);
    if (!id) throw new HttpError(400, 'Review ID required.');

    if (body.action === 'toggle-verify') {
        await env.DB.prepare('UPDATE reviews SET verified = ? WHERE id = ?')
            .bind(body.verified ? 1 : 0, id)
            .run();
        return json({ success: true, id, verified: Boolean(body.verified) });
    }

    if (body.action === 'respond') {
        const reply = cleanText(body.adminResponse, 500);
        await env.DB.prepare('UPDATE reviews SET admin_response = ? WHERE id = ?').bind(reply, id).run();
        return json({ success: true, id, adminResponse: reply });
    }

    throw new HttpError(400, 'Unrecognised action.');
}

export async function onRequestDelete({ request, env }) {
    await requireAdmin(request, env);
    const id = cleanText(new URL(request.url).searchParams.get('id'), 60);
    if (!id) throw new HttpError(400, 'Missing review id parameter.');

    await env.DB.batch([
        env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id),
        orphanOwnerMedia(env, 'review', id),
    ]);
    return json({ success: true, deleted: id });
}
