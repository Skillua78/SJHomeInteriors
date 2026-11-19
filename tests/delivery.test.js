import { describe, it, expect } from 'vitest';
import {
    normaliseBands,
    chargesForDelivery,
    deliveryPenceForMiles,
    deliveryPriceList,
    deliveryRuleText,
    deliveryShortText,
} from '../shared/delivery.js';

const shop = {
    freeDeliveryMiles: 20,
    defaultDeliveryFee: 50,
    deliveryBands: [
        { overMiles: 100, extra: 30 },
        { overMiles: 40, extra: 15 },
    ],
};

describe('delivery distance bands', () => {
    it('cleans and sorts bands from the admin form', () => {
        expect(
            normaliseBands([
                { overMiles: '100', extra: '30' },
                { overMiles: 40, extra: 15 },
                { overMiles: '', extra: 10 },
                { overMiles: 60, extra: -5 },
                { overMiles: 40, extra: 18 },
                null,
            ])
        ).toEqual([
            { overMiles: 40, extra: 18 },
            { overMiles: 100, extra: 30 },
        ]);
        expect(normaliseBands('nope')).toEqual([]);
    });

    it('is free inside the radius, then the standard charge plus the furthest band reached', () => {
        expect(deliveryPenceForMiles(shop, 5)).toBe(0);
        expect(deliveryPenceForMiles(shop, 20)).toBe(0);
        expect(deliveryPenceForMiles(shop, 20.1)).toBe(5000);
        expect(deliveryPenceForMiles(shop, 40)).toBe(5000);
        expect(deliveryPenceForMiles(shop, 40.5)).toBe(6500);
        expect(deliveryPenceForMiles(shop, 100)).toBe(6500);
        expect(deliveryPenceForMiles(shop, 150)).toBe(8000);
    });

    it('works with no standard charge and bands only', () => {
        const bandsOnly = { freeDeliveryMiles: 20, defaultDeliveryFee: 0, deliveryBands: [{ overMiles: 50, extra: 25 }] };
        expect(chargesForDelivery(bandsOnly)).toBe(true);
        expect(deliveryPenceForMiles(bandsOnly, 30)).toBe(0);
        expect(deliveryPenceForMiles(bandsOnly, 60)).toBe(2500);
        expect(chargesForDelivery({ freeDeliveryMiles: 10, defaultDeliveryFee: 0, deliveryBands: [] })).toBe(false);
    });

    it('builds the price list customers and the admin see', () => {
        expect(deliveryPriceList(shop)).toEqual([
            { label: 'Up to 20 miles', pence: 0, free: true },
            { label: '20 – 40 miles', pence: 5000, free: false },
            { label: '40 – 100 miles', pence: 6500, free: false },
            { label: 'Over 100 miles', pence: 8000, free: false },
        ]);
        // A band inside the free radius is ignored.
        expect(
            deliveryPriceList({ freeDeliveryMiles: 20, defaultDeliveryFee: 50, deliveryBands: [{ overMiles: 10, extra: 5 }] })
        ).toEqual([
            { label: 'Up to 20 miles', pence: 0, free: true },
            { label: 'Over 20 miles', pence: 5000, free: false },
        ]);
    });

    it('always leads the summary with the free radius around the showroom', () => {
        expect(deliveryRuleText(shop)).toBe(
            'Free within 20 miles of our Maltby showroom, then from £50.00 depending on distance.'
        );
        expect(deliveryShortText(shop)).toBe('Free within 20 miles, then from £50.00');
        const flat = { freeDeliveryMiles: 20, defaultDeliveryFee: 50 };
        expect(deliveryRuleText(flat)).toBe('Free within 20 miles of our Maltby showroom, £50.00 beyond.');
        expect(deliveryShortText(flat)).toBe('Free within 20 miles, £50.00 beyond');
        expect(deliveryRuleText({ freeDeliveryMiles: 20, defaultDeliveryFee: 0 })).toBe(
            'Free within 20 miles of our Maltby showroom.'
        );
    });
});
