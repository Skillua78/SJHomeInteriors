/**
 * GET /api/catalog - category / subcategory counts for navigation.
 */
import { json } from '../../server/http.js';
import { loadFacets, migrateLegacyProducts } from '../../server/products.js';

export async function onRequestGet({ env }) {
    await migrateLegacyProducts(env);
    return json(await loadFacets(env), 200, { 'Cache-Control': 'public, max-age=30' });
}
