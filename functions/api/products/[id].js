/**
 * GET /api/products/:id - full product (gallery, options, dimensions).
 */
import { HttpError, json, cleanText } from '../../../server/http.js';
import { getProduct, migrateLegacyProducts } from '../../../server/products.js';
import { loadSettings, assemblyFeePence } from '../../../server/settings.js';
import { isAdmin } from '../../../server/auth.js';

export async function onRequestGet({ request, env, params }) {
    const id = cleanText(params.id, 100);
    await migrateLegacyProducts(env);
    const settings = await loadSettings(env);
    // Admins can open hidden products (to edit them); everyone else gets "not found".
    const admin = await isAdmin(request, env);
    const product = await getProduct(env, id, assemblyFeePence(settings), { includeHidden: admin });
    if (!product) throw new HttpError(404, 'Product not found.');
    return json(product, 200, {
        'Cache-Control': admin || product.isHidden ? 'private, no-store' : 'public, max-age=20',
    });
}
