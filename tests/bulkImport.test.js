import { describe, it, expect } from 'vitest';
import { runBulkImport, isRetryable } from '../src/components/admin/products/bulkImport.js';

const product = (id, extra = {}) => ({
    id,
    name: `Product ${id}`,
    price: 199,
    category: 'Beds',
    isHidden: true,
    ...extra,
});
const rateLimited = (retryAfter = null) =>
    Object.assign(new Error('too many requests'), { status: 429, data: { cloudflare: true, retryAfter } });

function harness({ failures = {}, existing = new Map() } = {}) {
    const calls = [];
    const sleeps = [];
    const progress = [];
    const saved = new Map(existing);
    const save = async (payload, original) => {
        const key = payload.id;
        calls.push({ id: key, mode: original ? 'update' : 'create' });
        const queue = failures[key];
        if (queue && queue.length) {
            const next = queue.shift();
            if (next.thenSaved) saved.set(key, { id: key });
            throw next.error;
        }
        saved.set(key, { id: key });
    };
    return {
        calls,
        sleeps,
        progress,
        run: (products, options = {}) =>
            runBulkImport({
                products,
                existingById: existing,
                save,
                findExisting: async (id) => saved.get(id) || null,
                onProgress: (t) => progress.push(t),
                sleep: async (ms) => sleeps.push(ms),
                ...options,
            }),
    };
}

describe('bulk import', () => {
    it('creates new products with their file id and updates existing ones, spaced out', async () => {
        const h = harness({ existing: new Map([['b', { id: 'b', name: 'Old B' }]]) });
        const result = await h.run([product('a'), product('b'), product('c')]);
        expect(result).toEqual({ created: 2, updated: 1, hidden: 3 });
        expect(h.calls).toEqual([
            { id: 'a', mode: 'create' },
            { id: 'b', mode: 'update' },
            { id: 'c', mode: 'create' },
        ]);
        expect(h.sleeps).toEqual([400, 400]); // a gap between saves, none after the last
        expect(h.progress[0]).toBe('Saving 1 of 3: Product a');
    });

    it('waits and retries when Cloudflare rate-limits, honouring Retry-After', async () => {
        const h = harness({ failures: { b: [{ error: rateLimited(30) }, { error: rateLimited() }] } });
        const result = await h.run([product('a'), product('b')]);
        expect(result.created).toBe(2);
        expect(h.calls.filter((c) => c.id === 'b')).toHaveLength(3);
        expect(h.sleeps).toEqual([400, 30_000, 20_000]);
        expect(h.progress.some((t) => t.startsWith('Cloudflare asked us to slow down. Waiting 30 seconds'))).toBe(true);
    });

    it('switches to an update if a rate-limited create had actually been saved', async () => {
        const h = harness({ failures: { a: [{ error: rateLimited(), thenSaved: true }] } });
        const result = await h.run([product('a')]);
        expect(h.calls).toEqual([
            { id: 'a', mode: 'create' },
            { id: 'a', mode: 'update' },
        ]);
        expect(result).toEqual({ created: 0, updated: 1, hidden: 1 });
    });

    it('looks each product up when the shop list could not be loaded', async () => {
        const h = harness();
        await h.run([product('a')], { existingById: null, findExisting: async () => ({ id: 'a' }) });
        expect(h.calls).toEqual([{ id: 'a', mode: 'update' }]);
    });

    it('stops with a clear message on other errors, or once retries run out', async () => {
        const broken = harness({ failures: { b: [{ error: Object.assign(new Error('Bad price.'), { status: 400 }) }] } });
        await expect(broken.run([product('a'), product('b'), product('c')])).rejects.toThrow(
            'Imported 1 of 3. Stopped at “Product b”: Bad price. Fix the problem and import the same file again'
        );

        const limited = harness({ failures: { a: Array.from({ length: 6 }, () => ({ error: rateLimited() })) } });
        await expect(limited.run([product('a')])).rejects.toThrow('Imported 0 of 1. Stopped at “Product a”: too many requests');
        expect(limited.calls).toHaveLength(6); // first try + 5 retries
    });

    it('only retries rate limits and Cloudflare outages', () => {
        expect(isRetryable({ status: 429 })).toBe(true);
        expect(isRetryable({ status: 503, data: { cloudflare: true } })).toBe(true);
        expect(isRetryable({ status: 503, data: {} })).toBe(false);
        expect(isRetryable({ status: 400 })).toBe(false);
    });
});
