/**
 * Delivery pricing by distance, shared by the browser (to explain prices) and the
 * server (to charge them), so both always agree.
 *
 *   - Free within `freeDeliveryMiles` of the showroom.
 *   - Beyond that, the standard charge `defaultDeliveryFee`.
 *   - Plus the extra of the furthest distance band reached, e.g.
 *       [{ overMiles: 40, extra: 15 }, { overMiles: 100, extra: 30 }]
 *     60 miles -> standard + £15, 120 miles -> standard + £30 (bands do not add up).
 */
import { formatGBP } from './pricing.js';

export const MAX_DELIVERY_BANDS = 10;

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return NaN;
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
};

/** Clean, sorted bands: miles 0.1–1000, extra £0–£1000, at most one band per distance. */
export function normaliseBands(raw) {
    if (!Array.isArray(raw)) return [];
    const byMiles = new Map();
    for (const band of raw) {
        const overMiles = Math.round(toNumber(band?.overMiles) * 10) / 10;
        const extra = Math.round(toNumber(band?.extra) * 100) / 100;
        if (!(overMiles > 0 && overMiles <= 1000) || !(extra >= 0 && extra <= 1000)) continue;
        byMiles.set(overMiles, { overMiles, extra });
    }
    return [...byMiles.values()].sort((a, b) => a.overMiles - b.overMiles).slice(0, MAX_DELIVERY_BANDS);
}

function rules(settings = {}) {
    const free = toNumber(settings?.freeDeliveryMiles);
    const base = toNumber(settings?.defaultDeliveryFee);
    return {
        freeMiles: free >= 0 ? free : 0,
        basePence: base > 0 ? Math.round(base * 100) : 0,
        bands: normaliseBands(settings?.deliveryBands),
    };
}

/** True when some deliveries cost money (so the distance has to be measured). */
export function chargesForDelivery(settings) {
    const { basePence, bands } = rules(settings);
    return basePence > 0 || bands.some((b) => b.extra > 0);
}

/** Delivery charge in pence for a distance in miles. */
export function deliveryPenceForMiles(settings, miles) {
    const { freeMiles, basePence, bands } = rules(settings);
    const distance = toNumber(miles);
    if (!(distance >= 0)) return basePence;
    if (distance <= freeMiles) return 0;
    let extraPence = 0;
    for (const band of bands) {
        if (distance > band.overMiles) extraPence = Math.round(band.extra * 100);
    }
    return basePence + extraPence;
}

/**
 * The price list, one row per distance range, for showing customers and the admin.
 * @returns [{ label, pence, free }]  `free` marks the free radius row
 */
export function deliveryPriceList(settings) {
    const { freeMiles, basePence, bands } = rules(settings);
    const rows = [];
    if (freeMiles > 0) rows.push({ label: `Up to ${freeMiles} miles`, pence: 0, free: true });
    // Each step starts a new price after the free radius.
    const steps = [
        { from: freeMiles, pence: basePence },
        ...bands
            .filter((b) => b.overMiles > freeMiles)
            .map((b) => ({ from: b.overMiles, pence: basePence + Math.round(b.extra * 100) })),
    ];
    steps.forEach((step, i) => {
        const next = steps[i + 1];
        let label;
        if (!next) label = step.from > 0 ? `Over ${step.from} miles` : 'Any distance';
        else label = step.from > 0 ? `${step.from} – ${next.from} miles` : `Up to ${next.from} miles`;
        rows.push({ label, pence: step.pence, free: false });
    });
    return rows;
}

/** Short form for tight spaces, e.g. "Free within 20 miles, then from £50.00". */
export function deliveryShortText(settings) {
    const { freeMiles } = rules(settings);
    return deliveryRuleText(settings)
        .replace(' of our Maltby showroom', '')
        .replace(' depending on distance', '')
        .replace(/\.$/, '')
        .replace(/^Free within (\S+) miles$/, freeMiles > 0 ? 'Free within $1 miles' : 'Free');
}

/** One-line summary, always leading with the free radius around the showroom. */
export function deliveryRuleText(settings) {
    const { freeMiles } = rules(settings);
    const free = freeMiles > 0 ? `Free within ${freeMiles} miles of our Maltby showroom` : '';
    if (!chargesForDelivery(settings)) return free ? `${free}.` : 'Free delivery.';

    const beyond = deliveryPriceList(settings).filter((r) => !r.free);
    const paid = beyond.map((r) => r.pence).filter((p) => p > 0);
    const lowest = formatGBP(Math.min(...paid) / 100);
    const flat = beyond.every((r) => r.pence === beyond[0].pence);
    if (!free) return flat ? `Delivery ${lowest}.` : `Delivery from ${lowest}, depending on distance.`;
    return flat ? `${free}, ${lowest} beyond.` : `${free}, then from ${lowest} depending on distance.`;
}
