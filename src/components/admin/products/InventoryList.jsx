import { useEffect, useRef, useState } from 'react';
import { Search, Copy, Edit3, Trash2, Plus, Minus, EyeOff, Eye, Loader2, Package, Download } from 'lucide-react';
import { buildExportFile, downloadTextFile } from './importModel';
import { api } from '../../../utils/api';
import { validateSafeImageUrl } from '../../../utils/security';
import { formatGBP } from '../../../../shared/pricing.js';
import { inputClass } from '../adminUi';

const PAGE_SIZE = 30;

/** Stock field that saves when you leave it (not on every keystroke). */
function StockInput({ product, onCommit }) {
    const hidden = product.stock === null || product.stock === undefined;
    const [draft, setDraft] = useState(hidden ? '' : String(product.stock));

    useEffect(() => {
        setDraft(hidden ? '' : String(product.stock));
    }, [product.stock, hidden]);

    const commit = () => {
        const next = draft.trim() === '' ? null : Math.max(0, parseInt(draft, 10) || 0);
        if (next !== (hidden ? null : Number(product.stock))) onCommit(next);
    };

    return (
        <input
            type="number"
            min="0"
            placeholder="—"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label={`Stock for ${product.name}`}
            className="w-14 text-center py-1.5 rounded-lg border border-stone-300 text-sm font-bold"
        />
    );
}

/**
 * Searchable, paginated inventory. Filtering and paging are done by the API,
 * so this stays fast however large the catalogue grows.
 */
export default function InventoryList({
    categoryNames,
    refreshKey,
    editingId,
    onEdit,
    onDuplicate,
    onDelete,
    onSetStock,
    onSetHidden,
}) {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [category, setCategory] = useState('All');
    const [stock, setStock] = useState('All');
    const [visibility, setVisibility] = useState('All');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    const exportAll = async () => {
        setExporting(true);
        setError('');
        try {
            const { products } = await api.exportProducts();
            const date = new Date().toISOString().slice(0, 10);
            downloadTextFile(`sj-products-${date}.json`, buildExportFile(products));
        } catch (err) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };
    const requestId = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), 250);
        return () => clearTimeout(timer);
    }, [search]);

    const load = async (offset) => {
        const id = offset === 0 ? ++requestId.current : requestId.current;
        setLoading(true);
        setError('');
        try {
            const page = await api.listProducts(
                { q: debounced, category, stock, visibility, includeHidden: 1, limit: PAGE_SIZE, offset },
                { fresh: true }
            );
            if (id !== requestId.current) return;
            setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
            if (page.total !== undefined) setTotal(page.total);
            setNextOffset(page.nextOffset);
        } catch (err) {
            if (id === requestId.current) setError(err.message);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    };

    useEffect(() => {
        load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced, category, stock, visibility, refreshKey]);

    const changeStock = (product, next) => {
        // Show the new value straight away; the parent saves it and refreshes on failure.
        setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)));
        onSetStock(product, next);
    };

    const toggleHidden = (product) => {
        const next = !product.isHidden;
        setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, isHidden: next } : p)));
        onSetHidden(product, next);
    };

    const filtered = search || category !== 'All' || stock !== 'All' || visibility !== 'All';

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-xl font-bold text-ink">
                    Inventory ({items.length} of {total})
                </h3>
                <button
                    type="button"
                    onClick={exportAll}
                    disabled={exporting}
                    title="Download every product as a JSON file you can edit and import again"
                    className="ml-auto px-3 py-1.5 rounded-full bg-white text-stone-700 border border-stone-300 hover:border-stone-500 text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                >
                    {exporting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    Export all (JSON)
                </button>
                {filtered && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setCategory('All');
                            setStock('All');
                            setVisibility('All');
                        }}
                        className="text-xs font-semibold text-bronze-deep hover:underline cursor-pointer"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-cream p-3 rounded-2xl border border-stone-200">
                <div className="sm:col-span-12 relative">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, category or ID…"
                        aria-label="Search inventory"
                        className={`${inputClass} pl-9`}
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" aria-hidden="true" />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter by category"
                    className={`${inputClass} sm:col-span-4`}
                >
                    <option value="All">All categories</option>
                    {categoryNames.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <select
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    aria-label="Filter by stock"
                    className={`${inputClass} sm:col-span-4`}
                >
                    <option value="All">All stock</option>
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Sold out (0)</option>
                    <option value="hidden">Stock not shown</option>
                </select>
                <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    aria-label="Filter by website visibility"
                    className={`${inputClass} sm:col-span-4`}
                >
                    <option value="All">On site + hidden</option>
                    <option value="visible">On website</option>
                    <option value="hidden">Hidden from website</option>
                </select>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                </p>
            )}

            <ul className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((p) => {
                    const stockHidden = p.stock === null || p.stock === undefined;
                    return (
                        <li
                            key={p.id}
                            className={`flex flex-col gap-3 p-3.5 rounded-2xl border transition ${
                                editingId === p.id
                                    ? 'bg-amber-50 border-amber-400'
                                    : p.isHidden
                                        ? 'bg-stone-50 border-dashed border-stone-300'
                                        : 'bg-white border-stone-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={validateSafeImageUrl(p.image) || undefined}
                                    alt=""
                                    loading="lazy"
                                    className={`w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0 ${p.isHidden ? 'opacity-50' : ''}`}
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase text-bronze-deep truncate">
                                        {p.category}
                                        {p.subcategory ? ` · ${p.subcategory}` : ''}
                                    </p>
                                    <p className="text-sm font-bold text-ink truncate flex items-center gap-2">
                                        <span className="truncate">{p.name}</span>
                                        {p.isHidden && (
                                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                                                Hidden
                                            </span>
                                        )}
                                        {p.priceNeedsReview && (
                                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                                                Price to check
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        {formatGBP(p.price)} · assembly {formatGBP(p.assemblyFee)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => toggleHidden(p)}
                                    title={p.isHidden ? 'Show this product on the website' : 'Hide this product from the website'}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 ${
                                        p.isHidden
                                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                                            : 'bg-white text-stone-700 border-stone-300 hover:border-ink'
                                    }`}
                                >
                                    {p.isHidden ? (
                                        <Eye className="w-3 h-3" aria-hidden="true" />
                                    ) : (
                                        <EyeOff className="w-3 h-3" aria-hidden="true" />
                                    )}
                                    {p.isHidden ? 'Show on site' : 'Hide from site'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, stockHidden ? 5 : null)}
                                    title={stockHidden ? 'Start showing a stock count' : 'Stop showing the stock count'}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 ${
                                        stockHidden
                                            ? 'bg-stone-100 text-stone-600 border-stone-300'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                >
                                    <Package className="w-3 h-3" aria-hidden="true" />
                                    {stockHidden ? 'Stock count off' : 'Stock count on'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, Math.max(0, (Number(p.stock) || 0) - 1))}
                                    aria-label={`Decrease stock of ${p.name}`}
                                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center hover:border-bronze cursor-pointer"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <StockInput product={p} onCommit={(next) => changeStock(p, next)} />
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, (Number(p.stock) || 0) + 1)}
                                    aria-label={`Increase stock of ${p.name}`}
                                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center hover:border-bronze cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDuplicate(p)}
                                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                    <Copy className="w-3 h-3" aria-hidden="true" /> Copy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onEdit(p)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                    <Edit3 className="w-3 h-3" aria-hidden="true" /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(p)}
                                    aria-label={`Delete ${p.name}`}
                                    className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    );
                })}

                {!loading && items.length === 0 && !error && (
                    <li className="p-8 text-center text-sm text-stone-500 bg-white rounded-2xl border border-dashed border-stone-300">
                        {filtered ? 'No products match these filters.' : 'No products yet - add your first one.'}
                    </li>
                )}
            </ul>

            {loading && (
                <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
                </p>
            )}
            {!loading && nextOffset !== null && (
                <button
                    type="button"
                    onClick={() => load(nextOffset)}
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-bronze text-sm font-semibold text-stone-700 cursor-pointer"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
