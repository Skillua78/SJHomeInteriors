import { describe, it, expect } from 'vitest';
import {
    buildCartLine,
    addLine,
    changeQty,
    cartTotals,
    applyQuote,
    sanitiseStoredCart,
    localListProducts,
    MAX_QTY_PER_LINE,
} from '../src/utils/catalogModel.js';
import { emptyForm, formToPayload, productToForm, productToPayload } from '../src/components/admin/products/productFormModel.js';
import { formatDualDimension } from '../src/components/admin/products/dimensions.js';
import { availableMethods, validateCheckoutForm, buildCheckoutRequest } from '../src/components/checkout/checkoutModel.js';
import { validateSafeImageUrl, validateSafeHttpsUrl } from '../src/utils/security.js';

const bed = {
    id: 'bed-1',
    category: 'Beds',
    name: 'Ottoman Bed',
    price: 499.99,
    deliveryFee: 50,
    image: 'https://example.com/bed.jpg',
    variations: {
        fabrics: ['Wool', 'Teddy'],
        sizes: ['King'],
        priceDeltas: { fabrics: { Teddy: 50 }, sizes: { King: 80.5 } },
    },
};

describe('basket', () => {
    it('prices a line from the chosen options', () => {
        const { ok, line } = buildCartLine(bed, { color: 'Grey', fabric: 'Teddy', size: 'King' });
        expect(ok).toBe(true);
        expect(line.unitPrice).toBe(630.49);
        expect(line.deliveryFee).toBe(50);
        expect(line.selections).toEqual({ color: 'Grey', fabric: 'Teddy', size: 'King' });
    });

    it('refuses to add a product with options that have not been chosen', () => {
        expect(buildCartLine(bed, { color: 'Grey' }).ok).toBe(false);
    });

    it('merges identical lines, keeps different options apart and caps quantity', () => {
        const a = buildCartLine(bed, { fabric: 'Teddy', size: 'King' }).line;
        const b = buildCartLine(bed, { fabric: 'Wool', size: 'King' }).line;
        let cart = addLine(addLine(addLine([], a), a), b);
        expect(cart.map((l) => l.qty)).toEqual([2, 1]);
        cart = changeQty(cart, a.key, 100);
        expect(cart[0].qty).toBe(MAX_QTY_PER_LINE);
        expect(changeQty(cart, b.key, -1)).toHaveLength(1);
    });

    it('totals items plus per-unit delivery, free for collection', () => {
        const line = { ...buildCartLine(bed, { fabric: 'Teddy', size: 'King' }).line, qty: 2 };
        expect(cartTotals([line], 'delivery')).toMatchObject({ subtotal: 1260.98, delivery: 100, total: 1360.98, totalPence: 136098 });
        expect(cartTotals([line], 'collection').total).toBe(1260.98);
    });

    it('adopts server prices and drops corrupt stored lines', () => {
        const line = buildCartLine(bed, { fabric: 'Teddy', size: 'King' }).line;
        const repriced = applyQuote([line], [{ id: 'bed-1', selections: line.selections, unitPrice: 700, deliveryFee: 60 }]);
        expect(repriced[0]).toMatchObject({ unitPrice: 700, deliveryFee: 60 });
        expect(sanitiseStoredCart([line, { id: 1 }, null, { ...line, qty: -2 }, { ...line, qty: 999 }]).map((l) => l.qty)).toEqual([1, 20]);
        expect(sanitiseStoredCart('nope')).toEqual([]);
    });
});

describe('offline catalogue fallback', () => {
    const products = [
        { id: 'a', name: 'Alpha Sofa', price: 300, category: 'Sofas', isPopular: true },
        { id: 'b', name: 'Beta Bed', price: 100, category: 'Beds' },
        { id: 'c', name: 'Gamma Bed', price: 200, category: 'Beds' },
    ];
    it('filters, sorts and pages like the API', () => {
        expect(localListProducts(products, { category: 'Beds', sort: 'high' }).items.map((p) => p.id)).toEqual(['c', 'b']);
        expect(localListProducts(products, { category: 'Popular' }).total).toBe(1);
        expect(localListProducts(products, { q: 'gamma' }).items[0].deliveryFee).toBe(50);
        expect(localListProducts(products, { limit: 2 }).nextOffset).toBe(2);
    });
});

describe('product form model', () => {
    it('requires a title, price and category', () => {
        expect(formToPayload(emptyForm())).toMatchObject({ ok: false, section: 'basics' });
        expect(formToPayload({ ...emptyForm(), name: 'X', price: '10' })).toMatchObject({ ok: false });
        expect(formToPayload({ ...emptyForm(), name: 'X', price: '10', category: 'Sofas', deliveryFee: 'abc' }).ok).toBe(false);
    });

    it('builds a payload, pruning adjustments for options that were removed', () => {
        const form = {
            ...emptyForm(),
            name: 'Sofa',
            price: '899.99',
            category: 'Sofas',
            deliveryFee: '75',
            stock: '',
            fabrics: ['Teddy'],
            priceDeltas: { fabrics: { Teddy: 50, Wool: 20 }, sizes: { King: 80 }, mattresses: {}, liftOptions: {} },
            features: 'Solid frame, , Deep seats',
        };
        const { ok, payload } = formToPayload(form, 'sofa-1');
        expect(ok).toBe(true);
        expect(payload).toMatchObject({ id: 'sofa-1', price: 899.99, deliveryFeeOverride: 75, stock: null });
        expect(payload.variations.priceDeltas).toEqual({ fabrics: { Teddy: 50 }, sizes: {}, mattresses: {}, liftOptions: {} });
        expect(payload.features).toEqual(['Solid frame', 'Deep seats']);
    });

    it('round-trips a product through the form (used by undo)', () => {
        const product = { id: 'bed-1', ...bed, deliveryFeeOverride: null, stock: 3, colors: ['Grey'], images: [bed.image], features: ['Sturdy'] };
        const payload = productToPayload(product);
        expect(payload).toMatchObject({ id: 'bed-1', name: 'Ottoman Bed', price: 499.99, deliveryFeeOverride: null, stock: 3 });
        expect(payload.variations.priceDeltas.sizes).toEqual({ King: 80.5 });
        expect(productToForm(product, { duplicate: true }).name).toBe('Ottoman Bed (Copy)');
    });
});

describe('dimension converter', () => {
    it('fills in the other unit', () => {
        expect(formatDualDimension('215', '', '')).toBe('215 cm (7ft 1in)');
        expect(formatDualDimension('', '5', '6')).toBe('168 cm (5ft 6in)');
        expect(formatDualDimension('150', '4', '11')).toBe('150 cm (4ft 11in)');
        expect(formatDualDimension('', '', '')).toBe('');
    });
});

describe('checkout model', () => {
    const options = { card: true, klarna: true, cod: true, showroom: true, bacs: false };
    const form = { fullName: 'Jane Doe', email: 'jane@example.com', phone: '07700 900123', address: '1 High St', city: 'Rotherham', postcode: 's66 8je', paymentMethod: 'card', agreedTerms: true };

    it('only offers enabled methods, and pay-on-delivery only for delivery', () => {
        expect(availableMethods(options, 'delivery').map((m) => m.id)).toEqual(['card', 'klarna', 'cod', 'showroom']);
        expect(availableMethods(options, 'collection').map((m) => m.id)).toEqual(['card', 'klarna', 'showroom']);
        expect(availableMethods(undefined, 'delivery')).toEqual([]);
    });

    it('reports the first missing field', () => {
        expect(validateCheckoutForm(form, 'delivery')).toBeNull();
        expect(validateCheckoutForm({ ...form, postcode: 'x' }, 'delivery').field).toBe('postcode');
        expect(validateCheckoutForm({ ...form, postcode: '' }, 'collection')).toBeNull();
        expect(validateCheckoutForm({ ...form, agreedTerms: false }, 'delivery').field).toBe('agreedTerms');
    });

    it('never sends prices to the server, only ids, quantities and choices', () => {
        const line = { ...buildCartLine(bed, { fabric: 'Teddy', size: 'King' }).line, qty: 2 };
        const req = buildCheckoutRequest(form, [line], 'delivery', 136098);
        expect(req.items).toEqual([{ id: 'bed-1', qty: 2, selections: { fabric: 'Teddy', size: 'King' } }]);
        expect(req.customer.postcode).toBe('S66 8JE');
    });
});

describe('URL safety', () => {
    it('allows https, our image endpoint and raster data URLs only', () => {
        expect(validateSafeImageUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
        expect(validateSafeImageUrl('/api/img/abcdefghijklmnop1234')).toBe('/api/img/abcdefghijklmnop1234');
        expect(validateSafeImageUrl('javascript:alert(1)')).toBe('');
        expect(validateSafeImageUrl('http://example.com/a.jpg')).toBe('');
        expect(validateSafeImageUrl('data:image/svg+xml;base64,AAAA')).toBe('');
        expect(validateSafeImageUrl('/api/img/../../etc')).toBe('');
        expect(validateSafeHttpsUrl('javascript:alert(1)')).toBe('');
        expect(validateSafeHttpsUrl('https://facebook.com/x')).toBe('https://facebook.com/x');
    });
});
