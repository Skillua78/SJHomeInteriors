/**
 * AI / JSON product import: prompt text, parsing and clean-up. Pure functions
 * (see tests/import.test.js) - the modal only handles the screen.
 */
import { sanitizeText, validateSafeImageUrl } from '../../../utils/security';

const HEX = /^#[0-9a-fA-F]{6}$/;
const OPTION_FIELDS = ['fabrics', 'sizes', 'mattresses', 'liftOptions'];

const list = (value) => (Array.isArray(value) ? value : []);
const unique = (values) => Array.from(new Set(values));

/** Case-insensitive match against names the shop already uses, so "sofas" becomes "Sofas". */
function canonical(name, known) {
    const lower = name.toLowerCase();
    return known.find((k) => k.toLowerCase() === lower) || name;
}

/**
 * The prompt an admin pastes into an AI assistant along with supplier notes.
 * It lists the shop's current categories and colours so the AI reuses them,
 * and explains how to introduce new ones.
 */
export function buildAiPrompt({ categories = [], colours = [] } = {}) {
    const categoryList = categories.length ? categories.map((c) => `"${c}"`).join(', ') : '"Sofas", "Beds"';
    const colourList = colours.slice(0, 80).join(', ');

    return `Convert the following raw furniture product notes into a valid JSON object (or an array of JSON objects if several products are listed) for SJ Home Interiors.

Rules:
1. Return ONLY raw valid JSON (no markdown backticks, no commentary).
2. Convert ALL CAPS titles into clean Title Case.
3. Keep descriptions factual: only state what the notes say about materials, construction and features.
4. "price" is required and must be the selling price in GBP as a number. If the notes give no price, leave the product out and say so instead of guessing.
5. Format sizes and dimensions with BOTH cm and ft/in, e.g. "5ft King (150 × 200 cm)" or "215 cm (7ft 1in)".
6. Category: use one of our existing categories when it fits: ${categoryList}. If none fits, use a short new category name (e.g. "Mirrors", "Rugs") - it will be created automatically. "subcategory" is optional and may also be new.
7. "colors" lists every colour the product comes in. "finishes" lists non-colour finishes (e.g. "High Gloss", "Matt", "Brushed Oak", "Chrome Legs"). Both may contain new names.${colourList ? `\n   Colours we already use (reuse the exact spelling where one matches): ${colourList}.` : ''}
8. For every colour or finish that is NOT in the list above, add an entry to "colorHex" with a 6-digit hex code that best represents it, so we can show a swatch.
9. Only include "mattresses" and "liftOptions" for beds; use empty arrays [] otherwise.
10. "priceDeltas" holds the price difference in GBP from the base price for an option (0 or omit for no difference, negative for cheaper).
11. Leave "images" as [] unless the notes include https image links.
12. Omit "stock", "badge" and "delivery" unless the notes state them.

JSON shape:
{
  "name": "Kensington Wingback Gas-Lift Ottoman Bed",
  "price": 649.00,
  "previousPrice": 799.00,
  "description": "Upholstered ottoman bed with a wingback headboard and gas-lift storage...",
  "category": "Beds",
  "subcategory": "Ottoman Beds",
  "colors": ["Cream", "Grey", "Dusty Rose"],
  "finishes": ["Chrome Feet"],
  "colorHex": { "Dusty Rose": "#C9A0A0", "Chrome Feet": "#B8BCC0" },
  "features": ["Hydraulic gas-lift storage", "Solid hardwood frame"],
  "images": [],
  "variations": {
    "fabrics": ["Plush Velvet", "Naples"],
    "sizes": ["4ft 6in Double (135 × 190 cm)", "5ft King (150 × 200 cm)"],
    "mattresses": ["No Mattress (Frame Only)", "Orthopaedic"],
    "liftOptions": ["End Lift Ottoman", "Side Lift Ottoman"],
    "priceDeltas": {
      "fabrics": {},
      "sizes": { "5ft King (150 × 200 cm)": 60 },
      "mattresses": { "Orthopaedic": 129 },
      "liftOptions": {}
    },
    "structuredDimensions": {
      "default": { "length": "205 cm (6ft 9in)", "width": "148 cm (4ft 10in)", "depth": "137 cm (4ft 6in)", "custom": "" },
      "bySize": {}
    }
  }
}

RAW PRODUCT INFORMATION TO CONVERT:
[PASTE YOUR SUPPLIER NOTES / PRODUCT DETAILS HERE]`;
}

/** Pull the product objects out of pasted text (tolerates \`\`\`json fences and a { products: [] } wrapper). */
export function parseImportJson(text) {
    const cleaned = String(text || '')
        .trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
    if (!cleaned) return { ok: false, error: 'Upload a .json file or paste the AI-generated JSON first.' };

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (err) {
        return { ok: false, error: `That is not valid JSON: ${err.message}` };
    }

    const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : [parsed];
    const objects = items.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
    if (objects.length === 0) return { ok: false, error: 'No product objects were found in the JSON.' };
    if (objects.length > 100) return { ok: false, error: 'Please import at most 100 products at a time.' };
    return { ok: true, items: objects };
}

function cleanNames(values, max) {
    return unique(
        list(values)
            .map((v) => sanitizeText(String(v ?? ''), max))
            .filter(Boolean)
    );
}

/**
 * Turn one raw imported object into a product the editor can load.
 * Returns { ok, product, colorHex } or { ok: false, error } - nothing is
 * invented: a product without a name or a real price is rejected, not saved at £0.
 *
 * @param known { categories: string[], colours: string[] } names already in the shop
 */
export function normaliseImportedProduct(raw, known = {}) {
    const name = sanitizeText(String(raw.name ?? raw.title ?? ''), 120);
    if (!name) return { ok: false, error: 'A product is missing its "name".' };

    const price = Number(raw.price);
    if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: `"${name}" has no valid "price".` };
    }

    const rawCategory = sanitizeText(String(raw.category ?? ''), 40);
    if (!rawCategory) return { ok: false, error: `"${name}" has no "category".` };
    const category = canonical(rawCategory, known.categories || []);

    const previous = Number(raw.previousPrice ?? raw.previous_price);
    const v = raw.variations && typeof raw.variations === 'object' ? raw.variations : {};

    // Colours and finishes share one list on the site ("Colours & finishes").
    const colours = cleanNames([...list(raw.colors ?? raw.colours), ...list(raw.finishes)], 35).map(
        (c) => canonical(c, known.colours || [])
    );

    const colorHex = {};
    const rawHex = raw.colorHex ?? raw.colourHex;
    if (rawHex && typeof rawHex === 'object') {
        for (const [key, hex] of Object.entries(rawHex)) {
            const colourName = canonical(sanitizeText(String(key), 35), known.colours || []);
            if (colours.includes(colourName) && HEX.test(String(hex))) colorHex[colourName] = String(hex);
        }
    }

    const options = {};
    const priceDeltas = {};
    for (const field of OPTION_FIELDS) {
        options[field] = cleanNames(v[field], 80);
        priceDeltas[field] = {};
        const deltas = v.priceDeltas?.[field];
        if (deltas && typeof deltas === 'object') {
            for (const option of options[field]) {
                const delta = Number(deltas[option]);
                if (Number.isFinite(delta) && delta !== 0) priceDeltas[field][option] = delta;
            }
        }
    }

    const dims = v.structuredDimensions && typeof v.structuredDimensions === 'object' ? v.structuredDimensions : null;
    const dimension = (d = {}) => ({
        length: sanitizeText(String(d.length ?? ''), 60),
        width: sanitizeText(String(d.width ?? ''), 60),
        depth: sanitizeText(String(d.depth ?? ''), 60),
        custom: sanitizeText(String(d.custom ?? ''), 200),
    });
    const bySize = {};
    for (const [size, d] of Object.entries(dims?.bySize && typeof dims.bySize === 'object' ? dims.bySize : {})) {
        if (options.sizes.includes(size)) bySize[size] = dimension(d);
    }
    const structuredDimensions = {
        default: dims
            ? dimension(dims.default)
            : dimension({
                  length: raw.length,
                  width: raw.width,
                  depth: raw.depth,
                  custom: list(raw.dimensions).join(' | '),
              }),
        bySize,
    };

    const images = unique(
        [raw.image, ...list(raw.images)]
            .map((u) => validateSafeImageUrl(u))
            .filter((u) => u.startsWith('https://'))
    ).slice(0, 10);

    const stock = raw.stock === null || raw.stock === undefined || raw.stock === '' ? null : parseInt(raw.stock, 10);

    return {
        ok: true,
        colorHex,
        product: {
            name,
            price: Math.round(price * 100) / 100,
            previousPrice: Number.isFinite(previous) && previous > price ? previous : null,
            description: sanitizeText(String(raw.description ?? ''), 4000),
            category,
            subcategory: sanitizeText(String(raw.subcategory ?? ''), 40),
            badge: sanitizeText(String(raw.badge ?? ''), 40),
            stock: Number.isInteger(stock) && stock >= 0 ? stock : null,
            isPopular: Boolean(raw.isPopular ?? raw.is_popular),
            isTrending: Boolean(raw.isTrending ?? raw.is_trending),
            delivery: sanitizeText(String(raw.delivery ?? ''), 60),
            colors: colours,
            images,
            features: (typeof raw.features === 'string' ? raw.features.split(',') : list(raw.features))
                .map((f) => sanitizeText(String(f), 160))
                .filter(Boolean),
            variations: { ...options, priceDeltas, structuredDimensions },
        },
    };
}

/**
 * Parse and clean a whole import. Returns { ok, products, additions } where
 * `additions` is what the shop's library is missing:
 *   categories: { "Mirrors": ["Wall Mirrors"] }   new categories / subcategories
 *   colours:    { "Dusty Rose": "#C9A0A0" | null } new colours & finishes (null = no swatch given)
 *
 * @param library { taxonomy: { category: [subcategories] }, colorNames: string[] }
 */
export function prepareImport(text, library = {}) {
    const parsed = parseImportJson(text);
    if (!parsed.ok) return parsed;

    const taxonomy = library.taxonomy || {};
    const known = { categories: Object.keys(taxonomy), colours: library.colorNames || [] };

    const products = [];
    const categories = {};
    const colours = {};

    for (const raw of parsed.items) {
        const result = normaliseImportedProduct(raw, known);
        if (!result.ok) return result;
        const { product, colorHex } = result;
        products.push(product);

        const knownSubs = taxonomy[product.category];
        const subIsNew = product.subcategory && !(knownSubs || []).includes(product.subcategory);
        if (!knownSubs || subIsNew) {
            categories[product.category] = unique([
                ...(categories[product.category] || []),
                ...(subIsNew ? [product.subcategory] : []),
            ]);
        }
        for (const colour of product.colors) {
            if (!known.colours.includes(colour)) colours[colour] = colorHex[colour] || colours[colour] || null;
        }
    }

    return { ok: true, products, additions: { categories, colours } };
}

/** One-line description of what an import will add to the library, or '' if nothing. */
export function describeAdditions(additions, taxonomy = {}) {
    const newCategories = Object.keys(additions.categories).filter((c) => !taxonomy[c]);
    const newSubs = Object.values(additions.categories).flat();
    const newColours = Object.keys(additions.colours);
    const parts = [];
    if (newCategories.length) parts.push(`new categor${newCategories.length === 1 ? 'y' : 'ies'}: ${newCategories.join(', ')}`);
    if (newSubs.length) parts.push(`new subcategor${newSubs.length === 1 ? 'y' : 'ies'}: ${newSubs.join(', ')}`);
    if (newColours.length) parts.push(`new colours/finishes: ${newColours.join(', ')}`);
    return parts.join(' · ');
}
