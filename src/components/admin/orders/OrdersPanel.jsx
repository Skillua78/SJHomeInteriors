import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../../utils/api';
import { formatGBP } from '../../../../shared/pricing.js';
import { inputClass, sectionTitleClass } from '../adminUi';

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
export default function OrdersPanel() {
    const [status, setStatus] = useState('All');
    const [orders, setOrders] = useState([]);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (offset) => {
        setLoading(true);
        setError('');
        try {
            const page = await api.listOrders({ status, limit: 25, offset });
            setOrders((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
            setNextOffset(page.nextOffset);
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

    return (
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
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
                        onClick={() => load(0)}
                        aria-label="Refresh orders"
                        className="p-2.5 rounded-xl border border-stone-300 hover:border-[#9A7B56] cursor-pointer"
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

            {!loading && orders.length === 0 && !error && (
                <p className="p-8 text-center text-sm text-stone-500 bg-[#FAF8F5] rounded-2xl border border-dashed border-stone-300">
                    No orders here yet.
                </p>
            )}

            {orders.map((order) => (
                <article key={order.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <strong className="font-mono text-sm text-[#1C1B18]">{order.id}</strong>
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
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="text-stone-700">
                            <p className="font-semibold text-[#1C1B18]">{order.customerName}</p>
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
                                <span>Delivery &amp; assembly</span>
                                <span>{formatGBP(order.delivery)}</span>
                            </li>
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
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-[#9A7B56] text-sm font-semibold cursor-pointer"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
