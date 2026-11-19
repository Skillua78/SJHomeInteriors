import { useCallback, useState } from 'react';
import { api } from '../../utils/api';
import { productToPayload } from './products/productFormModel';

const MAX_UNDO = 20;

/**
 * Catalogue mutations for the admin dashboard, with a simple undo stack.
 * Every action talks to the API first; nothing is reported as saved unless
 * the server confirmed it.
 *
 * @param onChanged called after any successful change so lists can refresh
 */
export function useAdminCatalog(onChanged) {
    const [undoStack, setUndoStack] = useState([]);
    const [notice, setNotice] = useState(null); // { tone: 'ok' | 'error', text }

    const pushUndo = (entry) => setUndoStack((prev) => [entry, ...prev].slice(0, MAX_UNDO));
    const ok = (text) => setNotice({ tone: 'ok', text });
    const fail = (err) =>
        setNotice({
            tone: 'error',
            text:
                err?.status === 401
                    ? 'Your admin session has expired. Please sign in again.'
                    : err?.message || 'That change could not be saved.',
        });

    /** Create or update. Throws so the editor can show the error next to the form. */
    const saveProduct = useCallback(
        /** @param quiet bulk import: skip the per-product message and list refresh (call refresh() once after). */
        async (payload, original, { quiet = false } = {}) => {
            if (original) {
                await api.updateProduct(payload);
                pushUndo({ type: 'update', label: `edit of ${original.name}`, previous: original });
                if (!quiet) ok(`Saved “${payload.name}”.`);
            } else {
                const { id } = await api.addProduct(payload);
                pushUndo({ type: 'add', label: `adding ${payload.name}`, id });
                if (!quiet) ok(`Added “${payload.name}” to the catalogue.`);
            }
            if (!quiet) onChanged();
        },
        [onChanged]
    );

    const deleteProduct = useCallback(
        async (product) => {
            try {
                await api.deleteProduct(product.id);
                pushUndo({ type: 'delete', label: `deleting ${product.name}`, id: product.id });
                ok(`Deleted “${product.name}”. Use Undo to bring it back.`);
            } catch (err) {
                fail(err);
            }
            onChanged();
        },
        [onChanged]
    );

    const setStock = useCallback(
        async (product, stock) => {
            try {
                await api.updateStock(product.id, stock);
                pushUndo({
                    type: 'stock',
                    label: `stock change on ${product.name}`,
                    id: product.id,
                    previousStock: product.stock ?? null,
                });
            } catch (err) {
                fail(err);
                onChanged(); // put the list back to what the server has
            }
        },
        [onChanged]
    );

    const setHidden = useCallback(
        async (product, hidden) => {
            try {
                await api.setProductHidden(product.id, hidden);
                pushUndo({
                    type: 'hidden',
                    label: `${hidden ? 'hiding' : 'showing'} ${product.name}`,
                    id: product.id,
                    previousHidden: Boolean(product.isHidden),
                });
                ok(hidden ? `“${product.name}” is now hidden from the website.` : `“${product.name}” is back on the website.`);
            } catch (err) {
                fail(err);
            }
            onChanged();
        },
        [onChanged]
    );

    const undo = useCallback(async () => {
        const [last, ...rest] = undoStack;
        if (!last) return;
        try {
            if (last.type === 'stock') await api.updateStock(last.id, last.previousStock);
            if (last.type === 'hidden') await api.setProductHidden(last.id, last.previousHidden);
            if (last.type === 'update') await api.updateProduct(productToPayload(last.previous));
            if (last.type === 'delete') await api.restoreProduct(last.id);
            if (last.type === 'add') await api.deleteProduct(last.id);
            setUndoStack(rest);
            ok(`Undid ${last.label}.`);
        } catch (err) {
            fail(err);
        }
        onChanged();
    }, [undoStack, onChanged]);

    return {
        saveProduct,
        refresh: onChanged,
        deleteProduct,
        setStock,
        setHidden,
        undo,
        canUndo: undoStack.length > 0,
        undoLabel: undoStack[0]?.label || '',
        notice,
        clearNotice: () => setNotice(null),
        reportError: fail,
    };
}
