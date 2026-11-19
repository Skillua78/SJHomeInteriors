import { useCallback, useEffect, useState } from 'react';
import { toggleCompare, MAX_COMPARE } from '../utils/storefront';

const KEY = 'sj_compare_v1';

function read() {
    try {
        const list = JSON.parse(sessionStorage.getItem(KEY) || '[]');
        return Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string').slice(0, MAX_COMPARE) : [];
    } catch {
        return [];
    }
}

/** Products picked for side-by-side comparison (kept for this browser tab). */
export function useCompare() {
    const [list, setList] = useState(read);
    const [message, setMessage] = useState('');

    useEffect(() => {
        try {
            sessionStorage.setItem(KEY, JSON.stringify(list));
        } catch {
            // Storage unavailable: comparison still works until the tab closes.
        }
    }, [list]);

    const toggle = useCallback((product) => {
        setList((prev) => {
            const result = toggleCompare(prev, product);
            setMessage(result.error || '');
            return result.list;
        });
    }, []);

    const remove = useCallback((id) => setList((prev) => prev.filter((p) => p.id !== id)), []);
    const clear = useCallback(() => {
        setList([]);
        setMessage('');
    }, []);
    const has = useCallback((id) => list.some((p) => p.id === id), [list]);

    return { list, toggle, remove, clear, has, message, clearMessage: () => setMessage('') };
}
