/**
 * Image storage.
 *
 * Uploaded photos used to be stored as base64 data-URLs inside product /
 * review / settings JSON, which meant every catalogue request shipped
 * megabytes of image data through the Worker. They now live one-per-row in
 * the `media` table and are served (and edge-cached forever) from
 * /api/img/<id>. JSON columns only hold short URLs.
 */
import { randomId } from './http.js';

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const MEDIA_REF = /^\/api\/img\/([A-Za-z0-9_-]{16,40})$/;
// A static image deployed with the site, e.g. /showroom/20261114_145410.jpg
const LOCAL_IMAGE = /^\/(?!\/)[A-Za-z0-9_\-./]{1,200}\.(?:jpe?g|png|webp)$/i;
const MAX_BASE64_CHARS = 1_900_000; // D1 caps a row at 2 MB
const DAY = 86400;

export function mediaUrl(id) {
    return `/api/img/${id}`;
}

export function mediaIdFromUrl(url) {
    const m = MEDIA_REF.exec(String(url || ''));
    return m ? m[1] : null;
}

function safeHttpsUrl(value) {
    if (typeof value !== 'string' || value.length > 600) return '';
    try {
        const parsed = new URL(value.trim());
        return parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
        return '';
    }
}

/**
 * Turn a list of client-supplied image values (https URLs, /api/img refs or
 * freshly uploaded data-URLs) into stored URLs plus the D1 statements that
 * persist them. Run the statements in the same batch as the owner row.
 *
 * Images this owner no longer references are only marked orphaned (and purged
 * a day later) so an admin "undo" can still restore them.
 */
export async function planImages(env, ownerType, ownerId, inputs, max = 10) {
    const urls = [];
    const statements = [];
    const keptIds = [];
    const refIds = [];

    // Remember each value's position in `inputs` so callers can keep data that runs
    // alongside the images (e.g. which colour a photo shows) lined up: sources[i] is the
    // index in `inputs` that urls[i] came from.
    const list = [];
    const positions = [];
    (Array.isArray(inputs) ? inputs : []).forEach((v, i) => {
        if (typeof v === 'string') {
            list.push(v);
            positions.push(i);
        }
    });
    const sources = [];

    // Which referenced media already exist, and who owns them?
    for (const value of list) {
        const id = mediaIdFromUrl(value.trim());
        if (id) refIds.push(id);
    }
    const owners = new Map();
    if (refIds.length > 0) {
        const unique = [...new Set(refIds)].slice(0, 50);
        const { results } = await env.DB.prepare(
            `SELECT id, owner_type, owner_id FROM media WHERE id IN (${unique.map(() => '?').join(',')})`
        )
            .bind(...unique)
            .all();
        for (const row of results || []) owners.set(row.id, row);
    }

    for (let li = 0; li < list.length; li += 1) {
        const raw = list[li];
        const keep = (url) => {
            urls.push(url);
            sources.push(positions[li]);
        };
        if (urls.length >= max) break;
        const value = raw.trim();

        const refId = mediaIdFromUrl(value);
        if (refId) {
            const owner = owners.get(refId);
            if (!owner || keptIds.includes(refId)) continue;
            if (owner.owner_type === ownerType && owner.owner_id === ownerId) {
                keptIds.push(refId);
                keep(mediaUrl(refId));
            } else {
                // e.g. a duplicated product: copy the image so each owner has its own row.
                const copyId = randomId();
                statements.push(
                    env.DB.prepare(
                        `INSERT INTO media (id, owner_type, owner_id, mime, data)
                         SELECT ?, ?, ?, mime, data FROM media WHERE id = ?`
                    ).bind(copyId, ownerType, ownerId, refId)
                );
                keptIds.push(copyId);
                keep(mediaUrl(copyId));
            }
            continue;
        }

        const data = DATA_URL.exec(value);
        if (data) {
            if (data[2].length > MAX_BASE64_CHARS) continue;
            const id = randomId();
            statements.push(
                env.DB.prepare(
                    'INSERT INTO media (id, owner_type, owner_id, mime, data) VALUES (?, ?, ?, ?, ?)'
                ).bind(id, ownerType, ownerId, data[1], data[2])
            );
            keptIds.push(id);
            keep(mediaUrl(id));
            continue;
        }

        const https = safeHttpsUrl(value);
        if (https) keep(https);
        else if (LOCAL_IMAGE.test(value) && !value.includes('..')) keep(value);
    }

    const now = Math.floor(Date.now() / 1000);
    const marks = keptIds.map(() => '?').join(',');
    statements.push(
        env.DB.prepare(
            `UPDATE media SET orphaned_at = ?
             WHERE owner_type = ? AND owner_id = ? AND orphaned_at IS NULL
             ${keptIds.length ? `AND id NOT IN (${marks})` : ''}`
        ).bind(now, ownerType, ownerId, ...keptIds)
    );
    if (keptIds.length) {
        statements.push(
            env.DB.prepare(`UPDATE media SET orphaned_at = NULL WHERE id IN (${marks})`).bind(...keptIds)
        );
    }
    statements.push(env.DB.prepare('DELETE FROM media WHERE orphaned_at < ?').bind(now - DAY));

    return { urls, statements, sources };
}

export function orphanOwnerMedia(env, ownerType, ownerId) {
    return env.DB.prepare(
        'UPDATE media SET orphaned_at = ? WHERE owner_type = ? AND owner_id = ? AND orphaned_at IS NULL'
    ).bind(Math.floor(Date.now() / 1000), ownerType, ownerId);
}

export function reviveOwnerMedia(env, ownerType, ownerId) {
    return env.DB.prepare(
        'UPDATE media SET orphaned_at = NULL WHERE owner_type = ? AND owner_id = ?'
    ).bind(ownerType, ownerId);
}
