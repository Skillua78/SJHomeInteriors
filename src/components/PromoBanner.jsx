import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { promoState } from '../utils/storefront';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Sale banner above the header, switched on and edited in Admin -> Settings -> Promotion.
 * The countdown runs to a real end date and the banner disappears when it is reached
 * (UK rules prohibit fake or resetting urgency timers).
 */
export default function PromoBanner({ siteSettings, onShopNow }) {
    const [now, setNow] = useState(() => Date.now());
    const state = promoState(siteSettings, now);
    const hasCountdown = Boolean(state?.parts);

    useEffect(() => {
        if (!hasCountdown) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [hasCountdown]);

    if (!state) return null;

    const percent = Number(siteSettings.promoDiscountPercent) || 0;
    const units = state.parts
        ? [
              ['days', state.parts.days],
              ['hrs', state.parts.hours],
              ['mins', state.parts.minutes],
              ['secs', state.parts.seconds],
          ]
        : [];
    const endsText = siteSettings.promoEndDate
        ? new Date(siteSettings.promoEndDate).toLocaleString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

    return (
        <section
            aria-label="Current offer"
            className="bg-gradient-to-r from-bronze-deep via-bronze-strong to-bronze-deep text-white"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center">
                <p className="flex items-center gap-2 text-sm font-semibold">
                    <Tag className="w-4 h-4 shrink-0 text-gold" aria-hidden="true" />
                    <span>{siteSettings.promoText}</span>
                    {percent > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white text-bronze-deep text-xs font-bold whitespace-nowrap">
                            Up to {percent}% off
                        </span>
                    )}
                </p>

                <div className="flex items-center justify-center gap-3 sm:gap-5">
                    {state.parts && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/80">Ends in</span>
                            {/* Visual countdown; screen readers get the end date once instead of every second. */}
                            <span className="sm:hidden text-sm font-bold tabular-nums" aria-hidden="true">
                                {state.parts.days}d {pad(state.parts.hours)}h {pad(state.parts.minutes)}m{' '}
                                {pad(state.parts.seconds)}s
                            </span>
                            <ol className="hidden sm:flex items-center gap-1" aria-hidden="true">
                                {units.map(([label, value]) => (
                                    <li
                                        key={label}
                                        className="min-w-[2.75rem] px-1.5 py-0.5 rounded-md bg-black/25 leading-tight"
                                    >
                                        <span className="block text-sm font-bold tabular-nums">
                                            {label === 'days' ? value : pad(value)}
                                        </span>
                                        <span className="block text-[9px] uppercase tracking-wider text-white/75">{label}</span>
                                    </li>
                                ))}
                            </ol>
                            <span className="sr-only">Offer ends {endsText}</span>
                        </div>
                    )}

                    {onShopNow && (
                        <button
                            type="button"
                            onClick={onShopNow}
                            className="press -my-1.5 min-h-11 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center"
                        >
                            <span className="px-3 py-1.5 -mx-3 rounded-full bg-ink/80 hover:bg-ink whitespace-nowrap">
                                Shop the offers
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
