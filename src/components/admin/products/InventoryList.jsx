import { useEffect, useRef, useState } from 'react';
import { Search, Copy, Edit3, Trash2, Plus, Minus, EyeOff, Loader2 } from 'lucide-react';
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
}) {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [category, setCategory] = useState('All');
    const [stock, setStock] = useState('All');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
                { q: debounced, category, stock, limit: PAGE_SIZE, offset },
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
    }, [debounced, category, stock, refreshKey]);

    const changeStock = (product, next) => {
        // Show the new value straight away; the parent saves it and refreshes on failure.
        setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)));
        onSetStock(product, next);
    };

    const filtered = search || category !== 'All' || stock !== 'All';

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                    Inventory ({items.length} of {total})
                </h3>
                {filtered && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setCategory('All');
                            setStock('All');
                        }}
                        className="text-xs font-semibold text-[#7D6242] hover:underline cursor-pointer"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
                <div className="sm:col-span-6 relative">
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
                    className={`${inputClass} sm:col-span-3`}
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
                    className={`${inputClass} sm:col-span-3`}
                >
                    <option value="All">All stock</option>
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Sold out (0)</option>
                    <option value="hidden">Stock not shown</option>
                </select>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                </p>
            )}

            <ul className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((p) => {
                    const hidden = p.stock === null || p.stock === undefined;
                    return (
                        <li
                            key={p.id}
                            className={`flex flex-col gap-3 p-3.5 rounded-2xl border transition ${
                                editingId === p.id ? 'bg-amber-50 border-amber-400' : 'bg-white border-stone-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={validateSafeImageUrl(p.image) || undefined}
                                    alt=""
                                    loading="lazy"
                                    className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase text-[#9A7B56] truncate">
                                        {p.category}
                                        {p.subcategory ? ` · ${p.subcategory}` : ''}
                                    </p>
                                    <p className="text-sm font-bold text-[#1C1B18] truncate">{p.name}</p>
                                    <p className="text-xs text-stone-500">
                                        {formatGBP(p.price)} · delivery {formatGBP(p.deliveryFee)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, hidden ? 5 : null)}
                                    title={hidden ? 'Start showing a stock count' : 'Stop showing stock'}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer ${
                                        hidden
                                            ? 'bg-stone-100 text-stone-600 border-stone-300'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                >
                                    <EyeOff className="w-3 h-3" aria-hidden="true" />
                                    {hidden ? 'Not shown' : 'Shown'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, Math.max(0, (Number(p.stock) || 0) - 1))}
                                    aria-label={`Decrease stock of ${p.name}`}
                                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <StockInput product={p} onCommit={(next) => changeStock(p, next)} />
                                <button
                                    type="button"
                                    onClick={() => changeStock(p, (Number(p.stock) || 0) + 1)}
                                    aria-label={`Increase stock of ${p.name}`}
                                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
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
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-[#9A7B56] text-sm font-semibold text-stone-700 cursor-pointer"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
