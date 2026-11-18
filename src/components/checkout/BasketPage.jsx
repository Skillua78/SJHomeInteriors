import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag, Info } from 'lucide-react';
import { api } from '../../utils/api';
import { assemblyOffer, cartTotals } from '../../utils/catalogModel';
import BasketLines from './BasketLines';
import OrderSummary from './OrderSummary';
import CheckoutForm from './CheckoutForm';
import MaintenanceNotice from './MaintenanceNotice';
import OrderConfirmation from './OrderConfirmation';
import {
    availableMethods,
    buildCheckoutRequest,
    isUkPostcode,
    validateCheckoutForm,
} from './checkoutModel';

const NO_QUOTE = { status: 'idle', postcode: '', delivery: 0, miles: null, checked: true };

export default function BasketPage({
    cart,
    onUpdateQty,
    onRemoveItem,
    onClearCart,
    onRepriceCart,
    onOrderPlaced,
    onBackToShop,
    onNavigate,
    onOpenLegal,
    siteSettings,
    currentUser,
    notice,
}) {
    const [deliveryMethod, setDeliveryMethod] = useState('delivery');
    const [form, setForm] = useState(() => ({
        fullName: currentUser?.role === 'customer' ? currentUser.name : '',
        email: currentUser?.role === 'customer' ? currentUser.email : '',
        phone: currentUser?.role === 'customer' ? currentUser.phone || '' : '',
        address: '',
        city: '',
        postcode: '',
        paymentMethod: '',
        assembly: false,
        agreedTerms: false,
    }));
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    // The delivery charge depends on how far the address is from the showroom; the server works it out.
    const [quote, setQuote] = useState(NO_QUOTE);

    const paymentEnabled = siteSettings?.paymentEnabled !== false;
    const methods = useMemo(
        () => availableMethods(siteSettings?.paymentOptions, deliveryMethod),
        [siteSettings?.paymentOptions, deliveryMethod]
    );

    // Keep a valid payment method selected as the available options change.
    useEffect(() => {
        if (!methods.some((m) => m.id === form.paymentMethod)) {
            setForm((prev) => ({ ...prev, paymentMethod: methods[0]?.id || '' }));
        }
    }, [methods, form.paymentMethod]);

    const postcode = form.postcode.trim().toUpperCase();
    const postcodeReady = deliveryMethod === 'delivery' && isUkPostcode(postcode);
    const basketKey = cart.map((item) => `${item.key}x${item.qty}`).join(',');

    // Ask the server for the delivery charge once a full postcode has been typed.
    useEffect(() => {
        if (!postcodeReady || cart.length === 0) {
            setQuote(NO_QUOTE);
            return undefined;
        }
        let cancelled = false;
        setQuote((prev) => ({ ...prev, status: 'loading', postcode }));
        const timer = setTimeout(async () => {
            try {
                const result = await api.quoteBasket({
                    deliveryMethod: 'delivery',
                    postcode,
                    items: cart.map((item) => ({
                        id: item.id,
                        qty: item.qty,
                        selections: item.selections,
                    })),
                });
                if (cancelled) return;
                onRepriceCart(result.lines);
                setQuote({
                    status: 'ok',
                    postcode,
                    delivery: result.delivery,
                    miles: result.distanceMiles,
                    checked: result.distanceChecked,
                });
            } catch (err) {
                if (!cancelled) {
                    setQuote({ ...NO_QUOTE, status: 'error', postcode, message: err.message });
                }
            }
        }, 450);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // basketKey stands in for the cart contents; re-pricing the cart must not re-trigger this.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postcode, postcodeReady, basketKey]);

    const assemblyPrice = assemblyOffer(cart);
    const wantsAssembly = deliveryMethod === 'delivery' && form.assembly && assemblyPrice > 0;
    const deliveryCharge = deliveryMethod === 'delivery' && quote.status === 'ok' ? quote.delivery : 0;

    const totals = useMemo(
        () => cartTotals(cart, { delivery: deliveryCharge, assembly: wantsAssembly }),
        [cart, deliveryCharge, wantsAssembly]
    );
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const setField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const problem = validateCheckoutForm(form, deliveryMethod);
        if (problem) {
            setError(problem);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const result = await api.checkout(
                buildCheckoutRequest(form, cart, deliveryMethod, totals.totalPence)
            );
            if (result.redirectUrl) {
                // Card / Klarna: hand over to Stripe's hosted payment page. The basket is
                // kept until payment succeeds so a cancelled payment loses nothing.
                window.location.assign(result.redirectUrl);
                return;
            }
            setConfirmedOrder(result.order);
            onClearCart();
            onOrderPlaced?.();
            window.scrollTo({ top: 0 });
        } catch (err) {
            const fresh = err.code === 'PRICE_CHANGED' ? err.data?.quote : null;
            if (fresh) {
                // Show the server's figures (item prices, delivery for this postcode) before charging.
                onRepriceCart(fresh.lines);
                setQuote({
                    status: 'ok',
                    postcode,
                    delivery: fresh.delivery,
                    miles: fresh.distanceMiles,
                    checked: fresh.distanceChecked,
                });
            }
            setError({ field: null, message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    if (confirmedOrder) {
        return (
            <OrderConfirmation
                order={confirmedOrder}
                onBackToShop={onBackToShop}
                bankInstructions={siteSettings?.bankTransferInstructions}
            />
        );
    }

    const deliveryInfo = {
        freeMiles: Number(siteSettings?.freeDeliveryMiles ?? 10),
        charge: Number(siteSettings?.defaultDeliveryFee ?? 50),
        quote,
        postcodeReady,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <button
                type="button"
                onClick={onBackToShop}
                className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-bronze-deep mb-5 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Continue shopping
            </button>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-6">
                Basket &amp; checkout
            </h1>

            {notice && (
                <div
                    role="status"
                    className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-950 flex items-start gap-2.5"
                >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{notice}</span>
                </div>
            )}

            {cart.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-stone-200 space-y-4">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" aria-hidden="true" />
                    <p className="text-base text-stone-600">Your basket is empty.</p>
                    <button
                        type="button"
                        onClick={onBackToShop}
                        className="px-7 py-3 rounded-full bg-ink hover:bg-bronze-strong text-white text-sm font-semibold cursor-pointer transition"
                    >
                        Browse furniture
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    <div className="lg:col-span-7 space-y-6">
                        <BasketLines cart={cart} onUpdateQty={onUpdateQty} onRemoveItem={onRemoveItem} />

                        {paymentEnabled ? (
                            <CheckoutForm
                                form={form}
                                setField={setField}
                                deliveryMethod={deliveryMethod}
                                onDeliveryMethodChange={setDeliveryMethod}
                                deliveryInfo={deliveryInfo}
                                assemblyPrice={assemblyPrice}
                                methods={methods}
                                totals={totals}
                                error={error}
                                submitting={submitting}
                                onSubmit={handleSubmit}
                                onOpenLegal={onOpenLegal}
                                bankInstructions={siteSettings?.bankTransferInstructions}
                            />
                        ) : (
                            <MaintenanceNotice siteSettings={siteSettings} onNavigate={onNavigate} />
                        )}
                    </div>

                    <div className="lg:col-span-5 lg:sticky lg:top-32">
                        <OrderSummary
                            totals={totals}
                            deliveryMethod={deliveryMethod}
                            deliveryInfo={deliveryInfo}
                            assemblyAdded={wantsAssembly}
                            itemCount={itemCount}
                            paymentOptions={siteSettings?.paymentOptions}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
