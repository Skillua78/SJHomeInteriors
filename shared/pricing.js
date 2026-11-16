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

/** Assembly fee for a product: its own fee when set (0 = none), else the site default. */
export function resolveAssemblyFeePence(productFeePence, defaultFeePence) {
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
 * Assembly is one optional charge per order. Products can carry their own
 * assembly fee, so an order that includes assembly pays the highest fee among
 * its items (more items do not multiply it).
 */
export function orderAssemblyPence(lines) {
    let pence = 0;
    for (const line of lines) pence = Math.max(pence, Math.round(line.assemblyUnitPence || 0));
    return pence;
}

/**
 * Basket totals.
 * @param lines [{ unitPence, assemblyUnitPence, qty }]
 * @param deliveryPence  delivery charge for this order (0 when collecting, or when the
 *                       address is inside the free-delivery radius)
 * @param assembly       true when the customer added the optional assembly service
 */
export function computeTotals(lines, { deliveryPence = 0, assembly = false } = {}) {
    let subtotalPence = 0;
    for (const line of lines) {
        const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
        subtotalPence += Math.round(line.unitPence) * qty;
    }
    const delivery = Math.max(0, Math.round(deliveryPence) || 0);
    const assemblyPence = assembly ? orderAssemblyPence(lines) : 0;
    return {
        subtotalPence,
        deliveryPence: delivery,
        assemblyPence,
        totalPence: subtotalPence + delivery + assemblyPence,
    };
}
