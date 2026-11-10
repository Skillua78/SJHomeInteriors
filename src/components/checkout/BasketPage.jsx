import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShoppingBag, Info } from 'lucide-react';
import { api } from '../../utils/api';
import { cartTotals } from '../../utils/catalogModel';
import BasketLines from './BasketLines';
import OrderSummary from './OrderSummary';
import CheckoutForm from './CheckoutForm';
import MaintenanceNotice from './MaintenanceNotice';
import OrderConfirmation from './OrderConfirmation';
import { availableMethods, buildCheckoutRequest, validateCheckoutForm } from './checkoutModel';

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
        agreedTerms: false,
    }));
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);

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

    const totals = useMemo(() => {
        const current = cartTotals(cart, deliveryMethod);
        return { ...current, deliveryIfChosen: cartTotals(cart, 'delivery').delivery };
    }, [cart, deliveryMethod]);
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
            if (err.code === 'PRICE_CHANGED' && err.data?.quote) {
                onRepriceCart(err.data.quote.lines);
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <button
                type="button"
                onClick={onBackToShop}
                className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#9A7B56] mb-5 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Continue shopping
            </button>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18] mb-6">
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
                        className="px-7 py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-sm font-semibold cursor-pointer transition"
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

                    <div className="lg:col-span-5">
                        <OrderSummary
                            totals={totals}
                            deliveryMethod={deliveryMethod}
                            itemCount={itemCount}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
