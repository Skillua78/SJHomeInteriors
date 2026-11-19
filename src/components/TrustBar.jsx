import { Store, Truck, CreditCard, PoundSterling } from 'lucide-react';

/** Payment methods in words, from what is actually switched on. */
export function paymentSummary(paymentOptions) {
    const o = paymentOptions || {};
    const names = [];
    if (o.card) names.push('card');
    if (o.klarna) names.push('Klarna');
    if (o.cod) names.push('pay on delivery');
    if (o.showroom) names.push('pay in showroom');
    if (o.bacs) names.push('bank transfer');
    if (names.length === 0) return 'Pay in our showroom';
    const text = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function trustItems(siteSettings) {
    const miles = Number(siteSettings?.freeDeliveryMiles ?? 10);
    return [
        { icon: Store, title: 'See it in our showroom', sub: 'High Street, Maltby – try before you buy' },
        {
            icon: Truck,
            title: 'Fast local delivery',
            sub: miles > 0 ? `Free within ${miles} miles of Maltby` : 'Delivered by our own team',
        },
        { icon: CreditCard, title: 'Flexible ways to pay', sub: paymentSummary(siteSettings?.paymentOptions) },
        { icon: PoundSterling, title: 'Direct-to-customer prices', sub: 'No high-street markups' },
    ];
}

/**
 * Trust strip: a band under the hero ("band") or a compact grid inside the
 * product view ("compact").
 */
export default function TrustBar({ siteSettings, variant = 'band', ready = true }) {
    const items = trustItems(siteSettings);

    if (variant === 'compact') {
        return (
            <ul className="grid grid-cols-2 gap-3 text-xs text-stone-700">
                {items.map(({ icon: Icon, title, sub }) => (
                    <li key={title} className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-bronze shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                            <span className="block font-semibold text-ink">{title}</span>
                            <span className="block text-stone-600">{sub}</span>
                        </span>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section aria-label="Why shop with us" className="bg-white border-b border-stone-200/80">
            <ul
                className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 ${
                    ready ? '' : 'invisible'
                }`}
            >
                {items.map(({ icon: Icon, title, sub }) => (
                    <li
                        key={title}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-cream border border-stone-200/60"
                    >
                        <span className="p-2 sm:p-2.5 rounded-xl bg-ink text-gold shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[13px] sm:text-sm font-bold text-ink leading-snug">{title}</span>
                            <span className="block text-xs font-medium text-bronze-deep mt-0.5">{sub}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
