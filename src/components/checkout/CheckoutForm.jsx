import { Truck, Store, Loader2, Lock, AlertCircle } from 'lucide-react';
import Field from '../ui/Field';
import PaymentMethodPicker from './PaymentMethodPicker';
import { PAYMENT_METHODS } from './checkoutModel';
import { formatGBP } from '../../../shared/pricing.js';

function StepHeading({ number, children }) {
    return (
        <h2 className="flex items-center gap-2.5 font-sans text-base font-bold text-[#1C1B18]">
            <span className="w-6 h-6 rounded-full bg-[#1C1B18] text-white text-xs font-bold flex items-center justify-center">
                {number}
            </span>
            {children}
        </h2>
    );
}

export default function CheckoutForm({
    form,
    setField,
    deliveryMethod,
    onDeliveryMethodChange,
    methods,
    totals,
    error,
    submitting,
    onSubmit,
    onOpenLegal,
    bankInstructions,
}) {
    const chosen = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod);
    const submitLabel = chosen?.online
        ? `Continue to secure payment · ${formatGBP(totals.total)}`
        : `Place order · ${formatGBP(totals.total)}`;

    const deliveryChoices = [
        {
            id: 'delivery',
            icon: Truck,
            title: 'Home delivery & assembly',
            detail: totals.deliveryIfChosen > 0 ? formatGBP(totals.deliveryIfChosen) : 'No charge',
        },
        { id: 'collection', icon: Store, title: 'Collect from Maltby showroom', detail: 'No charge' },
    ];

    return (
        <form
            onSubmit={onSubmit}
            noValidate
            className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200 space-y-7"
        >
            <section className="space-y-3">
                <StepHeading number={1}>Delivery or collection</StepHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {deliveryChoices.map((choice) => {
                        const Icon = choice.icon;
                        const selected = deliveryMethod === choice.id;
                        return (
                            <button
                                key={choice.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onDeliveryMethodChange(choice.id)}
                                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                                    selected
                                        ? 'border-[#1C1B18] bg-[#FAF8F5] ring-1 ring-[#1C1B18]'
                                        : 'border-stone-300 bg-white hover:border-[#9A7B56]'
                                }`}
                            >
                                <Icon className="w-5 h-5 text-[#9A7B56] shrink-0 mt-0.5" aria-hidden="true" />
                                <span>
                                    <span className="block text-sm font-semibold text-[#1C1B18]">
                                        {choice.title}
                                    </span>
                                    <span className="block text-xs text-stone-600 mt-0.5">
                                        {choice.detail}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-3">
                <StepHeading number={2}>Your details</StepHeading>
                <Field
                    id="co-name"
                    label="Full name"
                    autoComplete="name"
                    required
                    value={form.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    error={error?.field === 'fullName'}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                        id="co-email"
                        label="Email address"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        error={error?.field === 'email'}
                        hint="For your order confirmation"
                    />
                    <Field
                        id="co-phone"
                        label="Mobile number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        error={error?.field === 'phone'}
                        hint="So we can arrange your delivery slot"
                    />
                </div>

                {deliveryMethod === 'delivery' && (
                    <>
                        <Field
                            id="co-address"
                            label="Street address"
                            autoComplete="street-address"
                            required
                            value={form.address}
                            onChange={(e) => setField('address', e.target.value)}
                            error={error?.field === 'address'}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Field
                                id="co-city"
                                label="Town / city"
                                autoComplete="address-level2"
                                required
                                value={form.city}
                                onChange={(e) => setField('city', e.target.value)}
                                error={error?.field === 'city'}
                            />
                            <Field
                                id="co-postcode"
                                label="Postcode"
                                autoComplete="postal-code"
                                autoCapitalize="characters"
                                required
                                value={form.postcode}
                                onChange={(e) => setField('postcode', e.target.value)}
                                error={error?.field === 'postcode'}
                            />
                        </div>
                    </>
                )}
            </section>

            <section className="space-y-3">
                <StepHeading number={3}>Payment</StepHeading>
                <PaymentMethodPicker
                    methods={methods}
                    value={form.paymentMethod}
                    onChange={(id) => setField('paymentMethod', id)}
                    bankInstructions={bankInstructions}
                />
            </section>

            <label className="flex items-start gap-2.5 text-sm text-stone-700 cursor-pointer">
                <input
                    type="checkbox"
                    checked={form.agreedTerms}
                    onChange={(e) => setField('agreedTerms', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#1C1B18]"
                />
                <span>
                    I agree to the{' '}
                    <button
                        type="button"
                        onClick={() => onOpenLegal?.('terms')}
                        className="underline text-[#7D6242] cursor-pointer"
                    >
                        Terms &amp; Conditions
                    </button>{' '}
                    and{' '}
                    <button
                        type="button"
                        onClick={() => onOpenLegal?.('returns')}
                        className="underline text-[#7D6242] cursor-pointer"
                    >
                        delivery &amp; returns policy
                    </button>
                    .
                </span>
            </label>

            {error && (
                <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2"
                >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{error.message}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={submitting || methods.length === 0}
                className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-400 text-white text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                    chosen?.online && <Lock className="w-4 h-4" aria-hidden="true" />
                )}
                {submitting ? 'Please wait…' : submitLabel}
            </button>
        </form>
    );
}
