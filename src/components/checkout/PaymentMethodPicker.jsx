import { CreditCard, Banknote, Building2, Store, CalendarClock } from 'lucide-react';

const ICONS = {
    card: CreditCard,
    klarna: CalendarClock,
    cod: Banknote,
    showroom: Store,
    bacs: Building2,
};

export default function PaymentMethodPicker({ methods, value, onChange, bankInstructions }) {
    if (methods.length === 0) {
        return (
            <p className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                No payment methods are available right now. Please contact the showroom to place your
                order.
            </p>
        );
    }

    return (
        <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
            {methods.map((method) => {
                const Icon = ICONS[method.id] || CreditCard;
                const selected = value === method.id;
                return (
                    <label
                        key={method.id}
                        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                            selected
                                ? 'border-ink bg-cream ring-1 ring-ink'
                                : 'border-stone-300 bg-white hover:border-bronze'
                        }`}
                    >
                        <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selected}
                            onChange={() => onChange(method.id)}
                            className="mt-1 accent-ink"
                        />
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-ink flex items-center gap-2">
                                <Icon className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                                {method.title}
                            </span>
                            <span className="block text-xs text-stone-600 mt-1 leading-relaxed">
                                {method.blurb}
                            </span>
                            {method.id === 'bacs' && selected && bankInstructions && (
                                <span className="block text-xs text-stone-700 mt-2 whitespace-pre-line bg-white p-3 rounded-lg border border-stone-200">
                                    {bankInstructions}
                                </span>
                            )}
                        </div>
                    </label>
                );
            })}
        </div>
    );
}
