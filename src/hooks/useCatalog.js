import { useCallback, useEffect, useRef, useState } from 'react';
import { api, isApiUnavailable } from '../utils/api';
import { initialProducts } from '../data/products';
import { localListProducts, localFacets, localGetProduct } from '../utils/catalogModel';

const PAGE_SIZE = 24;
const EMPTY_FACETS = { total: 0, popular: 0, trending: 0, categories: [] };

// Once the API has been found unreachable (plain `vite dev`), stay on the bundled demo catalogue.
let offlineMode = false;

/** Load one product in full (gallery, options, dimensions). */
export async function fetchProductDetail(id, { fresh = false } = {}) {
    if (!offlineMode) {
        try {
            return await api.getProduct(id, { fresh });
        } catch (err) {
            if (!isApiUnavailable(err)) throw err;
            offlineMode = true;
        }
    }
    return localGetProduct(initialProducts, id);
}

/**
 * Server-driven catalogue: one page of product summaries at a time, filtered
 * and sorted by the API, plus category counts for navigation.
 */
export function useCatalog({ category, subcategory, search, sort }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [facets, setFacets] = useState(EMPTY_FACETS);
    const [offline, setOffline] = useState(offlineMode);
    const [version, setVersion] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    const requestId = useRef(0);
    const freshNext = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchPage = useCallback(
        async (offset, fresh) => {
            const params = {
                category,
                subcategory,
                q: debouncedSearch,
                sort,
                limit: PAGE_SIZE,
                offset,
            };
            if (!offlineMode) {
                try {
                    return await api.listProducts(params, { fresh });
                } catch (err) {
                    if (!isApiUnavailable(err)) throw err;
                    offlineMode = true;
                    setOffline(true);
                }
            }
            return localListProducts(initialProducts, params);
        },
        [category, subcategory, debouncedSearch, sort]
    );

    // First page whenever the filters change (or after refresh()).
    useEffect(() => {
        const id = ++requestId.current;
        const fresh = freshNext.current;
        freshNext.current = false;
        setLoading(true);
        setError('');

        fetchPage(0, fresh)
            .then((page) => {
                if (id !== requestId.current) return;
                setItems(page.items);
                setTotal(page.total ?? page.items.length);
                setNextOffset(page.nextOffset);
            })
            .catch((err) => {
                if (id !== requestId.current) return;
                setItems([]);
                setNextOffset(null);
                setError(err.message || 'Could not load products.');
            })
            .finally(() => {
                if (id === requestId.current) setLoading(false);
            });
    }, [fetchPage, version]);

    // Category counts for navigation.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            let data = null;
            if (!offlineMode) {
                try {
                    data = await api.getFacets({ fresh: version > 0 });
                } catch (err) {
                    if (isApiUnavailable(err)) {
                        offlineMode = true;
                        setOffline(true);
                    }
                }
            }
            if (!data && offlineMode) data = localFacets(initialProducts);
            if (!cancelled && data) setFacets(data);
        })();
        return () => {
            cancelled = true;
        };
    }, [version]);

    const loadMore = useCallback(async () => {
        if (nextOffset === null || loadingMore) return;
        const id = requestId.current;
        setLoadingMore(true);
        try {
            const page = await fetchPage(nextOffset, false);
            if (id !== requestId.current) return;
            setItems((prev) => {
                const seen = new Set(prev.map((p) => p.id));
                return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
            });
            setNextOffset(page.nextOffset);
        } catch (err) {
            setError(err.message || 'Could not load more products.');
        } finally {
            setLoadingMore(false);
        }
    }, [fetchPage, nextOffset, loadingMore]);

    /** Re-fetch from the server, bypassing the short-lived HTTP cache. */
    const refresh = useCallback(() => {
        freshNext.current = true;
        setVersion((v) => v + 1);
    }, []);

    return {
        items,
        total,
        hasMore: nextOffset !== null,
        loading,
        loadingMore,
        error,
        facets,
        offline,
        loadMore,
        refresh,
    };
}
