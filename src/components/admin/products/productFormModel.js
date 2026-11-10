/**
 * Product editor form <-> API payload conversion. Pure functions only
 * (see tests/productFormModel.test.js).
 */
import { sanitizeText, validateSafeImageUrl } from '../../../utils/security';

export const MAX_PHOTOS = 10;
export const VARIATION_FIELDS = ['fabrics', 'sizes', 'mattresses', 'liftOptions'];

const emptyDimension = () => ({ length: '', width: '', depth: '', custom: '' });

export function emptyForm() {
    return {
        name: '',
        price: '',
        previousPrice: '',
        deliveryFee: '',
        description: '',
        category: '',
        subcategory: '',
        stock: '',
        badge: '',
        delivery: '',
        selectedColors: [],
        imageInput: '',
        images: [],
        fabrics: [],
        sizes: [],
        mattresses: [],
        liftOptions: [],
        priceDeltas: { fabrics: {}, sizes: {}, mattresses: {}, liftOptions: {} },
        structuredDimensions: { default: emptyDimension(), bySize: {} },
        features: '',
        isPopular: false,
        isTrending: false,
    };
}

const text = (value) => (value === null || value === undefined ? '' : String(value));

/** Load a full product into the form, for editing or as the basis of a copy. */
export function productToForm(product, { duplicate = false } = {}) {
    const v = product.variations || {};
    const dims = v.structuredDimensions || {
        default: { ...emptyDimension(), custom: (product.dimensions || []).join(', ') },
        bySize: {},
    };
    const gallery =
        Array.isArray(product.images) && product.images.length
            ? product.images
            : product.image
                ? [product.image]
                : [];

    const deltas = {};
    for (const field of VARIATION_FIELDS) deltas[field] = { ...(v.priceDeltas?.[field] || {}) };

    return {
        ...emptyForm(),
        name: duplicate ? `${product.name} (Copy)` : product.name || '',
        price: text(product.price),
        previousPrice: text(product.previousPrice),
        deliveryFee: text(product.deliveryFeeOverride),
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        stock: text(product.stock),
        badge: product.badge || '',
        delivery: product.delivery || '',
        selectedColors: [...(product.colors || [])],
        images: [...gallery],
        fabrics: [...(v.fabrics || [])],
        sizes: [...(v.sizes || [])],
        mattresses: [...(v.mattresses || [])],
        liftOptions: [...(v.liftOptions || [])],
        priceDeltas: deltas,
        structuredDimensions: {
            default: { ...emptyDimension(), ...(dims.default || {}) },
            bySize: JSON.parse(JSON.stringify(dims.bySize || {})),
        },
        features: (product.features || []).join(', '),
        isPopular: Boolean(product.isPopular),
        isTrending: Boolean(product.isTrending),
    };
}

function optionalNumber(raw, { integer = false } = {}) {
    const trimmed = text(raw).trim();
    if (trimmed === '') return null;
    const n = integer ? parseInt(trimmed, 10) : parseFloat(trimmed);
    return Number.isNaN(n) || n < 0 ? null : n;
}

/**
 * Validate the form and build the API payload.
 * Returns { ok: true, payload } or { ok: false, error, section }.
 */
export function formToPayload(form, editingId = null) {
    const name = sanitizeText(form.name, 120);
    const price = parseFloat(form.price);

    if (!name || Number.isNaN(price) || price < 0) {
        return { ok: false, section: 'basics', error: 'Please enter a product title and a valid base price.' };
    }
    if (!form.category) {
        return { ok: false, section: 'basics', error: 'Please choose a furniture category.' };
    }

    const feeText = text(form.deliveryFee).trim();
    if (feeText !== '' && (Number.isNaN(parseFloat(feeText)) || parseFloat(feeText) < 0)) {
        return {
            ok: false,
            section: 'basics',
            error: 'Delivery & assembly fee must be a number (0 for no charge) or left blank for the standard fee.',
        };
    }

    const images = [...form.images];
    const pending = validateSafeImageUrl(text(form.imageInput).trim());
    if (pending && images.length < MAX_PHOTOS) images.push(pending);

    // Only keep price adjustments and per-size dimensions for options that are still selected.
    const priceDeltas = {};
    for (const field of VARIATION_FIELDS) {
        priceDeltas[field] = {};
        for (const option of form[field]) {
            const delta = Number(form.priceDeltas?.[field]?.[option]);
            if (Number.isFinite(delta) && delta !== 0) priceDeltas[field][option] = delta;
        }
    }
    const bySize = {};
    for (const size of form.sizes) {
        const dim = form.structuredDimensions?.bySize?.[size];
        if (dim && Object.values(dim).some(Boolean)) bySize[size] = dim;
    }

    const def = form.structuredDimensions?.default || emptyDimension();
    const dimensions = [];
    const summary = [
        def.length ? `Length: ${def.length}` : '',
        def.width ? `Width: ${def.width}` : '',
        def.depth ? `Depth: ${def.depth}` : '',
    ]
        .filter(Boolean)
        .join(' | ');
    if (summary) dimensions.push(summary);
    if (def.custom) dimensions.push(def.custom);

    const payload = {
        name,
        price,
        previousPrice: optionalNumber(form.previousPrice) || null,
        deliveryFeeOverride: optionalNumber(form.deliveryFee),
        description: sanitizeText(form.description, 4000),
        category: form.category,
        subcategory: form.subcategory || '',
        badge: sanitizeText(form.badge, 40),
        stock: optionalNumber(form.stock, { integer: true }),
        isPopular: Boolean(form.isPopular),
        isTrending: Boolean(form.isTrending),
        delivery: sanitizeText(form.delivery, 60),
        colors: form.selectedColors,
        images,
        dimensions,
        features: form.features
            .split(',')
            .map((f) => sanitizeText(f, 160))
            .filter(Boolean),
        variations: {
            fabrics: form.fabrics,
            sizes: form.sizes,
            mattresses: form.mattresses,
            liftOptions: form.liftOptions,
            priceDeltas,
            structuredDimensions: { default: def, bySize },
        },
    };
    if (editingId) payload.id = editingId;

    return { ok: true, payload };
}

/** Convert a loaded product back into a payload (used to undo an edit). */
export function productToPayload(product) {
    return formToPayload(productToForm(product), product.id).payload;
}
