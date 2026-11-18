import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../../utils/api';
import { formatGBP } from '../../../../shared/pricing.js';

const PERIODS = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 90, label: '90 days' },
    { days: 365, label: '12 months' },
    { days: 0, label: 'All time' },
];

/**
 * Sales history: totals and best sellers. Counts orders that were placed or paid
 * and not cancelled; orders still waiting for card/Klarna payment are left out.
 * @param refreshKey change to reload (e.g. after an order is deleted)
 */
export default function SalesSummary({ refreshKey }) {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setError('');
        api.getSalesSummary(days)
            .then((result) => !cancelled && setData(result))
            .catch((err) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, [days, refreshKey]);

    const stats = data
        ? [
              { label: 'Orders', value: data.orders.toLocaleString('en-GB') },
              { label: 'Order value', value: formatGBP(data.revenue), hint: 'incl. delivery & assembly' },
              { label: 'Items sold', value: data.itemsSold.toLocaleString('en-GB') },
              { label: 'Average order', value: formatGBP(data.averageOrder) },
          ]
        : [];

    return (
        <section aria-labelledby="sales-summary-title" className="p-4 rounded-2xl bg-white border border-stone-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 id="sales-summary-title" className="font-sans text-sm font-bold text-ink">
                    Sales history
                </h4>
                <div role="group" aria-label="Period" className="flex flex-wrap gap-1 bg-cream p-1 rounded-xl border border-stone-200">
                    {PERIODS.map((p) => (
                        <button
                            key={p.days}
                            type="button"
                            aria-pressed={days === p.days}
                            onClick={() => setDays(p.days)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                days === p.days ? 'bg-ink text-white' : 'text-stone-700 hover:bg-white'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                </p>
            )}

            {!data && !error && (
                <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading sales…
                </p>
            )}

            {data && (
                <>
                    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {stats.map((s) => (
                            <div key={s.label} className="p-3 rounded-xl bg-cream border border-stone-200">
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{s.label}</dt>
                                <dd className="text-xl font-bold text-ink tabular-nums mt-0.5">{s.value}</dd>
                                {s.hint && <dd className="text-[11px] text-stone-500">{s.hint}</dd>}
                            </div>
                        ))}
                    </dl>

                    {data.topProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <caption className="text-left text-xs font-bold uppercase tracking-wider text-stone-500 pb-2">
                                    Best sellers
                                </caption>
                                <thead>
                                    <tr className="text-left text-xs text-stone-500 border-b border-stone-200">
                                        <th scope="col" className="py-2 pr-3 font-semibold">Product</th>
                                        <th scope="col" className="py-2 px-3 font-semibold text-right">Sold</th>
                                        <th scope="col" className="py-2 pl-3 font-semibold text-right">Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topProducts.map((p) => (
                                        <tr key={p.id} className="border-b border-stone-100 last:border-0">
                                            <td className="py-2 pr-3 text-ink">{p.name}</td>
                                            <td className="py-2 px-3 text-right tabular-nums">{p.qty}</td>
                                            <td className="py-2 pl-3 text-right tabular-nums font-semibold">
                                                {formatGBP(p.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-stone-500">No sales in this period.</p>
                    )}
                </>
            )}
        </section>
    );
}
