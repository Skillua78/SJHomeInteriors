/**
 * Delivery charging by distance.
 *
 * Delivery is free within a set radius of the showroom, then a standard charge plus
 * any distance-band extra (see shared/delivery.js). Distance is the straight-line distance between the showroom's
 * postcode and the customer's, using coordinates from postcodes.io (a free,
 * open UK postcode service; only the postcode itself is sent).
 */
import { HttpError } from './http.js';
import { chargesForDelivery, deliveryPenceForMiles } from '../shared/delivery.js';

const LOOKUP = 'https://api.postcodes.io/postcodes/';
const EARTH_RADIUS_MILES = 3958.8;
const coordCache = new Map(); // per isolate; postcodes do not move

export function normalisePostcode(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/** Great-circle distance in miles between two { lat, lon } points. */
export function milesBetween(a, b) {
    const rad = (deg) => (deg * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Returns { lat, lon }, null when the postcode does not exist, or undefined when the lookup failed. */
async function locate(postcode) {
    const key = normalisePostcode(postcode);
    if (key.length < 5 || key.length > 7) return null;
    if (coordCache.has(key)) return coordCache.get(key);

    let res;
    try {
        res = await fetch(`${LOOKUP}${encodeURIComponent(key)}`, {
            headers: { Accept: 'application/json' },
        });
    } catch {
        return undefined;
    }
    if (res.status === 404) return null;
    if (!res.ok) return undefined;

    const data = await res.json().catch(() => null);
    const lat = Number(data?.result?.latitude);
    const lon = Number(data?.result?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const point = { lat, lon };
    if (coordCache.size < 500) coordCache.set(key, point);
    return point;
}

/**
 * Work out the delivery charge for a customer postcode.
 * @returns { pence, miles, checked }
 *   miles   distance from the showroom (1 decimal), or null if it could not be measured
 *   checked false when the lookup service was unavailable - the order is then not
 *           charged for delivery and is flagged so the shop can confirm by phone
 */
export async function deliveryCharge(settings, postcode) {
    // Nothing is ever charged, so there is no need to measure the distance.
    if (!chargesForDelivery(settings)) return { pence: 0, miles: null, checked: true };

    const [store, customer] = await Promise.all([
        locate(settings.storePostcode || 'S66 8JE'),
        locate(postcode),
    ]);

    if (customer === null) {
        throw new HttpError(400, 'We could not find that postcode. Please check it and try again.');
    }
    if (!store || !customer) return { pence: 0, miles: null, checked: false };

    const miles = Math.round(milesBetween(store, customer) * 10) / 10;
    return { pence: deliveryPenceForMiles(settings, miles), miles, checked: true };
}
