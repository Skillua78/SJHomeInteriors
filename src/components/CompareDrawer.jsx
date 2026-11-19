import { useEffect, useState } from 'react';
import { X, Scale, Loader2 } from 'lucide-react';
import { fetchProductDetail } from '../hooks/useCatalog';
import { useDialog, useTransitionState } from '../hooks/useDialog';
import { validateSafeImageUrl } from '../utils/security';
import { formatGBP } from '../../shared/pricing.js';
import StarRating from './ui/StarRating';
import { MAX_COMPARE } from '../utils/storefront';

function dimensionsText(product) {
    const d = product.variations?.structuredDimensions?.default || {};
    const parts = [
        d.length ? `L ${d.length}` : '',
        d.width ? `W ${d.width}` : '',
        d.depth ? `D/H ${d.depth}` : '',
    ].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    return (product.dimensions || []).join(' · ') || product.dimSummary || '—';
}

const listOrDash = (values) => (values && values.length ? values.join(', ') : '—');

/**
 * Comparison: a bar along the bottom while products are picked, and a
 * side-by-side table when opened.
 */
export default function CompareDrawer({ items, onRemove, onClear, onView, message, onDismissMessage }) {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState({});
    const { mounted, state } = useTransitionState(open, 300);
    const panelRef = useDialog(open, () => setOpen(false));

    useEffect(() => {
        if (items.length < 2) setOpen(false);
    }, [items.length]);

    // Load the full record (dimensions, fabrics, features) for each product once opened.
    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        items.forEach((item) => {
            if (details[item.id]) return;
            fetchProductDetail(item.id)
                .then((full) => !cancelled && full && setDetails((prev) => ({ ...prev, [item.id]: full })))
                .catch(() => {});
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, items]);

    if (items.length === 0 && !mounted) {
        return message ? (
            <p role="status" className="sr-only">
                {message}
            </p>
        ) : null;
    }

    const rows = [
        {
            label: 'Price',
            render: (p) => (
                <span>
                    <span className="text-lg font-bold text-ink tabular-nums">{formatGBP(p.price)}</span>
                    {p.previousPrice > p.price && (
                        <span className="block text-xs text-stone-500 line-through tabular-nums">
                            {formatGBP(p.previousPrice)}
                        </span>
                    )}
                </span>
            ),
        },
        { label: 'Rating', render: (p) => (p.rating ? <StarRating value={p.rating.average} count={p.rating.count} /> : '—') },
        { label: 'Category', render: (p) => [p.category, p.subcategory].filter(Boolean).join(' · ') },
        { label: 'Colours', render: (p) => listOrDash(p.colors) },
        { label: 'Fabrics', render: (p) => listOrDash(p.variations?.fabrics) },
        { label: 'Sizes', render: (p) => listOrDash(p.variations?.sizes) },
        { label: 'Dimensions', render: (p) => dimensionsText(p) },
        {
            label: 'Key features',
            render: (p) =>
                p.features?.length ? (
                    <ul className="list-disc pl-4 space-y-0.5">
                        {p.features.slice(0, 6).map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                ) : (
                    '—'
                ),
        },
    ];

    return (
        <>
            {items.length > 0 && !open && (
                <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
                    <div className="pointer-events-auto max-w-3xl mx-auto bg-ink text-white rounded-2xl shadow-2xl shadow-black/30 p-2.5 pl-3 flex items-center gap-3">
                        <ul className="flex -space-x-2 shrink-0" aria-label="Products to compare">
                            {items.map((p) => (
                                <li key={p.id} className="relative">
                                    <img
                                        src={validateSafeImageUrl(p.image) || undefined}
                                        alt={p.name}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border-2 border-ink bg-stone-700"
                                    />
                                </li>
                            ))}
                        </ul>
                        <p className="flex-1 min-w-0 text-sm leading-snug" role="status">
                            <span className="block font-semibold whitespace-nowrap">
                                {items.length} of {MAX_COMPARE} picked
                            </span>
                            <span className={`${message ? 'block' : 'hidden sm:block'} text-xs text-stone-300 sm:truncate`}>
                                {message || (items.length < 2 ? 'Pick one more' : 'Ready to compare')}
                            </span>
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                onClear();
                                onDismissMessage?.();
                            }}
                            className="min-h-11 px-2.5 sm:px-3 rounded-xl text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/10"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            disabled={items.length < 2}
                            className="press min-h-11 px-3 sm:px-4 rounded-xl bg-gold hover:bg-white disabled:bg-white/20 disabled:text-white/60 text-ink text-sm font-bold flex items-center gap-1.5"
                        >
                            <Scale className="w-4 h-4" aria-hidden="true" /> Compare
                        </button>
                    </div>
                </div>
            )}

            {mounted && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        data-state={state}
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                        className="overlay-fade absolute inset-0 bg-ink/70 backdrop-blur-xs"
                    />
                    <div
                        ref={panelRef}
                        data-dialog-panel
                        data-state={state}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="compare-title"
                        tabIndex={-1}
                        className="dialog-pop relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-6xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl outline-none"
                    >
                        <div className="flex items-center justify-between pl-5 pr-3 py-3 border-b border-stone-200">
                            <h2 id="compare-title" className="font-serif text-2xl font-bold">
                                Compare {items.length} items
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close comparison"
                                className="w-11 h-11 rounded-full hover:bg-stone-100 flex items-center justify-center"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="overflow-auto overscroll-contain">
                            <table className="w-full min-w-[640px] text-sm border-collapse">
                                <caption className="sr-only">Side-by-side product comparison</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className="sticky left-0 bg-white w-24 sm:w-32 p-3" />
                                        {items.map((p) => (
                                            <th key={p.id} scope="col" className="p-3 align-top text-left font-normal">
                                                <div className="relative">
                                                    <img
                                                        src={validateSafeImageUrl(p.image) || undefined}
                                                        alt=""
                                                        className="w-full aspect-[4/3] object-cover rounded-xl bg-linen"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemove(p.id)}
                                                        aria-label={`Remove ${p.name} from comparison`}
                                                        className="absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-white/95 text-ink shadow flex items-center justify-center"
                                                    >
                                                        <X className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                                <p className="font-serif text-lg font-bold text-ink leading-tight mt-2">{p.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        onView(p);
                                                    }}
                                                    className="mt-2 min-h-10 px-4 rounded-full bg-ink hover:bg-bronze-strong text-white text-xs font-semibold"
                                                >
                                                    View & buy
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.label} className="border-t border-stone-200">
                                            <th
                                                scope="row"
                                                className="sticky left-0 bg-cream p-2.5 sm:p-3 text-left text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-600 align-top"
                                            >
                                                {row.label}
                                            </th>
                                            {items.map((p) => {
                                                const full = details[p.id];
                                                return (
                                                    <td key={p.id} className="p-3 align-top text-stone-700">
                                                        {full || ['Price', 'Rating', 'Category', 'Colours'].includes(row.label) ? (
                                                            row.render({ ...p, ...(full || {}), rating: p.rating })
                                                        ) : (
                                                            <Loader2 className="w-4 h-4 animate-spin text-stone-400" aria-label="Loading" />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
