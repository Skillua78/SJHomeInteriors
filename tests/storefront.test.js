import { describe, it, expect } from 'vitest';
import {
    whatsAppDigits,
    whatsAppLink,
    productEnquiryMessage,
    promoState,
    toggleCompare,
    pickSimilar,
    MAX_COMPARE,
} from '../src/utils/storefront.js';
import { paymentSummary, trustItems } from '../src/components/TrustBar.jsx';

describe('WhatsApp links', () => {
    it('turns UK numbers into international digits', () => {
        expect(whatsAppDigits('07830 141250')).toBe('447830141250');
        expect(whatsAppDigits('+44 7830 141250')).toBe('447830141250');
        expect(whatsAppDigits('0044 7830 141250')).toBe('447830141250');
        expect(whatsAppDigits('123')).toBe('');
        expect(whatsAppDigits('')).toBe('');
    });

    it('prefers the WhatsApp number, then the phone, then the showroom number', () => {
        expect(whatsAppLink({ whatsappNumber: '07111 222333', phone: '07999 888777' })).toBe(
            'https://wa.me/447111222333'
        );
        expect(whatsAppLink({ whatsappNumber: 'https://wa.me/447000000001' })).toBe('https://wa.me/447000000001');
        expect(whatsAppLink({ phone: '07999 888777' })).toBe('https://wa.me/447999888777');
        expect(whatsAppLink(null)).toBe('https://wa.me/447830141250');
    });

    it('encodes the message so it cannot break out of the link', () => {
        const link = whatsAppLink({}, 'Hi & <b>"there"</b>?');
        expect(link).toBe(`https://wa.me/447830141250?text=${encodeURIComponent('Hi & <b>"there"</b>?')}`);
        expect(link).not.toMatch(/[<>"\s]/);
    });

    it('describes the product and chosen options', () => {
        const msg = productEnquiryMessage({ name: 'Venice Sofa' }, { color: 'Grey', size: '3 Seater' }, 899);
        expect(msg).toBe(
            "Hello SJ Home Interiors, I'm interested in the Venice Sofa (£899.00) - Colour: Grey, Size: 3 Seater. Could you tell me more?"
        );
        expect(productEnquiryMessage({ name: 'Oslo Bed' }, {}, null)).toBe(
            "Hello SJ Home Interiors, I'm interested in the Oslo Bed. Could you tell me more?"
        );
        expect(productEnquiryMessage(null)).toMatch(/question about your furniture/);
    });
});

describe('promotion banner', () => {
    const now = Date.parse('2026-11-20T12:00:00Z');

    it('is hidden when switched off or without a headline', () => {
        expect(promoState({ promoEnabled: false, promoText: 'Sale' }, now)).toBeNull();
        expect(promoState({ promoEnabled: true, promoText: '  ' }, now)).toBeNull();
        expect(promoState(null, now)).toBeNull();
    });

    it('is hidden once the end date has passed', () => {
        expect(promoState({ promoEnabled: true, promoText: 'Sale', promoEndDate: '2026-11-20T11:59:59Z' }, now)).toBeNull();
        expect(promoState({ promoEnabled: true, promoText: 'Sale', promoEndDate: '2026-11-20T12:00:00Z' }, now)).toBeNull();
    });

    it('shows without a countdown when there is no valid end date', () => {
        expect(promoState({ promoEnabled: true, promoText: 'Sale', promoEndDate: '' }, now)).toEqual({
            remainingMs: null,
            parts: null,
        });
        expect(promoState({ promoEnabled: true, promoText: 'Sale', promoEndDate: 'soon' }, now).parts).toBeNull();
    });

    it('splits the time left into days, hours, minutes and seconds', () => {
        const state = promoState(
            { promoEnabled: true, promoText: 'Sale', promoEndDate: '2026-11-22T15:04:05Z' },
            now
        );
        expect(state.parts).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    });
});

describe('compare list', () => {
    const p = (id) => ({ id, name: id });

    it('adds and removes products', () => {
        const added = toggleCompare([], p('a'));
        expect(added.list.map((x) => x.id)).toEqual(['a']);
        expect(toggleCompare(added.list, p('a')).list).toEqual([]);
    });

    it(`stops at ${MAX_COMPARE} with a message`, () => {
        const full = ['a', 'b', 'c', 'd'].map(p);
        const result = toggleCompare(full, p('e'));
        expect(result.list).toBe(full);
        expect(result.error).toMatch(/up to 4/);
        // Removing still works when full.
        expect(toggleCompare(full, p('b')).list.map((x) => x.id)).toEqual(['a', 'c', 'd']);
    });
});

describe('similar products', () => {
    it('prefers the subcategory, skips the current and hidden products, and limits the count', () => {
        const current = { id: 'x' };
        const sameSub = [{ id: 'x' }, { id: 'a' }, { id: 'h', isHidden: true }];
        const sameCategory = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
        expect(pickSimilar(current, sameSub, sameCategory, 4).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
        expect(pickSimilar(current, [], [], 4)).toEqual([]);
    });
});

describe('trust bar', () => {
    it('lists only the payment methods that are switched on', () => {
        expect(paymentSummary({ card: true, klarna: true, cod: true })).toBe('Card, Klarna or pay on delivery');
        expect(paymentSummary({ cod: true })).toBe('Pay on delivery');
        expect(paymentSummary({})).toBe('Pay in our showroom');
    });

    it('mentions the free delivery radius', () => {
        expect(trustItems({ freeDeliveryMiles: 15 })[1].sub).toBe('Free within 15 miles of Maltby');
        expect(trustItems({ freeDeliveryMiles: 0 })[1].sub).toBe('Delivered by our own team');
        expect(trustItems({}).map((i) => i.title)).toHaveLength(4);
    });
});
