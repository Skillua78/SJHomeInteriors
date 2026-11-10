/**
 * Pricing rules shared by the storefront (display) and the API (authoritative).
 * All arithmetic is done in integer pence.
 */

export const OPTION_GROUPS = [
    { key: 'fabric', field: 'fabrics', label: 'Fabric' },
    { key: 'size', field: 'sizes', label: 'Size' },
    { key: 'mattress', field: 'mattresses', label: 'Mattress' },
    { key: 'lift', field: 'liftOptions', label: 'Lift' },
];

export const DEFAULT_DELIVERY_FEE_PENCE = 5000;

export function toPence(pounds) {
    const n = Number(pounds);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromPence(pence) {
    return Math.round(Number(pence) || 0) / 100;
}

export function formatGBP(pounds) {
    return `£${Number(pounds || 0).toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/** Delivery & assembly fee for one unit: the product's own fee, else the site default. */
export function resolveDeliveryFeePence(productFeePence, defaultFeePence) {
    if (productFeePence !== null && productFeePence !== undefined && productFeePence !== '') {
        const n = Number(productFeePence);
        if (Number.isFinite(n) && n >= 0) return Math.round(n);
    }
    const d = Number(defaultFeePence);
    return Number.isFinite(d) && d >= 0 ? Math.round(d) : DEFAULT_DELIVERY_FEE_PENCE;
}

/**
 * Price one basket line.
 * @param basePence     product base price
 * @param options       [{ grp, name, deltaPence }] - every option the product offers
 * @param selections    { color, fabric, size, mattress, lift }
 * @returns { ok, error?, unitPence, selections, label }
 */
export function priceSelection(basePence, options, selections = {}) {
    let unitPence = Math.round(Number(basePence) || 0);
    const chosen = {};
    const labelParts = [];

    const color = String(selections.color || '').trim().slice(0, 80);
    if (color) {
        chosen.color = color;
        labelParts.push(color);
    }

    for (const group of OPTION_GROUPS) {
        const available = options.filter((o) => o.grp === group.key);
        if (available.length === 0) continue;

        const wanted = String(selections[group.key] || '').trim();
        const match = available.find((o) => o.name === wanted);
        if (!match) {
            return {
                ok: false,
                error: wanted
                    ? `"${wanted}" is no longer available as a ${group.label.toLowerCase()} option.`
                    : `Please choose a ${group.label.toLowerCase()} option.`,
            };
        }
        unitPence += Math.round(Number(match.deltaPence) || 0);
        chosen[group.key] = match.name;
        labelParts.push(`${group.label}: ${match.name}`);
    }

    return {
        ok: true,
        unitPence: Math.max(0, unitPence),
        selections: chosen,
        label: labelParts.join(' • ') || 'Standard',
    };
}

/**
 * Basket totals. Delivery & assembly is charged per unit and waived for
 * showroom collection.
 * @param lines [{ unitPence, deliveryUnitPence, qty }]
 */
export function computeTotals(lines, deliveryMethod = 'delivery') {
    let subtotalPence = 0;
    let deliveryPence = 0;
    for (const line of lines) {
        const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
        subtotalPence += Math.round(line.unitPence) * qty;
        deliveryPence += Math.round(line.deliveryUnitPence || 0) * qty;
    }
    if (deliveryMethod !== 'delivery') deliveryPence = 0;
    return { subtotalPence, deliveryPence, totalPence: subtotalPence + deliveryPence };
}
