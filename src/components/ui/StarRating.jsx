import { Star } from 'lucide-react';

/** Read-only stars (rounded to the nearest half for display). */
export default function StarRating({ value = 0, count, size = 'sm', className = '' }) {
    const rounded = Math.round(Number(value) * 2) / 2;
    const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
    const label =
        count !== undefined
            ? `Rated ${Number(value).toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`
            : `Rated ${Number(value).toFixed(1)} out of 5`;

    return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <span role="img" aria-label={label} className="inline-flex text-amber-500">
                {[1, 2, 3, 4, 5].map((n) => {
                    const fill = rounded >= n ? 'full' : rounded >= n - 0.5 ? 'half' : 'empty';
                    return (
                        <span key={n} className="relative inline-block" aria-hidden="true">
                            <Star className={`${sizes[size]} text-stone-300`} />
                            {fill !== 'empty' && (
                                <span
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: fill === 'half' ? '50%' : '100%' }}
                                >
                                    <Star className={`${sizes[size]} fill-current`} />
                                </span>
                            )}
                        </span>
                    );
                })}
            </span>
            {count !== undefined && (
                <span className="text-xs font-medium text-stone-600 tabular-nums" aria-hidden="true">
                    {Number(value).toFixed(1)} ({count})
                </span>
            )}
        </span>
    );
}
