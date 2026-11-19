/**
 * Saving many imported products without tripping Cloudflare's rate limit.
 *
 * - The caller looks up existing products once (one request) instead of once per product.
 * - Saves are spaced out a little.
 * - When Cloudflare answers "too many requests" (429) or is briefly unavailable (503),
 *   wait (using its Retry-After hint when given) and try the same product again.
 * - Before retrying a create, check whether the first attempt went through after all,
 *   so a retry can never add a duplicate.
 */
import { productToForm, formToPayload } from './productFormModel.js';

export const PACE_MS = 400;
export const RETRY_WAITS_S = [10, 20, 40, 60, 60];

export const isRetryable = (err) =>
    err?.status === 429 || (err?.status === 503 && Boolean(err?.data?.cloudflare));

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param products     prepared import products
 * @param existingById Map of id -> full product already in the shop, or null to look each one up
 * @param save         async (payload, existingOrNull) => void
 * @param findExisting async (id) => product|null  (used only to double-check before a retry)
 * @param onProgress   (text) => void
 */
export async function runBulkImport({
    products,
    existingById = new Map(),
    save,
    findExisting = async () => null,
    onProgress = () => {},
    sleep = defaultSleep,
    paceMs = PACE_MS,
    retryWaits = RETRY_WAITS_S,
}) {
    let created = 0;
    let updated = 0;
    let hidden = 0;
    const total = products.length;
    const stopped = (product, reason) =>
        new Error(
            `Imported ${created + updated} of ${total}. Stopped at “${product.name}”: ${reason}${
                products.some((p) => p.id)
                    ? ' Fix the problem and import the same file again: products already added will be updated, not duplicated.'
                    : ''
            }`
        );

    for (let i = 0; i < total; i += 1) {
        const product = products[i];
        let existing = null;
        if (product.id) {
            // eslint-disable-next-line no-await-in-loop
            existing = (existingById ? existingById.get(product.id) : await findExisting(product.id)) || null;
        }
        onProgress(`Saving ${i + 1} of ${total}: ${product.name}`);

        for (let attempt = 0; ; attempt += 1) {
            const converted = formToPayload(productToForm(product), existing ? product.id : null);
            if (!converted.ok) throw stopped(product, converted.error);
            // New products keep the file's id (when free) so a re-run updates them.
            if (!existing && product.id) converted.payload.id = product.id;

            try {
                // eslint-disable-next-line no-await-in-loop
                await save(converted.payload, existing);
                if (existing) updated += 1;
                else created += 1;
                if (converted.payload.isHidden) hidden += 1;
                break;
            } catch (err) {
                if (!isRetryable(err) || attempt >= retryWaits.length) throw stopped(product, err.message);
                const wait = Math.min(120, Math.max(retryWaits[attempt], Number(err.data?.retryAfter) || 0));
                onProgress(
                    `Cloudflare asked us to slow down. Waiting ${wait} seconds, then continuing with ${i + 1} of ${total}…`
                );
                // eslint-disable-next-line no-await-in-loop
                await sleep(wait * 1000);
                // If the create actually went through, update it instead of adding a copy.
                if (!existing && product.id) {
                    // eslint-disable-next-line no-await-in-loop
                    existing = (await findExisting(product.id)) || null;
                }
            }
        }

        // eslint-disable-next-line no-await-in-loop
        if (i < total - 1 && paceMs > 0) await sleep(paceMs);
    }

    return { created, updated, hidden };
}
