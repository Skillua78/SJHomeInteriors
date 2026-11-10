/**
 * GET /api/products/:id - full product (gallery, options, dimensions).
 */
import { HttpError, json, cleanText } from '../../../server/http.js';
import { getProduct, migrateLegacyProducts } from '../../../server/products.js';
import { loadSettings, deliveryFeePence } from '../../../server/settings.js';

export async function onRequestGet({ env, params }) {
    const id = cleanText(params.id, 100);
    await migrateLegacyProducts(env);
    const settings = await loadSettings(env);
    const product = await getProduct(env, id, deliveryFeePence(settings));
    if (!product) throw new HttpError(404, 'Product not found.');
    return json(product, 200, { 'Cache-Control': 'public, max-age=20' });
}
