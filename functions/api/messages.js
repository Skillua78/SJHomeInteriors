/**
 * /api/messages - enquiries from the contact form and website feedback.
 *   POST    public  send a message (rate limited)
 *   GET     admin   newest first: ?limit=&offset=
 *   PUT     admin   { id, read }  or  { action: 'mark-all-read' }
 *   DELETE  admin   ?id=
 */
import { HttpError, json, readJson, cleanText, clientIp, intParam, randomId } from '../../server/http.js';
import { requireAdmin } from '../../server/auth.js';
import { rateLimit } from '../../server/rateLimit.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
    await rateLimit(env, `message:${clientIp(request)}`, 5, 3600);
    const body = await readJson(request, 16 * 1024);

    const kind = body.kind === 'feedback' ? 'feedback' : 'contact';
    const text = cleanText(body.message, 3000);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();

    if (text.length < 3) throw new HttpError(400, 'Please write your message.');
    if (kind === 'contact') {
        if (!name) throw new HttpError(400, 'Please enter your name.');
        if (!EMAIL.test(email)) throw new HttpError(400, 'Please enter a valid email address so we can reply.');
    } else if (email && !EMAIL.test(email)) {
        throw new HttpError(400, 'Please enter a valid email address.');
    }

    const id = `msg_${randomId(10)}`;
    await env.DB.prepare(
        `INSERT INTO messages (id, kind, name, email, phone, subject, body) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
        .bind(id, kind, name, email, cleanText(body.phone, 30), cleanText(body.subject, 120), text)
        .run();

    return json({ success: true }, 201);
}

export async function onRequestGet({ request, env }) {
    await requireAdmin(request, env);
    const q = new URL(request.url).searchParams;
    const limit = intParam(q.get('limit'), 30, 1, 100);
    const offset = intParam(q.get('offset'), 0, 0, 100000);

    const { results } = await env.DB.prepare(
        `SELECT id, kind, name, email, phone, subject, body, is_read, created_at
         FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
        .bind(limit + 1, offset)
        .all();

    const rows = results || [];
    return json({
        items: rows.slice(0, limit).map((m) => ({
            id: m.id,
            kind: m.kind,
            name: m.name,
            email: m.email,
            phone: m.phone,
            subject: m.subject,
            message: m.body,
            read: Boolean(m.is_read),
            createdAt: m.created_at,
        })),
        nextOffset: rows.length > limit ? offset + limit : null,
    });
}

export async function onRequestPut({ request, env }) {
    await requireAdmin(request, env);
    const body = await readJson(request);

    if (body.action === 'mark-all-read') {
        await env.DB.prepare('UPDATE messages SET is_read = 1 WHERE is_read = 0').run();
        return json({ success: true });
    }

    const id = cleanText(body.id, 60);
    if (!id) throw new HttpError(400, 'Message ID required.');
    await env.DB.prepare('UPDATE messages SET is_read = ? WHERE id = ?')
        .bind(body.read ? 1 : 0, id)
        .run();
    return json({ success: true, id, read: Boolean(body.read) });
}

export async function onRequestDelete({ request, env }) {
    await requireAdmin(request, env);
    const id = cleanText(new URL(request.url).searchParams.get('id'), 60);
    if (!id) throw new HttpError(400, 'Missing id query parameter.');
    await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    return json({ success: true, deleted: id });
}
