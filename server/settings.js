/**
 * Site settings: defaults, loading and strict validation of admin input.
 */
import { cleanText } from './http.js';
import { planImages } from './media.js';

export const DEFAULT_SITE_SETTINGS = {
    phone: '07830 141250',
    email: 'info@sjhomeinteriors.co.uk',
    address: 'High Street, Maltby, Rotherham, S66 8JE',
    openingHours: 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM',
    facebookUrl: '',
    whatsappNumber: '',
    announcementText: 'Unbeatable Showroom Value • High-Quality Furniture at Affordable Direct Prices',
    heroBadge: 'Maltby Showroom • Quality Furniture, Affordable Prices',
    heroTitle: 'Quality Sofas, Beds & Dining at Prices You’ll Love',
    heroSubtitle:
        'Why pay inflated high-street retail markups? We supply durable, British-built sofas, ottoman beds, and dining sets at honest, affordable showroom prices—complete with fast local delivery.',
    heroImages: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85',
    ],
    catalogSubtitle: 'Showroom & Online Collection',
    catalogTitle: 'Explore Our Furniture',
    showAssemblyHighlight: true,
    assemblyTitle: 'Two-Person Delivery & Assembly',
    assemblySubtitle: 'From £50 per item',
    defaultDeliveryFee: 50,
    customCategories: {},
    removedCategories: [],
    customColors: {},
    removedColors: [],
    customFabricImages: {},
    savedPresets: {
        fabrics: [],
        removedFabrics: [],
        sizes: [],
        removedSizes: [],
        mattresses: [],
        removedMattresses: [],
        liftOptions: [],
        removedLiftOptions: [],
    },
    paymentEnabled: true,
    paymentMaintenanceMessage:
        'Payment section currently under maintenance. Please contact us directly to place your order or arrange showroom payment.',
    allowCardPayment: true,
    allowKlarna: true,
    allowCashOnDelivery: true,
    allowShowroomPayment: true,
    allowBankTransfer: false,
    bankTransferInstructions: '',
};

const PRESET_KEYS = Object.keys(DEFAULT_SITE_SETTINGS.savedPresets);

function stringList(value, maxItems, maxLen) {
    if (!Array.isArray(value)) return [];
    const out = [];
    for (const item of value) {
        const clean = cleanText(item, maxLen);
        if (clean && !out.includes(clean)) out.push(clean);
        if (out.length >= maxItems) break;
    }
    return out;
}

function plainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function httpsUrl(value, max = 300) {
    const raw = cleanText(value, max);
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
        return '';
    }
}

function bool(value, fallback) {
    return value === undefined || value === null ? fallback : Boolean(value);
}

function text(body, key, max) {
    return cleanText(body[key] ?? DEFAULT_SITE_SETTINGS[key], max);
}

export async function loadSettings(env) {
    let stored = {};
    try {
        const row = await env.DB.prepare('SELECT settings_json FROM site_settings WHERE id = 1').first();
        if (row?.settings_json) stored = plainObject(JSON.parse(row.settings_json));
    } catch {
        stored = {};
    }

    const merged = { ...DEFAULT_SITE_SETTINGS, ...stored };
    merged.savedPresets = { ...DEFAULT_SITE_SETTINGS.savedPresets, ...plainObject(stored.savedPresets) };

    // Values saved before validation existed are re-checked on the way out.
    merged.facebookUrl = httpsUrl(merged.facebookUrl);

    // Delivery & assembly used to be advertised as free; it is now a paid service.
    if (/free/i.test(String(merged.assemblySubtitle || ''))) {
        merged.assemblySubtitle = `From £${Number(merged.defaultDeliveryFee) || 50} per item`;
    }

    // Legacy: slideshow pictures stored inline as data-URLs -> move to media rows once.
    if (Array.isArray(stored.heroImages) && stored.heroImages.some((u) => String(u).startsWith('data:'))) {
        const { urls, statements } = await planImages(env, 'site', 'hero', stored.heroImages, 10);
        merged.heroImages = urls.length ? urls : DEFAULT_SITE_SETTINGS.heroImages;
        statements.push(
            env.DB.prepare('UPDATE site_settings SET settings_json = ? WHERE id = 1').bind(
                JSON.stringify({ ...stored, heroImages: merged.heroImages })
            )
        );
        await env.DB.batch(statements);
    }

    return merged;
}

export function deliveryFeePence(settings) {
    const pounds = Number(settings?.defaultDeliveryFee);
    return Number.isFinite(pounds) && pounds >= 0 ? Math.round(pounds * 100) : 5000;
}

/** Validate an admin settings payload. Returns { settings, statements }. */
export async function sanitizeSettings(env, body) {
    const statements = [];

    const hero = await planImages(env, 'site', 'hero', body.heroImages, 10);
    statements.push(...hero.statements);

    const customColors = {};
    for (const [name, hex] of Object.entries(plainObject(body.customColors)).slice(0, 300)) {
        const cleanName = cleanText(name, 40);
        if (cleanName && /^#[0-9a-fA-F]{6}$/.test(String(hex))) customColors[cleanName] = String(hex);
    }

    const customCategories = {};
    for (const [name, subs] of Object.entries(plainObject(body.customCategories)).slice(0, 60)) {
        const cleanName = cleanText(name, 40);
        if (cleanName) customCategories[cleanName] = stringList(subs, 40, 40);
    }

    const rawPresets = plainObject(body.savedPresets);
    const savedPresets = {};
    for (const key of PRESET_KEYS) savedPresets[key] = stringList(rawPresets[key], 100, 80);

    // Optional per-fabric swatch charts.
    const customFabricImages = {};
    const fabricEntries = Object.entries(plainObject(body.customFabricImages)).slice(0, 40);
    if (fabricEntries.length) {
        const planned = await planImages(
            env,
            'site',
            'fabric',
            fabricEntries.map(([, url]) => url),
            40
        );
        statements.push(...planned.statements);
        // planImages drops invalid entries, so only map when every image survived.
        if (planned.urls.length === fabricEntries.length) {
            fabricEntries.forEach(([name], idx) => {
                const cleanName = cleanText(name, 80);
                if (cleanName) customFabricImages[cleanName] = planned.urls[idx];
            });
        }
    }

    const fee = Number(body.defaultDeliveryFee);

    const settings = {
        phone: text(body, 'phone', 40),
        email: text(body, 'email', 100),
        address: text(body, 'address', 200),
        openingHours: text(body, 'openingHours', 160),
        facebookUrl: httpsUrl(body.facebookUrl),
        whatsappNumber: /^https?:/i.test(String(body.whatsappNumber || ''))
            ? httpsUrl(body.whatsappNumber)
            : cleanText(body.whatsappNumber, 30).replace(/[^0-9+ ]/g, ''),
        announcementText: text(body, 'announcementText', 200),
        heroBadge: text(body, 'heroBadge', 80),
        heroTitle: text(body, 'heroTitle', 140),
        heroSubtitle: text(body, 'heroSubtitle', 500),
        heroImages: hero.urls.length ? hero.urls : DEFAULT_SITE_SETTINGS.heroImages,
        catalogSubtitle: text(body, 'catalogSubtitle', 80),
        catalogTitle: text(body, 'catalogTitle', 100),
        showAssemblyHighlight: bool(body.showAssemblyHighlight, true),
        assemblyTitle: text(body, 'assemblyTitle', 80),
        assemblySubtitle: text(body, 'assemblySubtitle', 80),
        defaultDeliveryFee:
            Number.isFinite(fee) && fee >= 0 && fee <= 2000
                ? Math.round(fee * 100) / 100
                : DEFAULT_SITE_SETTINGS.defaultDeliveryFee,
        customCategories,
        removedCategories: stringList(body.removedCategories, 100, 40),
        customColors,
        removedColors: stringList(body.removedColors, 300, 40),
        customFabricImages,
        savedPresets,
        paymentEnabled: bool(body.paymentEnabled, true),
        paymentMaintenanceMessage:
            cleanText(body.paymentMaintenanceMessage, 400) ||
            DEFAULT_SITE_SETTINGS.paymentMaintenanceMessage,
        allowCardPayment: bool(body.allowCardPayment, true),
        allowKlarna: bool(body.allowKlarna, true),
        allowCashOnDelivery: bool(body.allowCashOnDelivery, true),
        allowShowroomPayment: bool(body.allowShowroomPayment, true),
        allowBankTransfer: bool(body.allowBankTransfer, false),
        bankTransferInstructions: cleanText(body.bankTransferInstructions, 500),
    };

    statements.push(
        env.DB.prepare(
            `INSERT INTO site_settings (id, settings_json, updated_at)
             VALUES (1, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
               settings_json = excluded.settings_json,
               updated_at = CURRENT_TIMESTAMP`
        ).bind(JSON.stringify(settings))
    );

    return { settings, statements };
}

/** Which payment methods the checkout may offer right now. */
export function paymentOptions(env, settings) {
    const stripeReady = Boolean(env.STRIPE_SECRET_KEY);
    return {
        card: stripeReady && settings.allowCardPayment !== false,
        klarna: stripeReady && settings.allowKlarna !== false,
        cod: settings.allowCashOnDelivery !== false,
        showroom: settings.allowShowroomPayment !== false,
        bacs: Boolean(settings.allowBankTransfer),
    };
}
