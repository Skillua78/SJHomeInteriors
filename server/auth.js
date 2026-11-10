/**
 * Session + credential helpers (Web Crypto only, no dependencies).
 *
 * Sessions are HS256 JWTs carried in an HttpOnly, Secure, SameSite=Strict
 * cookie, so page JavaScript can never read them. The signing key is
 * env.JWT_SECRET; when that is not configured yet it is derived from
 * ADMIN_API_KEY so an existing deployment keeps working. ADMIN_API_KEY itself
 * is never sent to a browser.
 */
import { HttpError } from './http.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = '__Host-sj_session';
const ADMIN_TTL = 60 * 60 * 12; // 12 hours
const CUSTOMER_TTL = 60 * 60 * 24 * 30; // 30 days
const PBKDF2_ITERATIONS = 100000; // Workers runtime maximum

export function adminEmail(env) {
    return String(env.ADMIN_EMAIL || 'info@sjhomeinteriors.co.uk').trim().toLowerCase();
}

/* ---------- encoding ---------- */

function b64urlFromBytes(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesFromB64url(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
}

export function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function fromHex(hex) {
    const clean = String(hex || '');
    if (!/^([0-9a-f]{2})+$/i.test(clean)) return new Uint8Array();
    return new Uint8Array(clean.match(/.{2}/g).map((h) => parseInt(h, 16)));
}

/** Constant-time string comparison (compares SHA-256 digests byte by byte). */
export async function timingSafeEqual(a, b) {
    const [da, db] = await Promise.all([
        crypto.subtle.digest('SHA-256', enc.encode(String(a))),
        crypto.subtle.digest('SHA-256', enc.encode(String(b))),
    ]);
    const x = new Uint8Array(da);
    const y = new Uint8Array(db);
    let diff = 0;
    for (let i = 0; i < x.length; i += 1) diff |= x[i] ^ y[i];
    return diff === 0;
}

/* ---------- JWT (HS256) ---------- */

async function hmacKey(secret, usages) {
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        usages
    );
}

export async function signJwt(payload, secret, ttlSeconds, now = Date.now()) {
    const iat = Math.floor(now / 1000);
    const header = b64urlFromBytes(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const body = b64urlFromBytes(
        enc.encode(JSON.stringify({ ...payload, iat, exp: iat + ttlSeconds }))
    );
    const key = await hmacKey(secret, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
    return `${header}.${body}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

/** Returns the payload, or null when the token is malformed, forged or expired. */
export async function verifyJwt(token, secret, now = Date.now()) {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const header = JSON.parse(dec.decode(bytesFromB64url(parts[0])));
        if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

        const key = await hmacKey(secret, ['verify']);
        const ok = await crypto.subtle.verify(
            'HMAC',
            key,
            bytesFromB64url(parts[2]),
            enc.encode(`${parts[0]}.${parts[1]}`)
        );
        if (!ok) return null;

        const payload = JSON.parse(dec.decode(bytesFromB64url(parts[1])));
        if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return null;
        return payload;
    } catch {
        return null;
    }
}

let derivedSecret = null;

async function sessionSecret(env) {
    if (env.JWT_SECRET && String(env.JWT_SECRET).length >= 32) return String(env.JWT_SECRET);
    if (env.ADMIN_API_KEY) {
        if (!derivedSecret) {
            const key = await hmacKey(String(env.ADMIN_API_KEY), ['sign']);
            derivedSecret = toHex(await crypto.subtle.sign('HMAC', key, enc.encode('sj-session-v1')));
        }
        return derivedSecret;
    }
    throw new HttpError(503, 'Sign-in is not configured on this server yet.');
}

/* ---------- cookies & sessions ---------- */

function readCookie(request, name) {
    const header = request.headers.get('Cookie') || '';
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx > -1 && part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
    }
    return '';
}

export async function createSessionCookie(env, user) {
    const ttl = user.role === 'admin' ? ADMIN_TTL : CUSTOMER_TTL;
    const token = await signJwt(
        { sub: user.id, role: user.role, name: user.name, email: user.email },
        await sessionSecret(env),
        ttl
    );
    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ttl}`;
}

export function clearSessionCookie() {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/** Returns { id, role, name, email } or null. */
export async function getSession(request, env) {
    const token = readCookie(request, SESSION_COOKIE);
    if (!token) return null;
    let secret;
    try {
        secret = await sessionSecret(env);
    } catch {
        return null;
    }
    const payload = await verifyJwt(token, secret);
    if (!payload || !payload.sub) return null;
    // Admin role is only honoured for the configured admin identity.
    const role = payload.role === 'admin' && payload.email === adminEmail(env) ? 'admin' : 'customer';
    return { id: payload.sub, role, name: payload.name || '', email: payload.email || '' };
}

export async function isAdmin(request, env) {
    const session = await getSession(request, env);
    return session?.role === 'admin';
}

export async function requireAdmin(request, env) {
    const session = await getSession(request, env);
    if (!session) throw new HttpError(401, 'Please sign in again to continue.');
    if (session.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
    return session;
}

/* ---------- passwords ---------- */

async function pbkdf2Hex(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
    const material = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
        material,
        256
    );
    return toHex(bits);
}

export async function hashPassword(password) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    return { salt: toHex(saltBytes), hash: await pbkdf2Hex(password, saltBytes) };
}

export async function verifyPassword(password, saltHex, expectedHash) {
    const salt = fromHex(saltHex);
    if (!salt.length || !expectedHash) return false;
    return timingSafeEqual(await pbkdf2Hex(password, salt), String(expectedHash).toLowerCase());
}

/**
 * Admin password check. Supported ADMIN_PASSWORD_HASH formats:
 *   pbkdf2$<iterations>$<saltHex>$<hashHex>   (recommended - see README)
 *   <64 hex chars>                             (legacy unsalted SHA-256)
 * With no hash configured, ADMIN_API_KEY doubles as the password (legacy).
 */
export async function verifyAdminPassword(env, password) {
    const configured = String(env.ADMIN_PASSWORD_HASH || '').trim();
    if (configured.startsWith('pbkdf2$')) {
        const [, iter, saltHex, hashHex] = configured.split('$');
        const iterations = Math.min(PBKDF2_ITERATIONS, Math.max(1000, parseInt(iter, 10) || 0));
        const salt = fromHex(saltHex);
        if (!salt.length || !hashHex) return false;
        return timingSafeEqual(await pbkdf2Hex(password, salt, iterations), hashHex.toLowerCase());
    }
    if (configured) {
        const digest = toHex(await crypto.subtle.digest('SHA-256', enc.encode(password)));
        return timingSafeEqual(digest, configured.toLowerCase());
    }
    if (env.ADMIN_API_KEY) return timingSafeEqual(password, String(env.ADMIN_API_KEY));
    return false;
}
