import { Lock } from 'lucide-react';

/**
 * Accepted payment methods, built only from what the shop has switched on
 * (siteSettings.paymentOptions from the API), so we never advertise a method
 * the customer cannot actually use.
 *
 * Apple Pay / Google Pay appear inside Stripe's card checkout on supported
 * devices when they are enabled in the Stripe Dashboard (Settings -> Payment methods).
 */
export function acceptedPaymentLabels(paymentOptions) {
    const options = paymentOptions || {};
    const labels = [];
    if (options.card) labels.push('Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay');
    if (options.klarna) labels.push('Klarna');
    if (options.cod) labels.push('Pay on delivery');
    if (options.showroom) labels.push('Pay in showroom');
    if (options.bacs) labels.push('Bank transfer');
    return labels;
}

const BADGE_STYLES = {
    light: 'bg-white border-stone-200 text-ink',
    dark: 'bg-white/5 border-white/15 text-stone-200',
};

export default function PaymentBadges({ paymentOptions, tone = 'light', showSecureNote = true, className = '' }) {
    const labels = acceptedPaymentLabels(paymentOptions);
    if (labels.length === 0) return null;
    const online = Boolean(paymentOptions?.card || paymentOptions?.klarna);

    return (
        <div className={className}>
            <ul aria-label="Ways to pay" className="flex flex-wrap gap-1.5">
                {labels.map((label) => (
                    <li
                        key={label}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold tracking-tight ${BADGE_STYLES[tone]}`}
                    >
                        {label === 'Klarna' ? (
                            <span className="inline-flex items-center gap-1">
                                <span
                                    aria-hidden="true"
                                    className="inline-block w-2 h-2 rounded-full bg-[#FFB3C7]"
                                />
                                Klarna
                            </span>
                        ) : (
                            label
                        )}
                    </li>
                ))}
            </ul>
            {showSecureNote && online && (
                <p
                    className={`mt-2 text-[11px] flex items-center gap-1.5 ${
                        tone === 'dark' ? 'text-stone-400' : 'text-stone-500'
                    }`}
                >
                    <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                    Secure checkout by Stripe. We never see or store your card details.
                </p>
            )}
        </div>
    );
}
