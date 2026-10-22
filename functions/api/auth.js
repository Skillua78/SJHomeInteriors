/**
 * /api/auth
 * POST ?action=register   -> Register new customer into D1 (role forced to 'customer')
 * POST ?action=login      -> Validate credentials against D1 or strict Admin config
 * POST ?action=google     -> Verify Google OAuth credential and sync to D1
 */

const HARDCODED_ADMIN_EMAIL = 'info@sjhomeinteriors.co.uk';

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

// PBKDF2-HMAC-SHA256 Password Hashing via Web Crypto API
async function hashPasswordWithSalt(password, saltHex) {
    const enc = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        256
    );
    return Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function generateRandomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function onRequestPost({ request, env }) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    try {
        const body = await request.json();

        // =========================================================================
        // 1. REGISTER
        // =========================================================================
        if (action === 'register') {
            const { name, email, phone, password } = body;
            const cleanEmail = (email || '').trim().toLowerCase();
            const cleanName = (name || '').trim();

            if (!cleanEmail || !password || !cleanName) {
                return jsonResponse({ error: 'Name, email, and password are required.' }, 400);
            }
            if (password.length < 8) {
                return jsonResponse({ error: 'Password must be at least 8 characters long.' }, 400);
            }

            // Security Lockdown: Never allow public registration of admin email
            if (cleanEmail === HARDCODED_ADMIN_EMAIL) {
                return jsonResponse({ error: 'This email is reserved for showroom administration.' }, 403);
            }

            // Check if user already exists
            const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
                .bind(cleanEmail)
                .first();

            if (existing) {
                return jsonResponse({ error: 'An account with this email already exists. Please sign in.' }, 409);
            }

            // Hash password and store user
            const salt = generateRandomSalt();
            const passwordHash = await hashPasswordWithSalt(password, salt);
            const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            await env.DB.prepare(
                `INSERT INTO users (id, name, email, phone, password_hash, salt, role)
         VALUES (?, ?, ?, ?, ?, ?, 'customer')`
            )
                .bind(userId, cleanName.slice(0, 80), cleanEmail, (phone || '').slice(0, 30), passwordHash, salt)
                .run();

            return jsonResponse(
                {
                    success: true,
                    user: {
                        id: userId,
                        name: cleanName,
                        email: cleanEmail,
                        phone: phone || '',
                        role: 'customer',
                    },
                },
                201
            );
        }

        // =========================================================================
        // 2. LOGIN
        // =========================================================================
        if (action === 'login') {
            const { email, password } = body;
            const cleanEmail = (email || '').trim().toLowerCase();

            if (!cleanEmail || !password) {
                return jsonResponse({ error: 'Email and password are required.' }, 400);
            }

            // STRICT ADMIN CHECK: Only HARDCODED_ADMIN_EMAIL can be evaluated for admin status
            if (cleanEmail === HARDCODED_ADMIN_EMAIL) {
                const configuredAdminSecret = env.ADMIN_API_KEY;
                const configuredAdminHash = env.ADMIN_PASSWORD_HASH;

                // Verify either against ADMIN_PASSWORD_HASH (SHA-256) or direct ADMIN_API_KEY
                let isAuthorized = false;

                if (configuredAdminHash) {
                    const enc = new TextEncoder();
                    const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(password));
                    const inputHash = Array.from(new Uint8Array(hashBuf))
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');
                    if (inputHash.toLowerCase() === configuredAdminHash.toLowerCase()) {
                        isAuthorized = true;
                    }
                } else if (configuredAdminSecret && password === configuredAdminSecret) {
                    isAuthorized = true;
                }

                if (isAuthorized) {
                    return jsonResponse({
                        success: true,
                        user: {
                            id: 'admin_master',
                            name: 'Showroom Admin',
                            email: HARDCODED_ADMIN_EMAIL,
                            role: 'admin',
                            token: configuredAdminSecret, // Auto-provisions API key for admin session
                        },
                    });
                } else {
                    return jsonResponse({ error: 'Invalid administrator credentials.' }, 401);
                }
            }

            // STANDARD CUSTOMER DATABASE CHECK
            const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
                .bind(cleanEmail)
                .first();

            if (!user) {
                return jsonResponse({ error: 'No account found with this email. Please register first.' }, 404);
            }

            if (!user.password_hash || !user.salt) {
                return jsonResponse(
                    { error: 'This account was created with Google. Please use Google Sign-In.' },
                    400
                );
            }

            const computedHash = await hashPasswordWithSalt(password, user.salt);
            if (computedHash !== user.password_hash) {
                return jsonResponse({ error: 'Incorrect password. Please try again.' }, 401);
            }

            return jsonResponse({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                    role: 'customer',
                },
            });
        }

        // =========================================================================
        // 3. GOOGLE SIGN-IN / REGISTER
        // =========================================================================
        if (action === 'google') {
            const { credential } = body;
            if (!credential) {
                return jsonResponse({ error: 'Missing Google credential token.' }, 400);
            }

            // Verify token with Google's public tokeninfo endpoint
            const verifyRes = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
            );
            if (!verifyRes.ok) {
                return jsonResponse({ error: 'Failed to verify Google authentication token.' }, 401);
            }

            const payload = await verifyRes.json();
            const googleId = payload.sub;
            const googleEmail = (payload.email || '').toLowerCase().trim();
            const googleName = payload.name || googleEmail.split('@')[0];

            if (!googleEmail) {
                return jsonResponse({ error: 'Google account did not return a valid email address.' }, 400);
            }

            // Check if user exists by google_id or email
            let user = await env.DB.prepare(
                'SELECT * FROM users WHERE google_id = ? OR email = ?'
            )
                .bind(googleId, googleEmail)
                .first();

            if (!user) {
                // Create new customer account from Google Profile
                const newId = `usr_g_${Date.now()}`;
                await env.DB.prepare(
                    `INSERT INTO users (id, name, email, google_id, role)
           VALUES (?, ?, ?, ?, 'customer')`
                )
                    .bind(newId, googleName.slice(0, 80), googleEmail, googleId)
                    .run();

                user = {
                    id: newId,
                    name: googleName,
                    email: googleEmail,
                    phone: '',
                    role: 'customer',
                };
            } else if (!user.google_id) {
                // Link google_id if account was originally created via email
                await env.DB.prepare('UPDATE users SET google_id = ? WHERE id = ?')
                    .bind(googleId, user.id)
                    .run();
            }

            return jsonResponse({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                    role: user.role === 'admin' && googleEmail === HARDCODED_ADMIN_EMAIL ? 'admin' : 'customer',
                },
            });
        }

        return jsonResponse({ error: 'Invalid action.' }, 400);
    } catch (err) {
        return jsonResponse({ error: 'Authentication service error', details: err.message }, 500);
    }
}