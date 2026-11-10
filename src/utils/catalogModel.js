/**
 * Pure helpers that turn product data into what the storefront needs.
 * No React, no network - covered by tests/catalogModel.test.js.
 */
import {
    OPTION_GROUPS,
    priceSelection,
    toPence,
    fromPence,
    resolveDeliveryFeePence,
} from '../../shared/pricing.js';

export const MAX_QTY_PER_LINE = 20;

/** Flatten a product's `variations` into the option list the pricing rules use. */
export function optionsFromVariations(variations) {
    const v = variations || {};
    const options = [];
    for (const group of OPTION_GROUPS) {
        const names = Array.isArray(v[group.field]) ? v[group.field] : [];
        const deltas = v.priceDeltas?.[group.field] || {};
        for (const name of names) {
            options.push({ grp: group.key, name, deltaPence: toPence(deltas[name] || 0) });
        }
    }
    return options;
}

/** Build a basket line for a product + chosen options. Returns { ok, line?, error? }. */
export function buildCartLine(product, selections = {}) {
    const priced = priceSelection(
        toPence(product.price),
        optionsFromVariations(product.variations),
        selections
    );
    if (!priced.ok) return priced;

    return {
        ok: true,
        line: {
            key: `${product.id}|${JSON.stringify(priced.selections)}`,
            id: product.id,
            name: product.name,
            image: product.image || product.images?.[0] || '',
            category: product.category || '',
            selections: priced.selections,
            label: priced.label,
            unitPrice: fromPence(priced.unitPence),
            deliveryFee: Number(product.deliveryFee) || 0,
            qty: 1,
        },
    };
}

/** Add a line to a basket, merging with an identical existing line. */
export function addLine(cart, line) {
    const idx = cart.findIndex((item) => item.key === line.key);
    if (idx === -1) return [...cart, line];
    return cart.map((item, i) =>
        i === idx ? { ...item, ...line, qty: Math.min(MAX_QTY_PER_LINE, item.qty + 1) } : item
    );
}

export function changeQty(cart, key, delta) {
    return cart
        .map((item) =>
            item.key === key
                ? { ...item, qty: Math.min(MAX_QTY_PER_LINE, item.qty + delta) }
                : item
        )
        .filter((item) => item.qty > 0);
}

/** Totals in pounds for display. One delivery & assembly charge per order (the highest item fee). */
export function cartTotals(cart, deliveryMethod = 'delivery') {
    let subtotalPence = 0;
    let deliveryPence = 0;
    for (const item of cart) {
        subtotalPence += toPence(item.unitPrice) * item.qty;
        deliveryPence = Math.max(deliveryPence, toPence(item.deliveryFee));
    }
    if (deliveryMethod !== 'delivery') deliveryPence = 0;
    return {
        subtotal: fromPence(subtotalPence),
        delivery: fromPence(deliveryPence),
        total: fromPence(subtotalPence + deliveryPence),
        totalPence: subtotalPence + deliveryPence,
    };
}

/** Apply fresh server prices (from a PRICE_CHANGED response) to the basket. */
export function applyQuote(cart, quoteLines) {
    return cart.map((item) => {
        const match = (quoteLines || []).find(
            (q) => q.id === item.id && JSON.stringify(q.selections) === JSON.stringify(item.selections)
        );
        return match ? { ...item, unitPrice: match.unitPrice, deliveryFee: match.deliveryFee } : item;
    });
}

/** Keep only well-formed lines when restoring a basket from localStorage. */
export function sanitiseStoredCart(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter(
            (item) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.key === 'string' &&
                typeof item.name === 'string' &&
                Number.isFinite(Number(item.unitPrice)) &&
                Number.isInteger(item.qty) &&
                item.qty > 0
        )
        .slice(0, 30)
        .map((item) => ({
            ...item,
            qty: Math.min(MAX_QTY_PER_LINE, item.qty),
            selections: item.selections && typeof item.selections === 'object' ? item.selections : {},
        }));
}

/* ---------- offline catalogue (used only when the API is unreachable, e.g. `vite dev`) ---------- */

function summarise(product, defaultFeePounds) {
    const v = product.variations || {};
    const def = v.structuredDimensions?.default;
    const dimSummary = def
        ? [
              def.length ? `L: ${def.length}` : '',
              def.width ? `W: ${def.width}` : '',
              def.depth ? `D: ${def.depth}` : '',
          ]
              .filter(Boolean)
              .join(' × ')
        : '';
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
    return {
        ...product,
        description: (product.description || '').slice(0, 240),
        image: images[0] || '',
        imageCount: images.filter(Boolean).length,
        fabricCount: (v.fabrics || []).length,
        sizeCount: (v.sizes || []).length,
        hasOptions: optionsFromVariations(v).length > 0,
        dimSummary: dimSummary || product.dimensions?.[0] || '',
        deliveryFee: fromPence(
            resolveDeliveryFeePence(
                product.deliveryFeeOverride === undefined || product.deliveryFeeOverride === null
                    ? null
                    : toPence(product.deliveryFeeOverride),
                toPence(defaultFeePounds)
            )
        ),
    };
}

export function localListProducts(products, params = {}, defaultFeePounds = 50) {
    const q = (params.q || '').toLowerCase();
    let list = products.filter((p) => {
        if (params.category === 'Popular' && !p.isPopular) return false;
        if (params.category === 'Trending' && !p.isTrending) return false;
        if (
            params.category &&
            !['All', 'Popular', 'Trending'].includes(params.category) &&
            p.category !== params.category
        ) {
            return false;
        }
        if (params.subcategory && params.subcategory !== 'All' && p.subcategory !== params.subcategory) {
            return false;
        }
        if (!q) return true;
        return [p.name, p.description, p.category, p.subcategory, p.id]
            .join(' ')
            .toLowerCase()
            .includes(q);
    });
    if (params.sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (params.sort === 'high') list = [...list].sort((a, b) => b.price - a.price);

    const offset = params.offset || 0;
    const limit = params.limit || 24;
    return {
        items: list.slice(offset, offset + limit).map((p) => summarise(p, defaultFeePounds)),
        nextOffset: offset + limit < list.length ? offset + limit : null,
        total: list.length,
    };
}

export function localGetProduct(products, id, defaultFeePounds = 50) {
    const found = products.find((p) => p.id === id);
    if (!found) return null;
    return { ...summarise(found, defaultFeePounds), ...{ description: found.description || '' } };
}

export function localFacets(products) {
    const byCategory = new Map();
    for (const p of products) {
        const name = (p.category || '').trim();
        if (!name) continue;
        const entry = byCategory.get(name) || { name, count: 0, image: p.image || '', subcategories: [] };
        entry.count += 1;
        if (p.subcategory) {
            const sub = entry.subcategories.find((s) => s.name === p.subcategory);
            if (sub) sub.count += 1;
            else entry.subcategories.push({ name: p.subcategory, count: 1 });
        }
        byCategory.set(name, entry);
    }
    return {
        total: products.length,
        popular: products.filter((p) => p.isPopular).length,
        trending: products.filter((p) => p.isTrending).length,
        categories: [...byCategory.values()],
    };
}
