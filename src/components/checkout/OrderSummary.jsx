import { Lock, Truck, RotateCcw } from 'lucide-react';
import { formatGBP } from '../../../shared/pricing.js';

/** What the delivery line should say, given what we know about the address so far. */
export function deliveryLine(deliveryMethod, info) {
    if (deliveryMethod !== 'delivery') return { label: 'Showroom collection', value: 'Free' };
    const { quote, postcodeReady, freeMiles, charge } = info;

    if (!postcodeReady) {
        return {
            label: 'Home delivery',
            value: 'Enter postcode',
            note: `Free within ${freeMiles} miles of our Maltby showroom, ${formatGBP(charge)} beyond.`,
        };
    }
    if (quote.status === 'loading') return { label: 'Home delivery', value: 'Checking…' };
    if (quote.status === 'error') {
        return { label: 'Home delivery', value: '—', note: quote.message, problem: true };
    }
    if (!quote.checked) {
        return {
            label: 'Home delivery',
            value: 'Free',
            note: 'We could not measure the distance just now, so we will confirm delivery with you by phone.',
        };
    }
    const distance = quote.miles !== null ? `${quote.miles} miles from our showroom` : '';
    return quote.delivery > 0
        ? { label: 'Home delivery', value: formatGBP(quote.delivery), note: distance }
        : { label: 'Home delivery', value: 'Free', note: distance ? `${distance} - free local delivery` : '' };
}

/** Price breakdown: items, delivery, optional assembly, total. */
export default function OrderSummary({ totals, deliveryMethod, deliveryInfo, assemblyAdded, itemCount, children }) {
    const delivery = deliveryLine(deliveryMethod, deliveryInfo);

    return (
        <aside className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B18]">Order summary</h2>

            <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                    <dt className="text-stone-600">Items ({itemCount})</dt>
                    <dd className="font-semibold">{formatGBP(totals.subtotal)}</dd>
                </div>
                <div>
                    <div className="flex justify-between">
                        <dt className="text-stone-600">{delivery.label}</dt>
                        <dd className="font-semibold">{delivery.value}</dd>
                    </div>
                    {delivery.note && (
                        <p className={`text-xs mt-0.5 ${delivery.problem ? 'text-red-700' : 'text-stone-500'}`}>
                            {delivery.note}
                        </p>
                    )}
                </div>
                {assemblyAdded && (
                    <div className="flex justify-between">
                        <dt className="text-stone-600">Assembly service</dt>
                        <dd className="font-semibold">{formatGBP(totals.assembly)}</dd>
                    </div>
                )}
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
                    Free delivery within {deliveryInfo.freeMiles} miles of our Maltby showroom
                </li>
                <li className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" aria-hidden="true" />
                    14-day returns on online orders
                </li>
            </ul>
        </aside>
    );
}
