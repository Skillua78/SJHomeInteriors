import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    addLine,
    applyQuote,
    buildCartLine,
    changeQty,
    sanitiseStoredCart,
} from '../utils/catalogModel';

const STORAGE_KEY = 'sj_cart_v4';
// Earlier versions stored whole product records (and an admin key) in localStorage.
const LEGACY_KEYS = ['sj_cart_v3', 'sj_user_v3', 'sj_admin_api_key'];

function readStoredCart() {
    try {
        LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
        return sanitiseStoredCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
        return [];
    }
}

/**
 * Basket state. Lines hold only what the basket displays plus the chosen
 * options; the server re-prices everything at checkout.
 */
export function useCart() {
    const [cart, setCart] = useState(readStoredCart);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch {
            // Storage full or blocked: the basket still works for this visit.
        }
    }, [cart]);

    /** Returns { ok, error? } so callers can show why an item could not be added. */
    const addItem = useCallback((product, selections) => {
        const built = buildCartLine(product, selections);
        if (!built.ok) return built;
        setCart((prev) => addLine(prev, built.line));
        return { ok: true };
    }, []);

    const updateQty = useCallback((key, delta) => setCart((prev) => changeQty(prev, key, delta)), []);
    const removeItem = useCallback((key) => setCart((prev) => prev.filter((i) => i.key !== key)), []);
    const clear = useCallback(() => setCart([]), []);
    const repriceFromQuote = useCallback((lines) => setCart((prev) => applyQuote(prev, lines)), []);

    const count = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

    return { cart, count, addItem, updateQty, removeItem, clear, repriceFromQuote };
}
