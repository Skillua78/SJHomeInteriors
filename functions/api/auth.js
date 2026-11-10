/**
 * /api/auth
 *   GET                   -> current session ({ user } or { user: null })
 *   POST ?action=register -> create a customer account
 *   POST ?action=login    -> customer or administrator sign-in
 *   POST ?action=google   -> Google Identity sign-in (customers only)
 *   POST ?action=logout   -> clear the session cookie
 *
 * Sessions live in an HttpOnly cookie; no secret or token is ever returned
 * to page JavaScript.
 */
import { HttpError, json, readJson, cleanText, clientIp, randomId } from '../../server/http.js';
import { rateLimit } from '../../server/rateLimit.js';
import {
    adminEmail,
    createSessionCookie,
    clearSessionCookie,
    getSession,
    hashPassword,
    verifyPassword,
    verifyAdminPassword,
} from '../../server/auth.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const INVALID_LOGIN = 'Incorrect email or password.';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email, phone: user.phone || '', role: user.role };
}

async function respondWithSession(env, user, status = 200) {
    return json({ success: true, user: publicUser(user) }, status, {
        'Set-Cookie': await createSessionCookie(env, user),
    });
}

export async function onRequestGet({ request, env }) {
    const session = await getSession(request, env);
    return json({ user: session ? publicUser(session) : null });
}

async function register(env, body, ip) {
    await rateLimit(env, `register:${ip}`, 5, 3600);

    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const phone = cleanText(body.phone, 30);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !EMAIL.test(email)) throw new HttpError(400, 'Please enter your name and a valid email address.');
    if (password.length < 10 || password.length > 200) {
        throw new HttpError(400, 'Password must be at least 10 characters long.');
    }
    if (email === adminEmail(env)) {
        throw new HttpError(403, 'This email is reserved for showroom administration.');
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) throw new HttpError(409, 'An account with this email already exists. Please sign in.');

    const { salt, hash } = await hashPassword(password);
    const id = `usr_${randomId(12)}`;
    await env.DB.prepare(
        `INSERT INTO users (id, name, email, phone, password_hash, salt, role)
         VALUES (?, ?, ?, ?, ?, ?, 'customer')`
    )
        .bind(id, name, email, phone, hash, salt)
        .run();

    return respondWithSession(env, { id, name, email, phone, role: 'customer' }, 201);
}

async function login(env, body, ip) {
    const email = cleanText(body.email, 254).toLowerCase();
    const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
    if (!email || !password) throw new HttpError(400, 'Email and password are required.');

    // Throttle by network address and by account to blunt password guessing.
    await rateLimit(env, `login-ip:${ip}`, 15, 600);
    await rateLimit(env, `login-acct:${email}`, 8, 900);

    if (email === adminEmail(env)) {
        if (!(await verifyAdminPassword(env, password))) throw new HttpError(401, INVALID_LOGIN);
        return respondWithSession(env, {
            id: 'admin_master',
            name: 'Showroom Admin',
            email,
            role: 'admin',
        });
    }

    const user = await env.DB.prepare(
        'SELECT id, name, email, phone, password_hash, salt FROM users WHERE email = ?'
    )
        .bind(email)
        .first();

    // Same response whether the account is missing, Google-only or the password is wrong.
    const valid = user?.password_hash
        ? await verifyPassword(password, user.salt, user.password_hash)
        : false;
    if (!valid) throw new HttpError(401, INVALID_LOGIN);

    return respondWithSession(env, { ...user, role: 'customer' });
}

async function google(env, body, ip) {
    await rateLimit(env, `google:${ip}`, 20, 600);

    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new HttpError(503, 'Google sign-in is not configured on this server.');

    const credential = typeof body.credential === 'string' ? body.credential : '';
    if (!credential || credential.length > 4096) throw new HttpError(400, 'Missing Google credential.');

    const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) throw new HttpError(401, 'Google sign-in could not be verified.');
    const token = await verifyRes.json();

    // The token must have been issued by Google *for this site* and still be valid.
    const valid =
        token.aud === clientId &&
        GOOGLE_ISSUERS.has(token.iss) &&
        Number(token.exp) * 1000 > Date.now() &&
        (token.email_verified === true || token.email_verified === 'true') &&
        token.sub &&
        token.email;
    if (!valid) throw new HttpError(401, 'Google sign-in could not be verified.');

    const email = String(token.email).toLowerCase().trim();
    if (email === adminEmail(env)) {
        throw new HttpError(403, 'Administrators must sign in with the admin password.');
    }
    const name = cleanText(token.name, 80) || email.split('@')[0];

    let user = await env.DB.prepare(
        'SELECT id, name, email, phone, google_id FROM users WHERE google_id = ?'
    )
        .bind(token.sub)
        .first();

    if (!user) {
        user = await env.DB.prepare('SELECT id, name, email, phone, google_id FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (user) {
            await env.DB.prepare('UPDATE users SET google_id = ? WHERE id = ? AND google_id IS NULL')
                .bind(token.sub, user.id)
                .run();
        } else {
            user = { id: `usr_${randomId(12)}`, name, email, phone: '' };
            await env.DB.prepare(
                `INSERT INTO users (id, name, email, google_id, role) VALUES (?, ?, ?, ?, 'customer')`
            )
                .bind(user.id, name, email, token.sub)
                .run();
        }
    }

    return respondWithSession(env, { ...user, role: 'customer' });
}

export async function onRequestPost({ request, env }) {
    const action = new URL(request.url).searchParams.get('action');

    if (action === 'logout') {
        return json({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
    }

    const body = await readJson(request, 8 * 1024);
    const ip = clientIp(request);

    if (action === 'register') return register(env, body, ip);
    if (action === 'login') return login(env, body, ip);
    if (action === 'google') return google(env, body, ip);
    throw new HttpError(400, 'Invalid action.');
}
