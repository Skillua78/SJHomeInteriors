/**
 * /api/settings
 * GET -> Returns global site settings (contact info, hero slideshow, text, payment status)
 * PUT -> Admin-only update of global site settings into Cloudflare D1
 */

import { validateSafeImageUrl } from '../../src/utils/security';

export const DEFAULT_SITE_SETTINGS = {
    phone: '07830 141250',
    email: 'info@sjhomeinteriors.co.uk',
    address: 'High Street, Maltby, Rotherham, S66 8JE',
    openingHours: 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM',
    facebookUrl: '',
    whatsappNumber: '',
    announcementText: 'Visit Our Maltby Showroom • Fast Local Delivery Across South Yorkshire',
    heroBadge: 'Maltby Showroom & Online Collection',
    heroTitle: 'Luxury Sofas, Beds & Timeless Living',
    heroSubtitle:
        'Handcrafted comfort tailored for British homes. Explore our curated collection in-store on High Street, Maltby or order online with two-person room-of-choice delivery.',
    heroImages: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85',
    ],
    catalogSubtitle: 'Showroom & Online Collection',
    catalogTitle: 'Explore Our Furniture',
    paymentEnabled: true,
    paymentMaintenanceMessage:
        'Payment section currently under maintenance. Please contact us directly to place your order or arrange showroom payment.',
    allowCashOnDelivery: true,
    allowShowroomPayment: true,
    allowBankTransfer: false,
    bankTransferInstructions: '',
};

function verifyAdmin(request, env) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const validSecret = env.ADMIN_API_KEY;
    return Boolean(validSecret && token === validSecret);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache',
        },
    });
}

async function ensureTable(env) {
    await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      settings_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    ).run();
}

export async function onRequestGet({ env }) {
    try {
        await ensureTable(env);
        const row = await env.DB.prepare(
            'SELECT settings_json FROM site_settings WHERE id = 1'
        ).first();

        if (!row || !row.settings_json) {
            return jsonResponse(DEFAULT_SITE_SETTINGS);
        }

        const parsed = JSON.parse(row.settings_json);
        return jsonResponse({ ...DEFAULT_SITE_SETTINGS, ...parsed });
    } catch (err) {
        return jsonResponse(DEFAULT_SITE_SETTINGS);
    }
}

export async function onRequestPut({ request, env }) {
    if (!verifyAdmin(request, env)) {
        return jsonResponse({ error: 'Unauthorized: Invalid admin key.' }, 401);
    }

    try {
        await ensureTable(env);
        const body = await request.json();

        const rawHeroImages = Array.isArray(body.heroImages) ? body.heroImages : [];
        const cleanHeroImages = rawHeroImages
            .map((u) => (typeof u === 'string' ? u.trim() : ''))
            .filter((u) => u.startsWith('https://') || u.startsWith('data:image/'))
            .slice(0, 10);

        const sanitized = {
            phone: String(body.phone ?? DEFAULT_SITE_SETTINGS.phone).slice(0, 40),
            email: String(body.email ?? DEFAULT_SITE_SETTINGS.email).slice(0, 100),
            address: String(body.address ?? DEFAULT_SITE_SETTINGS.address).slice(0, 200),
            openingHours: String(body.openingHours ?? DEFAULT_SITE_SETTINGS.openingHours).slice(0, 160),
            facebookUrl: String(body.facebookUrl ?? '').trim().slice(0, 300),
            whatsappNumber: String(body.whatsappNumber ?? '').trim().slice(0, 60),
            announcementText: String(body.announcementText ?? DEFAULT_SITE_SETTINGS.announcementText).slice(0, 200),
            heroBadge: String(body.heroBadge ?? DEFAULT_SITE_SETTINGS.heroBadge).slice(0, 80),
            heroTitle: String(body.heroTitle ?? DEFAULT_SITE_SETTINGS.heroTitle).slice(0, 140),
            heroSubtitle: String(body.heroSubtitle ?? DEFAULT_SITE_SETTINGS.heroSubtitle).slice(0, 500),
            heroImages: cleanHeroImages.length > 0 ? cleanHeroImages : DEFAULT_SITE_SETTINGS.heroImages,
            catalogSubtitle: String(body.catalogSubtitle ?? DEFAULT_SITE_SETTINGS.catalogSubtitle).slice(0, 80),
            catalogTitle: String(body.catalogTitle ?? DEFAULT_SITE_SETTINGS.catalogTitle).slice(0, 100),
            paymentEnabled: Boolean(body.paymentEnabled),
            paymentMaintenanceMessage: String(
                body.paymentMaintenanceMessage || DEFAULT_SITE_SETTINGS.paymentMaintenanceMessage
            ).slice(0, 400),
            allowCashOnDelivery: Boolean(body.allowCashOnDelivery ?? true),
            allowShowroomPayment: Boolean(body.allowShowroomPayment ?? true),
            allowBankTransfer: Boolean(body.allowBankTransfer ?? false),
            bankTransferInstructions: String(body.bankTransferInstructions ?? '').slice(0, 500),
        };

        await env.DB.prepare(
            `INSERT INTO site_settings (id, settings_json, updated_at)
       VALUES (1, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         settings_json = excluded.settings_json,
         updated_at = CURRENT_TIMESTAMP`
        )
            .bind(JSON.stringify(sanitized))
            .run();

        return jsonResponse({ success: true, settings: sanitized });
    } catch (err) {
        return jsonResponse({ error: 'Failed to save settings', details: err.message }, 500);
    }
}