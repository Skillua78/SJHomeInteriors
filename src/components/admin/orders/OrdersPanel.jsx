import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../../../utils/api';
import { formatGBP } from '../../../../shared/pricing.js';
import { inputClass, sectionTitleClass } from '../adminUi';
import SalesSummary from './SalesSummary';

const STATUS_LABELS = {
    AWAITING_PAYMENT: 'Awaiting payment',
    PENDING_DISPATCH: 'To dispatch',
    DISPATCHED: 'Dispatched',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

const PAYMENT_LABELS = {
    card: 'Card',
    klarna: 'Klarna',
    cod: 'Pay on delivery',
    showroom: 'Pay in showroom',
    bacs: 'Bank transfer',
};

const PAYMENT_TONE = {
    paid: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    unpaid: 'bg-stone-200 text-stone-700',
    failed: 'bg-red-100 text-red-800',
    expired: 'bg-red-100 text-red-800',
};

/** Orders placed through the checkout, newest first. */
export default function OrdersPanel({ onSeen }) {
    const [status, setStatus] = useState('All');
    const [orders, setOrders] = useState([]);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [confirming, setConfirming] = useState(null); // { id, restock }
    const [deleting, setDeleting] = useState(false);
    const [summaryKey, setSummaryKey] = useState(0);

    const load = async (offset) => {
        setLoading(true);
        setError('');
        try {
            const page = await api.listOrders({ status, limit: 25, offset });
            setOrders((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
            setNextOffset(page.nextOffset);
            // Having been shown, new orders stop counting towards the notification tally
            // (they keep their "New" badge on screen until the list is next refreshed).
            if (page.items.some((o) => o.isNew)) {
                await api.markOrdersSeen();
                onSeen?.();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const changeStatus = async (order, next) => {
        const previous = order.status;
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
        try {
            await api.updateOrderStatus(order.id, next);
        } catch (err) {
            setError(err.message);
            setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: previous } : o)));
        }
    };

    // Items can go back into stock if this order took them and has not left the showroom.
    const canRestock = (order) => order.stockCommitted && !['DISPATCHED', 'COMPLETED'].includes(order.status);

    const startDelete = (order) => {
        setNotice('');
        setConfirming({ id: order.id, restock: canRestock(order) });
    };

    const confirmDelete = async (order) => {
        setDeleting(true);
        setError('');
        try {
            const result = await api.deleteOrder(order.id, confirming.restock && canRestock(order));
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            setNotice(
                `Order ${order.id} deleted${result.restocked ? `; ${result.restocked} item(s) put back into stock` : ''}.`
            );
            setConfirming(null);
            setSummaryKey((k) => k + 1);
            onSeen?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
            <SalesSummary refreshKey={summaryKey} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={sectionTitleClass}>Orders</h3>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Filter orders by status"
                        className={`${inputClass} w-auto`}
                    >
                        <option value="All">All orders</option>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => {
                            load(0);
                            setSummaryKey((k) => k + 1);
                        }}
                        aria-label="Refresh orders"
                        className="p-2.5 rounded-xl border border-stone-300 hover:border-bronze cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                </p>
            )}

            {notice && (
                <p role="status" className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    {notice}
                </p>
            )}

            {!loading && orders.length === 0 && !error && (
                <p className="p-8 text-center text-sm text-stone-500 bg-cream rounded-2xl border border-dashed border-stone-300">
                    No orders here yet.
                </p>
            )}

            {orders.map((order) => (
                <article key={order.id} className="p-4 rounded-2xl bg-cream border border-stone-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {order.isNew && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-ink text-[10px] font-bold uppercase">
                                    New
                                </span>
                            )}
                            <strong className="font-mono text-sm text-ink">{order.id}</strong>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    PAYMENT_TONE[order.paymentStatus] || PAYMENT_TONE.unpaid
                                }`}
                            >
                                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} ·{' '}
                                {order.paymentStatus}
                            </span>
                            <span className="text-xs text-stone-500">{order.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <strong className="text-base">{formatGBP(order.total)}</strong>
                            <select
                                value={order.status}
                                onChange={(e) => changeStatus(order, e.target.value)}
                                aria-label={`Status of order ${order.id}`}
                                className={`${inputClass} w-auto py-1.5`}
                            >
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => startDelete(order)}
                                aria-label={`Delete order ${order.id}`}
                                title="Delete order"
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-700 hover:bg-red-50 transition"
                            >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {confirming?.id === order.id && (
                        <div role="alertdialog" aria-label={`Delete order ${order.id}?`} className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2.5 text-sm">
                            <p className="font-semibold text-red-900">
                                Delete order {order.id} permanently? This cannot be undone.
                            </p>
                            {order.paymentStatus === 'paid' && ['card', 'klarna'].includes(order.paymentMethod) && (
                                <p className="text-red-900">
                                    This order was paid online. Deleting it does not refund the customer —
                                    issue any refund in your Stripe dashboard first.
                                </p>
                            )}
                            <p className="text-red-900/80 text-xs">
                                Tip: setting the status to “Cancelled” keeps the record for your accounts
                                instead of deleting it.
                            </p>
                            {canRestock(order) && (
                                <label className="flex items-center gap-2 text-red-900">
                                    <input
                                        type="checkbox"
                                        checked={confirming.restock}
                                        onChange={(e) => setConfirming({ ...confirming, restock: e.target.checked })}
                                        className="w-4 h-4 accent-red-700"
                                    />
                                    Put these items back into stock
                                </label>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => confirmDelete(order)}
                                    disabled={deleting}
                                    className="press min-h-10 px-4 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-stone-400 text-white text-xs font-bold flex items-center gap-1.5"
                                >
                                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                                    Delete order
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(null)}
                                    className="min-h-10 px-4 rounded-xl bg-white border border-stone-300 text-ink text-xs font-semibold"
                                >
                                    Keep order
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="text-stone-700">
                            <p className="font-semibold text-ink">{order.customerName}</p>
                            <p>
                                <a href={`tel:${order.phone.replace(/\s+/g, '')}`} className="underline">
                                    {order.phone}
                                </a>{' '}
                                ·{' '}
                                <a href={`mailto:${order.email}`} className="underline break-all">
                                    {order.email}
                                </a>
                            </p>
                            <p className="text-stone-600">
                                {order.deliveryMethod === 'delivery' ? 'Deliver to: ' : 'Collection: '}
                                {order.address}
                            </p>
                        </div>
                        <ul className="space-y-1 text-stone-700">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between gap-3">
                                    <span>
                                        {item.qty} × {item.name}
                                        {item.label && item.label !== 'Standard' && (
                                            <span className="block text-xs text-stone-500">{item.label}</span>
                                        )}
                                    </span>
                                    <span className="shrink-0">{formatGBP(item.lineTotal)}</span>
                                </li>
                            ))}
                            <li className="flex justify-between gap-3 text-stone-500">
                                <span>
                                    {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}
                                    {order.distanceMiles !== null && order.distanceMiles !== undefined
                                        ? ` (${order.distanceMiles} miles)`
                                        : order.deliveryMethod === 'delivery'
                                            ? ' (distance not checked)'
                                            : ''}
                                </span>
                                <span>{order.delivery > 0 ? formatGBP(order.delivery) : 'Free'}</span>
                            </li>
                            {order.assembly > 0 && (
                                <li className="flex justify-between gap-3 font-semibold text-ink">
                                    <span>Assembly requested</span>
                                    <span>{formatGBP(order.assembly)}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </article>
            ))}

            {loading && (
                <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading orders…
                </p>
            )}
            {!loading && nextOffset !== null && (
                <button
                    type="button"
                    onClick={() => load(nextOffset)}
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-bronze text-sm font-semibold cursor-pointer"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
