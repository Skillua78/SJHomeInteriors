import { Lock, Truck, RotateCcw } from 'lucide-react';
import { formatGBP } from '../../../shared/pricing.js';

/** Price breakdown: items, delivery & assembly, total. */
export default function OrderSummary({ totals, deliveryMethod, itemCount, children }) {
    const isDelivery = deliveryMethod === 'delivery';

    return (
        <aside className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5 lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B18]">Order summary</h2>

            <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                    <dt className="text-stone-600">
                        Items ({itemCount})
                    </dt>
                    <dd className="font-semibold">{formatGBP(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-stone-600">
                        {isDelivery ? 'Two-person delivery & assembly' : 'Showroom collection'}
                    </dt>
                    <dd className="font-semibold">
                        {isDelivery ? formatGBP(totals.delivery) : formatGBP(0)}
                    </dd>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-stone-200">
                    <dt className="font-semibold text-[#1C1B18]">Total to pay</dt>
                    <dd className="text-2xl font-bold text-[#1C1B18]">{formatGBP(totals.total)}</dd>
                </div>
            </dl>
            {children}

            <ul className="pt-4 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" aria-hidden="true" />
                    Card and Klarna payments are processed securely by Stripe
                </li>
                <li className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" aria-hidden="true" />
                    Two-person delivery and assembly in your room of choice
                </li>
                <li className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" aria-hidden="true" />
                    14-day returns on online orders
                </li>
            </ul>
        </aside>
    );
}
