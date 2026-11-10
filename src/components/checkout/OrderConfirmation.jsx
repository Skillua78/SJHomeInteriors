import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatGBP } from '../../../shared/pricing.js';

const NEXT_STEPS = {
    card: 'Your payment has been received.',
    klarna: 'Your Klarna payment has been approved.',
    cod: 'Please have payment ready for our delivery team (cash or card).',
    showroom: 'Your items are reserved. Please pay at our High Street, Maltby showroom.',
    bacs: 'Please send your bank transfer using your order reference so we can match your payment.',
};

/**
 * Final screen of the checkout. `order` is the server's record of the order,
 * so what is shown here is exactly what was charged.
 */
export default function OrderConfirmation({ order, onBackToShop, bankInstructions }) {
    const paidOnline = ['card', 'klarna'].includes(order.paymentMethod);
    const pending = paidOnline && order.paymentStatus === 'pending';
    const failed = paidOnline && ['failed', 'expired'].includes(order.paymentStatus);

    const Icon = failed ? XCircle : pending ? Clock : CheckCircle2;
    const tone = failed
        ? 'bg-red-100 text-red-700'
        : pending
            ? 'bg-amber-100 text-amber-800'
            : 'bg-emerald-100 text-emerald-800';

    const heading = failed
        ? 'Payment was not completed'
        : pending
            ? 'We are confirming your payment'
            : `Thank you, ${order.customerName.split(' ')[0]}`;

    return (
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-lg space-y-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${tone}`}>
                    <Icon className="w-9 h-9" aria-hidden="true" />
                </div>

                <div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18]">{heading}</h1>
                    <p className="text-sm text-stone-600 mt-3">
                        Order reference{' '}
                        <strong className="font-mono text-[#1C1B18] bg-stone-100 px-2 py-1 rounded">
                            {order.id}
                        </strong>
                    </p>
                </div>

                <p className="text-sm text-stone-700 leading-relaxed">
                    {failed &&
                        'No money has been taken. Your basket has been kept so you can try again or choose another way to pay.'}
                    {pending &&
                        'This usually takes a few moments. You can safely close this page - we will contact you as soon as it is confirmed.'}
                    {!failed && !pending && (
                        <>
                            {NEXT_STEPS[order.paymentMethod] || ''} Our Maltby showroom team will call you on{' '}
                            <strong>{order.phone}</strong> to{' '}
                            {order.deliveryMethod === 'delivery'
                                ? 'arrange your delivery slot.'
                                : 'arrange your collection.'}
                        </>
                    )}
                </p>

                {order.paymentMethod === 'bacs' && bankInstructions && (
                    <p className="text-sm text-left text-stone-700 whitespace-pre-line bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200">
                        {bankInstructions}
                    </p>
                )}

                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-sm space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between gap-4">
                            <span className="text-stone-700">
                                {item.qty} × {item.name}
                                {item.label && item.label !== 'Standard' && (
                                    <span className="block text-xs text-stone-500">{item.label}</span>
                                )}
                            </span>
                            <span className="font-semibold shrink-0">{formatGBP(item.lineTotal)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-stone-200 text-stone-700">
                        <span>
                            {order.deliveryMethod === 'delivery'
                                ? 'Delivery & assembly'
                                : 'Showroom collection'}
                        </span>
                        <span className="font-semibold">{formatGBP(order.delivery)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1C1B18] text-base">
                        <span>{failed ? 'Order total' : paidOnline && !pending ? 'Total paid' : 'Total'}</span>
                        <span>{formatGBP(order.total)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onBackToShop}
                    className="px-8 py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-sm font-semibold transition cursor-pointer"
                >
                    {failed ? 'Back to basket' : 'Continue shopping'}
                </button>
            </div>
        </div>
    );
}
