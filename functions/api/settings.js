/**
 * /api/settings
 *   GET  public  site settings + which payment methods are currently available
 *   PUT  admin   validated update
 */
import { json, readJson } from '../../server/http.js';
import { requireAdmin } from '../../server/auth.js';
import { loadSettings, sanitizeSettings, paymentOptions } from '../../server/settings.js';

const MAX_SETTINGS_BODY = 12 * 1024 * 1024; // may include new slideshow uploads

function present(env, settings) {
    return {
        ...settings,
        paymentOptions: paymentOptions(env, settings),
        // Booleans only - the keys themselves never leave the server.
        stripeConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    };
}

export async function onRequestGet({ env }) {
    return json(present(env, await loadSettings(env)), 200, { 'Cache-Control': 'no-cache' });
}

export async function onRequestPut({ request, env }) {
    await requireAdmin(request, env);
    const body = await readJson(request, MAX_SETTINGS_BODY);
    const { settings, statements } = await sanitizeSettings(env, body);
    await env.DB.batch(statements);
    return json({ success: true, settings: present(env, settings) });
}
