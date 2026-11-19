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

    return `You are preparing product listings for SJ Home Interiors, an independent furniture showroom in Maltby, South Yorkshire. Turn the supplier notes below into a JSON object (or an array of objects if several products are listed).

Output
1. Return ONLY valid JSON: no markdown fences, no commentary.

Naming
2. Write a clean, specific product name in Title Case (e.g. "Bentley Dining Chair – Dark Grey Velvet"), not supplier codes or ALL CAPS.

Description - take the initiative here
3. Do not copy the supplier text. Rewrite it into a short, appealing description in British English:
   - 2 or 3 sentences, about 40–70 words, in plain paragraph form (no bullet points, emojis or headings).
   - Lead with what the piece is and its standout look or feel, then the most useful practical detail (comfort, storage, materials, how it suits a room).
   - Warm and confident but not over the top: avoid "luxury", "stunning", "perfect", "ultimate" and exclamation marks.
   - Fix spelling, grammar and repetition in the notes.
   - Use ONLY facts found in the notes. Never invent materials, dimensions, weights, guarantees, origin (e.g. "British-made") or delivery promises.
4. Put the practical specifics in "features": 3–6 short phrases (2–6 words each), e.g. "Quilted back with ring knocker", "Black wooden legs". Do not repeat the description word for word.

Price
5. "price" is the selling price in GBP as a number.
   - If the notes give a price, use it and set "priceIsEstimate": false.
   - If the notes give NO price, estimate a realistic UK retail price for an independent furniture shop and set "priceIsEstimate": true. Estimated products are imported hidden from the website until the shop confirms the price.
   - Only set "previousPrice" if the notes give a real former / RRP price.

Options and sizes
6. Format sizes and dimensions with BOTH cm and ft/in, e.g. "5ft King (150 × 200 cm)" or "215 cm (7ft 1in)".
7. Only include "mattresses" and "liftOptions" for beds; use empty arrays [] otherwise.
8. "priceDeltas" holds the price difference in GBP from the base price for an option (omit for no difference, negative for cheaper).

Categories and colours
9. Category: use one of our existing categories when it fits: ${categoryList}. If none fits, use a short new category name (e.g. "Mirrors", "Rugs") - it will be created automatically. "subcategory" is optional and may also be new.
10. "colors" lists every colour the product comes in. "finishes" lists non-colour finishes (e.g. "High Gloss", "Matt", "Brushed Oak", "Chrome Legs"). Both may contain new names.${colourList ? `\n    Colours we already use (reuse the exact spelling where one matches): ${colourList}.` : ''}
11. For every colour or finish that is NOT in that list, add an entry to "colorHex" with a 6-digit hex code that best represents it, so we can show a swatch.

Other fields
12. Leave "images" as [] unless the notes include https image links.
13. Omit "stock", "badge" and "delivery" unless the notes state them.
14. If an object already has an "id" (from our own export), keep it exactly as it is - that is how we update the existing product instead of creating a copy.

JSON shape:
{
  "name": "Kensington Wingback Ottoman Bed",
  "price": 649.00,
  "priceIsEstimate": false,
  "previousPrice": 799.00,
  "description": "A tall wingback headboard and soft plush velvet give this ottoman bed a tailored look. Lift the base on its gas struts to reveal deep storage for bedding and suitcases, keeping the room clear.",
  "category": "Beds",
  "subcategory": "Ottoman Beds",
  "colors": ["Cream", "Grey", "Dusty Rose"],
  "finishes": ["Chrome Feet"],
  "colorHex": { "Dusty Rose": "#C9A0A0", "Chrome Feet": "#B8BCC0" },
  "features": ["Gas-lift ottoman storage", "Wingback headboard", "Plush velvet upholstery"],
  "images": [],
  "variations": {
    "fabrics": ["Plush Velvet", "Naples"],
    "sizes": ["4ft 6in Double (135 × 190 cm)", "5ft King (150 × 200 cm)"],
    "mattresses": ["No Mattress (Frame Only)", "Orthopaedic"],
    "liftOptions": ["End Lift Ottoman", "Side Lift Ottoman"],
    "priceDeltas": {
      "sizes": { "5ft King (150 × 200 cm)": 60 },
      "mattresses": { "Orthopaedic": 129 }
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
 * Returns { ok, product, colorHex } or { ok: false, error }.
 *
 * Price rules: a confirmed price is used as-is. An estimated price ("priceIsEstimate": true)
 * or a missing price still imports, but the product is saved HIDDEN and flagged
 * "price to check", so a guess can never appear on the website.
 *
 * @param known   { categories: string[], colours: string[] } names already in the shop
 * @param options { hideAll } - import everything hidden
 */
export function normaliseImportedProduct(raw, known = {}, options = {}) {
    const name = sanitizeText(String(raw.name ?? raw.title ?? ''), 120);
    if (!name) return { ok: false, error: 'A product is missing its "name".' };

    const rawPrice = Number(raw.price);
    const hasPrice = Number.isFinite(rawPrice) && rawPrice > 0;
    const price = hasPrice ? rawPrice : 0;
    const estimated =
        raw.priceIsEstimate === true ||
        raw.priceConfirmed === false ||
        raw.priceNeedsReview === true;
    const priceNeedsReview = !hasPrice || estimated;
    const isHidden = Boolean(options.hideAll || raw.isHidden || priceNeedsReview);

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

    const opts = {};
    const priceDeltas = {};
    for (const field of OPTION_FIELDS) {
        opts[field] = cleanNames(v[field], 80);
        priceDeltas[field] = {};
        const deltas = v.priceDeltas?.[field];
        if (deltas && typeof deltas === 'object') {
            for (const option of opts[field]) {
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
        if (opts.sizes.includes(size)) bySize[size] = dimension(d);
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

    // https links and this site's own photo links (from an export). Each photo keeps its colour tag.
    const rawImages = list(raw.images).length ? list(raw.images) : [raw.image];
    const rawPhotoColours = list(v.photoColors);
    const images = [];
    const photoColors = [];
    rawImages.forEach((u, i) => {
        const safe = validateSafeImageUrl(u);
        if (!safe || safe.startsWith('data:') || images.includes(safe) || images.length >= 10) return;
        images.push(safe);
        const colour = canonical(sanitizeText(String(rawPhotoColours[i] ?? ''), 35), known.colours || []);
        photoColors.push(colours.includes(colour) ? colour : '');
    });

    const assembly = Number(raw.assemblyFee ?? raw.assemblyFeeOverride);
    const id = sanitizeText(String(raw.id ?? ''), 100);

    const stock = raw.stock === null || raw.stock === undefined || raw.stock === '' ? null : parseInt(raw.stock, 10);

    return {
        ok: true,
        colorHex,
        product: {
            ...(id ? { id } : {}),
            name,
            price: Math.round(price * 100) / 100,
            priceNeedsReview,
            isHidden,
            assemblyFeeOverride:
                raw.assemblyFee === null || raw.assemblyFee === undefined || !Number.isFinite(assembly) || assembly < 0
                    ? null
                    : assembly,
            previousPrice: Number.isFinite(previous) && previous > price && hasPrice ? previous : null,
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
            variations: { ...opts, priceDeltas, structuredDimensions, photoColors },
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
 * @param options { hideAll }
 */
export function prepareImport(text, library = {}, options = {}) {
    const parsed = parseImportJson(text);
    if (!parsed.ok) return parsed;

    const taxonomy = library.taxonomy || {};
    const known = { categories: Object.keys(taxonomy), colours: library.colorNames || [] };

    const products = [];
    const categories = {};
    const colours = {};

    for (const raw of parsed.items) {
        const result = normaliseImportedProduct(raw, known, options);
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

/**
 * A full product (from the API) as an import-ready object. Edit it and import it
 * again: the "id" makes the import update this product instead of adding a copy.
 */
export function productToImportJson(product) {
    const v = product.variations || {};
    const pick = (field) => (Array.isArray(v[field]) ? v[field] : []);
    const deltas = {};
    for (const field of OPTION_FIELDS) {
        const d = v.priceDeltas?.[field] || {};
        if (Object.keys(d).length) deltas[field] = d;
    }
    const json = {
        id: product.id,
        name: product.name,
        price: product.price,
        priceIsEstimate: Boolean(product.priceNeedsReview),
        previousPrice: product.previousPrice ?? null,
        isHidden: Boolean(product.isHidden),
        category: product.category,
        subcategory: product.subcategory || '',
        description: product.description || '',
        features: product.features || [],
        colors: product.colors || [],
        badge: product.badge || '',
        stock: product.stock ?? null,
        delivery: product.delivery || '',
        isPopular: Boolean(product.isPopular),
        isTrending: Boolean(product.isTrending),
        assemblyFee: product.assemblyFeeOverride ?? null,
        images: product.images || [],
        variations: {
            fabrics: pick('fabrics'),
            sizes: pick('sizes'),
            mattresses: pick('mattresses'),
            liftOptions: pick('liftOptions'),
            priceDeltas: deltas,
            structuredDimensions: v.structuredDimensions || { default: {}, bySize: {} },
            photoColors: pick('photoColors'),
        },
    };
    return json;
}

/** The text of an export file for one or many products. */
export function buildExportFile(products) {
    return JSON.stringify(
        {
            note: 'SJ Home Interiors product export. Edit and import again via Admin > Products > AI / JSON Import. Keep each "id" to update that product; remove it to create a new one.',
            exportedAt: new Date().toISOString(),
            products: products.map(productToImportJson),
        },
        null,
        2
    );
}

/**
 * One spreadsheet cell. Quotes when needed, and stops a cell that starts with = + - @
 * from being run as a formula when the file is opened in Excel (CSV injection).
 */
function csvCell(value) {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const BOM = String.fromCharCode(0xfeff);

const money = (n) => (Number.isFinite(Number(n)) && n !== null && n !== '' ? Number(n).toFixed(2) : '');

/** The whole inventory as a CSV spreadsheet (opens in Excel, Numbers or Google Sheets). */
export function buildInventoryCsv(products) {
    const header = [
        'ID',
        'Name',
        'Category',
        'Subcategory',
        'Price (GBP)',
        'Was price (GBP)',
        'Stock',
        'On website',
        'Price to check',
        'Colours',
        'Fabrics',
        'Sizes',
        'Mattresses',
        'Assembly fee (GBP)',
        'Photos',
        'Dimensions',
        'Features',
        'Description',
    ];
    const rows = products.map((p) => {
        const v = p.variations || {};
        const d = v.structuredDimensions?.default || {};
        const dims = [d.length && `L ${d.length}`, d.width && `W ${d.width}`, d.depth && `D/H ${d.depth}`, d.custom]
            .filter(Boolean)
            .join(' · ') || (p.dimensions || []).join(' · ');
        return [
            p.id,
            p.name,
            p.category,
            p.subcategory,
            money(p.price),
            p.previousPrice > p.price ? money(p.previousPrice) : '',
            p.stock === null || p.stock === undefined ? 'Not tracked' : p.stock,
            p.isHidden ? 'Hidden' : 'Yes',
            p.priceNeedsReview ? 'Yes' : '',
            (p.colors || []).join(', '),
            (v.fabrics || []).join(', '),
            (v.sizes || []).join(', '),
            (v.mattresses || []).join(', '),
            money(p.assemblyFee),
            (p.images || []).length || p.imageCount || 0,
            dims,
            (p.features || []).join('; '),
            p.description,
        ];
    });
    // The BOM makes Excel read the file as UTF-8 (accents, "·").
    return BOM + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
