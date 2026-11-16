import { describe, it, expect } from 'vitest';
import {
    priceSelection,
    computeTotals,
    resolveAssemblyFeePence,
    toPence,
    fromPence,
} from '../shared/pricing.js';

const options = [
    { grp: 'fabric', name: 'Wool', deltaPence: 0 },
    { grp: 'fabric', name: 'Teddy', deltaPence: 5000 },
    { grp: 'size', name: 'King', deltaPence: 8050 },
    { grp: 'size', name: 'Single', deltaPence: -4000 },
];

describe('priceSelection', () => {
    it('adds the chosen option adjustments to the base price', () => {
        const r = priceSelection(49999, options, { color: 'Grey', fabric: 'Teddy', size: 'King' });
        expect(r.ok).toBe(true);
        expect(r.unitPence).toBe(49999 + 5000 + 8050);
        expect(r.label).toBe('Grey • Fabric: Teddy • Size: King');
    });

    it('supports negative adjustments but never goes below zero', () => {
        expect(priceSelection(10000, options, { fabric: 'Wool', size: 'Single' }).unitPence).toBe(6000);
        expect(priceSelection(1000, options, { fabric: 'Wool', size: 'Single' }).unitPence).toBe(0);
    });

    it('rejects a missing or unknown option instead of guessing', () => {
        expect(priceSelection(10000, options, { fabric: 'Teddy' }).ok).toBe(false);
        expect(priceSelection(10000, options, { fabric: 'Gold Leaf', size: 'King' }).ok).toBe(false);
    });

    it('ignores selections for groups the product does not offer', () => {
        const r = priceSelection(8900, [], { mattress: 'Free upgrade', lift: 'x' });
        expect(r).toMatchObject({ ok: true, unitPence: 8900, label: 'Standard', selections: {} });
    });
});

describe('delivery & assembly', () => {
    it('uses the product fee when set (including 0) and the default otherwise', () => {
        expect(resolveAssemblyFeePence(7500, 5000)).toBe(7500);
        expect(resolveAssemblyFeePence(0, 5000)).toBe(0);
        expect(resolveAssemblyFeePence(null, 5000)).toBe(5000);
        expect(resolveAssemblyFeePence(undefined, undefined)).toBe(5000);
    });

    it('charges assembly once per order (the highest item fee), only when chosen', () => {
        const lines = [
            { unitPence: 94999, assemblyUnitPence: 7500, qty: 2 },
            { unitPence: 8900, assemblyUnitPence: 5000, qty: 1 },
        ];
        expect(computeTotals(lines)).toEqual({
            subtotalPence: 198898,
            deliveryPence: 0,
            assemblyPence: 0,
            totalPence: 198898,
        });
        expect(computeTotals(lines, { assembly: true }).assemblyPence).toBe(7500);
        expect(computeTotals(lines, { deliveryPence: 5000, assembly: true }).totalPence).toBe(211398);
    });
});

describe('money conversion', () => {
    it('avoids floating point drift', () => {
        expect(toPence(899.99)).toBe(89999);
        expect(toPence('80.5')).toBe(8050);
        expect(fromPence(68049)).toBe(680.49);
        expect(toPence('not a number')).toBe(0);
    });
});
