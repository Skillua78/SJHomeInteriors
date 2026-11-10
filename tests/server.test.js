import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { signJwt, verifyJwt, timingSafeEqual, hashPassword, verifyPassword, verifyAdminPassword } from '../server/auth.js';
import { verifyStripeSignature, formEncode } from '../server/stripe.js';
import { validateProduct } from '../server/products.js';
import { validateCustomer } from '../server/orders.js';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

describe('session tokens', () => {
    it('round-trips a signed token', async () => {
        const token = await signJwt({ sub: 'u1', role: 'customer' }, SECRET, 60);
        expect(await verifyJwt(token, SECRET)).toMatchObject({ sub: 'u1', role: 'customer' });
    });

    it('rejects tampering, the wrong key, expiry and alg=none', async () => {
        const token = await signJwt({ sub: 'u1', role: 'customer' }, SECRET, 60);
        const [h, , s] = token.split('.');
        const forgedBody = Buffer.from(JSON.stringify({ sub: 'u1', role: 'admin', exp: 9999999999 })).toString('base64url');
        expect(await verifyJwt(`${h}.${forgedBody}.${s}`, SECRET)).toBeNull();
        expect(await verifyJwt(token, 'another-secret')).toBeNull();
        expect(await verifyJwt(token, SECRET, Date.now() + 61_000)).toBeNull();

        const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        expect(await verifyJwt(`${none}.${forgedBody}.`, SECRET)).toBeNull();
        expect(await verifyJwt('garbage', SECRET)).toBeNull();
    });
});

describe('passwords', () => {
    it('verifies salted PBKDF2 hashes', async () => {
        const { salt, hash } = await hashPassword('correct horse battery');
        expect(await verifyPassword('correct horse battery', salt, hash)).toBe(true);
        expect(await verifyPassword('wrong', salt, hash)).toBe(false);
        expect(await verifyPassword('x', '', hash)).toBe(false);
    });

    it('accepts each supported admin password format', async () => {
        const { salt, hash } = await hashPassword('admin-pass');
        expect(await verifyAdminPassword({ ADMIN_PASSWORD_HASH: `pbkdf2$100000$${salt}$${hash}` }, 'admin-pass')).toBe(true);
        expect(await verifyAdminPassword({ ADMIN_PASSWORD_HASH: `pbkdf2$100000$${salt}$${hash}` }, 'nope')).toBe(false);
        // legacy unsalted SHA-256 of "abc"
        const sha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
        expect(await verifyAdminPassword({ ADMIN_PASSWORD_HASH: sha }, 'abc')).toBe(true);
        expect(await verifyAdminPassword({ ADMIN_API_KEY: 'key-as-password' }, 'key-as-password')).toBe(true);
        expect(await verifyAdminPassword({}, '')).toBe(false);
    });

    it('compares strings without early exit', async () => {
        expect(await timingSafeEqual('abc', 'abc')).toBe(true);
        expect(await timingSafeEqual('abc', 'abd')).toBe(false);
    });
});

describe('Stripe webhook signatures', () => {
    const secret = 'whsec_test';
    const body = '{"type":"checkout.session.completed"}';
    const sign = (t, payload = body, key = secret) =>
        `t=${t},v1=${createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')}`;
    const now = 1_800_000_000_000;
    const t = now / 1000;

    it('accepts a valid signature', async () => {
        expect(await verifyStripeSignature(body, sign(t), secret, 300, now)).toBe(true);
    });

    it('rejects a wrong key, an altered body, replays and malformed headers', async () => {
        expect(await verifyStripeSignature(body, sign(t, body, 'other'), secret, 300, now)).toBe(false);
        expect(await verifyStripeSignature(`${body} `, sign(t), secret, 300, now)).toBe(false);
        expect(await verifyStripeSignature(body, sign(t - 301), secret, 300, now)).toBe(false);
        expect(await verifyStripeSignature(body, 'v1=abc', secret, 300, now)).toBe(false);
        expect(await verifyStripeSignature(body, `t=${t},v1=zz`, secret, 300, now)).toBe(false);
        expect(await verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
    });

    it('encodes nested parameters the way Stripe expects', () => {
        const encoded = formEncode({ a: 1, list: [{ x: 'y z' }], meta: { k: 'v' }, skip: null }).toString();
        expect(decodeURIComponent(encoded)).toBe('a=1&list[0][x]=y+z&meta[k]=v');
    });
});

describe('product validation', () => {
    const base = { name: ' Sofa ', price: '899.99', category: 'Sofas' };

    it('normalises options into rows with pence adjustments', () => {
        const p = validateProduct({
            ...base,
            deliveryFeeOverride: '75',
            variations: {
                fabrics: ['Wool', 'Teddy', 'Wool'],
                sizes: ['King'],
                priceDeltas: { fabrics: { Teddy: 50, Removed: 10 }, sizes: { King: '80.5' } },
                structuredDimensions: { default: { length: '215 cm' }, bySize: { King: { width: '150 cm' }, Gone: {} } },
            },
        });
        expect(p.name).toBe('Sofa');
        expect(p.deliveryFeePence).toBe(7500);
        expect(p.options).toEqual([
            { grp: 'fabric', name: 'Wool', deltaPence: 0, position: 0 },
            { grp: 'fabric', name: 'Teddy', deltaPence: 5000, position: 1 },
            { grp: 'size', name: 'King', deltaPence: 8050, position: 0 },
        ]);
        expect(Object.keys(p.extras.structuredDimensions.bySize)).toEqual(['King']);
        expect(p.dimSummary).toBe('L: 215 cm');
    });

    it('treats a blank delivery fee as "use the default" and 0 as free', () => {
        expect(validateProduct({ ...base, deliveryFeeOverride: '' }).deliveryFeePence).toBeNull();
        expect(validateProduct({ ...base, deliveryFeeOverride: 0 }).deliveryFeePence).toBe(0);
    });

    it('rejects missing titles, bad prices and missing categories', () => {
        expect(() => validateProduct({ ...base, name: '' })).toThrow();
        expect(() => validateProduct({ ...base, price: 'abc' })).toThrow();
        expect(() => validateProduct({ ...base, price: -1 })).toThrow();
        expect(() => validateProduct({ ...base, category: '' })).toThrow();
    });
});

describe('customer validation', () => {
    const ok = { fullName: 'Jane Doe', email: 'Jane@Example.com', phone: '07700 900123', address: '1 High St', city: 'Rotherham', postcode: 's66 8je' };

    it('normalises a valid delivery customer', () => {
        expect(validateCustomer(ok, 'delivery')).toMatchObject({ email: 'jane@example.com', postcode: 'S66 8JE' });
    });

    it('does not need an address for collection', () => {
        expect(validateCustomer({ ...ok, address: '', city: '', postcode: '' }, 'collection').city).toBe('Maltby');
    });

    it('rejects bad emails, phones and postcodes', () => {
        expect(() => validateCustomer({ ...ok, email: 'nope' }, 'delivery')).toThrow();
        expect(() => validateCustomer({ ...ok, phone: '12' }, 'delivery')).toThrow();
        expect(() => validateCustomer({ ...ok, postcode: 'NOPE' }, 'delivery')).toThrow();
    });
});
