import { describe, it, expect } from 'vitest';
import {
    buildAiPrompt,
    parseImportJson,
    prepareImport,
    describeAdditions,
} from '../src/components/admin/products/importModel.js';
import { productToForm, formToPayload } from '../src/components/admin/products/productFormModel.js';
import { milesBetween, normalisePostcode } from '../server/delivery.js';
import { computeTotals } from '../shared/pricing.js';

const library = {
    taxonomy: { Sofas: ['Corner Sofas'], Beds: ['Ottoman Beds'] },
    colorNames: ['Cream', 'Grey', 'Black'],
};

const mirror = {
    name: 'ARCH WALL MIRROR',
    price: 129,
    category: 'Mirrors',
    subcategory: 'Wall Mirrors',
    colors: ['grey', 'Dusty Rose'],
    finishes: ['Brushed Brass'],
    colorHex: { 'Dusty Rose': '#C9A0A0', 'Brushed Brass': 'not-a-colour' },
    variations: {
        sizes: ['Small (60 cm)', 'Large (120 cm)'],
        priceDeltas: { sizes: { 'Large (120 cm)': 40, Removed: 10 } },
    },
};

describe('AI import', () => {
    it('lists the shop categories and colours in the prompt and allows new ones', () => {
        const prompt = buildAiPrompt({ categories: ['Sofas', 'Beds'], colours: ['Cream', 'Grey'] });
        expect(prompt).toContain('"Sofas", "Beds"');
        expect(prompt).toContain('Cream, Grey');
        expect(prompt).toMatch(/new category name/i);
        expect(prompt).toContain('"finishes"');
    });

    it('reads a single object, an array, a wrapper and fenced JSON', () => {
        expect(parseImportJson('{"name":"A"}').items).toHaveLength(1);
        expect(parseImportJson('[{"name":"A"},{"name":"B"}]').items).toHaveLength(2);
        expect(parseImportJson('{"products":[{"name":"A"}]}').items).toHaveLength(1);
        expect(parseImportJson('```json\n{"name":"A"}\n```').ok).toBe(true);
        expect(parseImportJson('not json').ok).toBe(false);
        expect(parseImportJson('').ok).toBe(false);
    });

    it('accepts a new category, new colours and finishes, and reports them', () => {
        const result = prepareImport(JSON.stringify(mirror), library);
        expect(result.ok).toBe(true);

        const [product] = result.products;
        expect(product.category).toBe('Mirrors');
        // existing colour keeps the shop's spelling; finishes join the colour list
        expect(product.colors).toEqual(['Grey', 'Dusty Rose', 'Brushed Brass']);
        expect(product.variations.priceDeltas.sizes).toEqual({ 'Large (120 cm)': 40 });

        expect(result.additions.categories).toEqual({ Mirrors: ['Wall Mirrors'] });
        // a bad hex is dropped (the shop then guesses a swatch) rather than stored
        expect(result.additions.colours).toEqual({ 'Dusty Rose': '#C9A0A0', 'Brushed Brass': null });
        expect(describeAdditions(result.additions, library.taxonomy)).toBe(
            'new category: Mirrors · new subcategory: Wall Mirrors · new colours/finishes: Dusty Rose, Brushed Brass'
        );
    });

    it('matches existing categories case-insensitively and only adds a new subcategory', () => {
        const result = prepareImport(
            JSON.stringify({ name: 'Sofa', price: 500, category: 'sofas', subcategory: 'Recliners' }),
            library
        );
        expect(result.products[0].category).toBe('Sofas');
        expect(result.additions.categories).toEqual({ Sofas: ['Recliners'] });
        expect(result.additions.colours).toEqual({});
    });

    it('refuses products without a name, price or category instead of inventing them', () => {
        expect(prepareImport('{"price":10,"category":"Sofas"}', library).ok).toBe(false);
        expect(prepareImport('{"name":"X","category":"Sofas"}', library).error).toMatch(/price/);
        expect(prepareImport('{"name":"X","price":0,"category":"Sofas"}', library).ok).toBe(false);
        expect(prepareImport('{"name":"X","price":10}', library).error).toMatch(/category/);
    });

    it('produces something the product form can save', () => {
        const { products } = prepareImport(JSON.stringify(mirror), library);
        const { ok, payload } = formToPayload(productToForm(products[0]), null);
        expect(ok).toBe(true);
        expect(payload).toMatchObject({ name: 'ARCH WALL MIRROR', price: 129, category: 'Mirrors', stock: null });
        expect(payload.images).toEqual([]);
    });

    it('drops unsafe image links', () => {
        const { products } = prepareImport(
            JSON.stringify({
                name: 'X',
                price: 5,
                category: 'Sofas',
                images: ['javascript:alert(1)', 'https://example.com/a.jpg', '//evil.example/x.png'],
            }),
            library
        );
        expect(products[0].images).toEqual(['https://example.com/a.jpg']);
    });
});

describe('delivery by distance', () => {
    it('measures straight-line miles', () => {
        const maltby = { lat: 53.4236, lon: -1.2031 };
        const sheffield = { lat: 53.3811, lon: -1.4701 };
        const london = { lat: 51.5074, lon: -0.1278 };
        expect(milesBetween(maltby, maltby)).toBe(0);
        expect(milesBetween(maltby, sheffield)).toBeGreaterThan(10);
        expect(milesBetween(maltby, sheffield)).toBeLessThan(13);
        expect(Math.round(milesBetween(maltby, london))).toBeGreaterThan(130);
    });

    it('normalises postcodes for lookup', () => {
        expect(normalisePostcode(' s66 8je ')).toBe('S668JE');
    });

    it('adds delivery and optional assembly once per order', () => {
        const lines = [
            { unitPence: 50000, assemblyUnitPence: 7500, qty: 2 },
            { unitPence: 8900, assemblyUnitPence: 5000, qty: 1 },
        ];
        expect(computeTotals(lines)).toMatchObject({ deliveryPence: 0, assemblyPence: 0, totalPence: 108900 });
        expect(computeTotals(lines, { deliveryPence: 5000 }).totalPence).toBe(113900);
        expect(computeTotals(lines, { deliveryPence: 5000, assembly: true })).toEqual({
            subtotalPence: 108900,
            deliveryPence: 5000,
            assemblyPence: 7500,
            totalPence: 121400,
        });
    });
});
