import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import OrderConfirmation from './OrderConfirmation';

const MAX_POLLS = 8;
const POLL_DELAY_MS = 2500;

/**
 * Landing page after Stripe Checkout. Asks the server for the real payment
 * status (never trusts the URL) and polls briefly while a payment such as
 * Klarna is still being confirmed.
 */
export default function OrderStatusPage({ sessionId, onPaid, onBackToShop, onBackToBasket }) {
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const notified = useRef(false);

    useEffect(() => {
        let cancelled = false;
        let timer;
        let attempts = 0;

        const check = async () => {
            attempts += 1;
            try {
                const { order: latest } = await api.getCheckoutStatus(sessionId);
                if (cancelled) return;
                setOrder(latest);

                if (latest.paymentStatus === 'paid' && !notified.current) {
                    notified.current = true;
                    onPaid?.();
                }
                if (latest.paymentStatus === 'pending' && attempts < MAX_POLLS) {
                    timer = setTimeout(check, POLL_DELAY_MS);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        };

        check();
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [sessionId, onPaid]);

    if (error) {
        return (
            <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-red-600 mx-auto" aria-hidden="true" />
                <h1 className="font-serif text-3xl font-bold">We could not load your order</h1>
                <p className="text-sm text-stone-600">
                    {error} If you completed payment, your order is safe - please contact the showroom
                    and we will confirm it for you.
                </p>
                <button
                    type="button"
                    onClick={onBackToShop}
                    className="px-7 py-3 rounded-full bg-[#1C1B18] text-white text-sm font-semibold cursor-pointer"
                >
                    Back to the shop
                </button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center text-stone-600" role="status">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#9A7B56]" aria-hidden="true" />
                Confirming your payment…
            </div>
        );
    }

    const failed = ['failed', 'expired'].includes(order.paymentStatus);
    return <OrderConfirmation order={order} onBackToShop={failed ? onBackToBasket : onBackToShop} />;
}
