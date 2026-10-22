/**
 * /api/reviews
 * GET: Fetch verified reviews (or all reviews if admin)
 * POST: Public review submission (defaults to unverified)
 * PUT: Admin moderation (toggle verify, official showroom responses)
 * DELETE: Admin moderation (delete spam/abuse)
 */

function verifyAdmin(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    return Boolean(env.ADMIN_API_KEY && token === env.ADMIN_API_KEY);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

function mapReviewFromRow(row) {
    return {
        id: row.id,
        author: row.author,
        location: row.location || '',
        rating: row.rating,
        date: row.date,
        productName: row.product_name || '',
        comment: row.comment,
        images: JSON.parse(row.images_json || '[]'),
        verified: Boolean(row.verified),
        adminResponse: row.admin_response || '',
    };
}

export async function onRequestGet({ request, env }) {
    try {
        const isAdmin = verifyAdmin(request, env);
        let query = 'SELECT * FROM reviews WHERE verified = 1 ORDER BY created_at DESC';
        if (isAdmin) {
            query = 'SELECT * FROM reviews ORDER BY created_at DESC';
        }

        const { results } = await env.DB.prepare(query).all();
        return jsonResponse((results || []).map(mapReviewFromRow));
    } catch (err) {
        return jsonResponse({ error: 'Failed to retrieve reviews', details: err.message }, 500);
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { author, location, rating, productName, comment, images } = body;

        if (!author || !comment) {
            return jsonResponse({ error: 'Author name and review comment are mandatory.' }, 400);
        }

        const sanitizedImages = Array.isArray(images) ? images.slice(0, 3) : [];
        const newId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const formattedDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        await env.DB.prepare(
            `INSERT INTO reviews (
        id, author, location, rating, date, product_name, comment, images_json, verified, admin_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '')`
        ).bind(
            newId,
            author.slice(0, 60).trim(),
            (location || '').slice(0, 60).trim(),
            Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
            formattedDate,
            (productName || '').slice(0, 120).trim(),
            comment.slice(0, 1000).trim(),
            JSON.stringify(sanitizedImages)
        ).run();

        return jsonResponse({ success: true, id: newId, message: 'Review submitted for moderation.' }, 201);
    } catch (err) {
        return jsonResponse({ error: 'Review submission failed', details: err.message }, 500);
    }
}

export async function onRequestPut({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Admin authentication required.' }, 401);
    }

    try {
        const { id, action, verified, adminResponse } = await request.json();
        if (!id) return jsonResponse({ error: 'Review ID required.' }, 400);

        if (action === 'toggle-verify') {
            await env.DB.prepare('UPDATE reviews SET verified = ? WHERE id = ?')
                .bind(verified ? 1 : 0, id)
                .run();
            return jsonResponse({ success: true, id, verified: Boolean(verified) });
        }

        if (action === 'respond') {
            const sanitizedReply = (adminResponse || '').slice(0, 500).trim();
            await env.DB.prepare('UPDATE reviews SET admin_response = ? WHERE id = ?')
                .bind(sanitizedReply, id)
                .run();
            return jsonResponse({ success: true, id, adminResponse: sanitizedReply });
        }

        return jsonResponse({ error: 'Unrecognized action.' }, 400);
    } catch (err) {
        return jsonResponse({ error: 'Moderation action failed', details: err.message }, 500);
    }
}

export async function onRequestDelete({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Admin authentication required.' }, 401);
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'Missing review id parameter.' }, 400);

        await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, deleted: id });
    } catch (err) {
        return jsonResponse({ error: 'Deletion failed', details: err.message }, 500);
    }
}