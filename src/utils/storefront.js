/**
 * Small pure helpers behind the storefront widgets (see tests/storefront.test.js).
 */
import { formatGBP } from '../../shared/pricing.js';

export const DEFAULT_SHOWROOM_PHONE = '07830 141250';
export const MAX_COMPARE = 4;

/** International digits for wa.me, e.g. "07830 141250" -> "447830141250". */
export function whatsAppDigits(raw) {
    let digits = String(raw || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) digits = `44${digits.slice(1)}`;
    return digits.length >= 10 && digits.length <= 15 ? digits : '';
}

/**
 * WhatsApp chat link. Uses the shop's WhatsApp number, else its phone number,
 * else the showroom number.
 */
export function whatsAppLink(siteSettings, message = '') {
    const settings = siteSettings || {};
    const fromLink = /wa\.me\/(\d+)/.exec(String(settings.whatsappNumber || ''));
    const digits =
        (fromLink && fromLink[1]) ||
        whatsAppDigits(settings.whatsappNumber) ||
        whatsAppDigits(settings.phone) ||
        whatsAppDigits(DEFAULT_SHOWROOM_PHONE);
    const text = String(message || '').slice(0, 900);
    return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Pre-filled message about a product and the options the customer has picked. */
export function productEnquiryMessage(product, selections = {}, price) {
    if (!product) return 'Hello SJ Home Interiors, I have a question about your furniture.';
    const labels = { color: 'Colour', fabric: 'Fabric', size: 'Size', mattress: 'Mattress', lift: 'Lift' };
    const chosen = Object.entries(labels)
        .filter(([key]) => selections[key])
        .map(([key, label]) => `${label}: ${selections[key]}`);
    return [
        `Hello SJ Home Interiors, I'm interested in the ${product.name}`,
        Number(price) > 0 ? `(${formatGBP(price)})` : '',
        chosen.length ? `- ${chosen.join(', ')}.` : '.',
        'Could you tell me more?',
    ]
        .filter(Boolean)
        .join(' ')
        .replace(' .', '.');
}

/**
 * Promotion banner state. Only shows while enabled AND before its end date, so an
 * expired countdown never keeps running or resets.
 * Returns null when hidden, else { remainingMs, parts: { days, hours, minutes, seconds } | null }.
 */
export function promoState(siteSettings, now = Date.now()) {
    const s = siteSettings || {};
    if (!s.promoEnabled || !String(s.promoText || '').trim()) return null;
    if (!s.promoEndDate) return { remainingMs: null, parts: null };
    const end = Date.parse(s.promoEndDate);
    if (!Number.isFinite(end)) return { remainingMs: null, parts: null };
    const remainingMs = end - now;
    if (remainingMs <= 0) return null;
    const total = Math.floor(remainingMs / 1000);
    return {
        remainingMs,
        parts: {
            days: Math.floor(total / 86400),
            hours: Math.floor((total % 86400) / 3600),
            minutes: Math.floor((total % 3600) / 60),
            seconds: total % 60,
        },
    };
}

/** Add or remove a product from the comparison list. Returns { list, error? }. */
export function toggleCompare(list, product, max = MAX_COMPARE) {
    if (list.some((p) => p.id === product.id)) return { list: list.filter((p) => p.id !== product.id) };
    if (list.length >= max) {
        return { list, error: `You can compare up to ${max} items. Remove one to add another.` };
    }
    return { list: [...list, product] };
}

/**
 * Pick similar products: same subcategory first, then same category, never the
 * current product, at most `limit`.
 */
export function pickSimilar(current, sameSub = [], sameCategory = [], limit = 4) {
    const seen = new Set([current?.id]);
    const out = [];
    for (const p of [...sameSub, ...sameCategory]) {
        if (!p || seen.has(p.id) || p.isHidden) continue;
        seen.add(p.id);
        out.push(p);
        if (out.length >= limit) break;
    }
    return out;
}
