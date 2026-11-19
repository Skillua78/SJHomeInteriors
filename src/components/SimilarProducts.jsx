import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { validateSafeImageUrl } from '../utils/security';
import { pickSimilar } from '../utils/storefront';
import { formatGBP } from '../../shared/pricing.js';
import StarRating from './ui/StarRating';

/**
 * "You may also like": up to 4 products from the same subcategory, topped up
 * from the same category. The API never returns hidden products. Choosing one
 * switches the product view to it.
 */
export default function SimilarProducts({ product, onSelect }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!product?.id || !product.category) return undefined;
        let cancelled = false;
        setItems([]);
        (async () => {
            try {
                const [sameSub, sameCategory] = await Promise.all([
                    product.subcategory
                        ? api.listProducts({ category: product.category, subcategory: product.subcategory, limit: 6 })
                        : Promise.resolve({ items: [] }),
                    api.listProducts({ category: product.category, limit: 8 }),
                ]);
                if (!cancelled) setItems(pickSimilar(product, sameSub.items, sameCategory.items, 4));
            } catch {
                if (!cancelled) setItems([]);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id]);

    if (items.length === 0) return null;

    return (
        <section aria-labelledby="similar-title" className="space-y-3">
            <h3 id="similar-title" className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                You may also like
            </h3>
            <ul className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
                {items.map((p) => {
                    const was = p.previousPrice && p.previousPrice > p.price ? p.previousPrice : null;
                    return (
                        <li key={p.id} className="snap-start shrink-0 w-40 sm:w-44">
                            <button
                                type="button"
                                onClick={() => onSelect(p)}
                                className="group block w-full text-left rounded-2xl border border-stone-200 bg-white overflow-hidden hover:border-stone-400 hover:shadow-md transition"
                            >
                                <span className="block aspect-[4/3] bg-linen overflow-hidden">
                                    {validateSafeImageUrl(p.image) && (
                                        <img
                                            src={validateSafeImageUrl(p.image)}
                                            alt=""
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                    )}
                                </span>
                                <span className="block p-3">
                                    <span className="block text-sm font-semibold text-ink leading-snug line-clamp-2">
                                        {p.name}
                                    </span>
                                    {p.rating && (
                                        <StarRating value={p.rating.average} count={p.rating.count} className="mt-1" />
                                    )}
                                    <span className="block mt-1 text-sm">
                                        <span className="font-bold text-ink tabular-nums">{formatGBP(p.price)}</span>
                                        {was && (
                                            <span className="ml-1.5 text-xs text-stone-500 line-through tabular-nums">
                                                {formatGBP(was)}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
