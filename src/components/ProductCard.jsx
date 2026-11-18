import { useState } from 'react';
import { Flame, Sparkles, Edit3, Images, Truck } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { resolveColorHex } from '../utils/colors';
import { formatGBP } from '../../shared/pricing.js';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85';
const MAX_SWATCHES = 5;

/**
 * Catalogue card. Reading order is image -> name -> price -> delivery -> action,
 * with the price block pinned to the bottom so cards in a row line up.
 *
 * @param freeDeliveryMiles radius for free delivery (from site settings), shown as a reassurance
 */
export default function ProductCard({
    product,
    onOpenModal,
    onAddToCart,
    isAdmin,
    onEditProduct,
    customColors,
    freeDeliveryMiles,
}) {
    const colors = product.colors?.length ? product.colors : [];
    const [selectedColor, setSelectedColor] = useState(colors[0] || '');

    const image = validateSafeImageUrl(product.image) || FALLBACK_IMAGE;
    const tracked = product.stock !== null && product.stock !== undefined;
    const stock = tracked ? Number(product.stock) : null;
    const available = !tracked || stock > 0;
    const lowStock = tracked && stock > 0 && stock <= 3;

    const wasPrice =
        product.previousPrice && Number(product.previousPrice) > Number(product.price)
            ? Number(product.previousPrice)
            : null;
    const saving = wasPrice ? wasPrice - Number(product.price) : 0;

    const optionSummary = [
        product.sizeCount > 0 ? `${product.sizeCount} size${product.sizeCount === 1 ? '' : 's'}` : '',
        product.fabricCount > 0
            ? `${product.fabricCount} fabric${product.fabricCount === 1 ? '' : 's'}`
            : '',
    ]
        .filter(Boolean)
        .join(' · ');

    // At most two image badges so the photo stays the hero.
    const badges = [];
    if (!available) badges.push({ text: 'Pre-order', className: 'bg-ink text-white' });
    else if (product.badge) badges.push({ text: product.badge, className: 'bg-ink text-white' });
    if (product.isTrending) {
        badges.push({ text: 'Trending', icon: Flame, className: 'bg-white/95 text-ink' });
    } else if (product.isPopular) {
        badges.push({ text: 'Popular', icon: Sparkles, className: 'bg-white/95 text-ink' });
    }

    const deliveryText = [
        product.delivery ? `Delivery in ${product.delivery}` : 'Home delivery or collection',
        Number(freeDeliveryMiles) > 0 ? `free within ${freeDeliveryMiles} miles` : '',
    ]
        .filter(Boolean)
        .join(' · ');

    const open = () => onOpenModal(product, selectedColor);

    return (
        <article
            aria-label={product.name}
            className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-[0_1px_2px_rgba(28,27,24,0.04)] hover:shadow-[0_18px_40px_-20px_rgba(28,27,24,0.35)] hover:-translate-y-0.5 hover:border-stone-300 transition duration-300 ease-out flex flex-col h-full"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-linen">
                <button
                    type="button"
                    onClick={open}
                    aria-label={`View ${product.name}`}
                    className="block w-full h-full focus-visible:outline-offset-[-4px]"
                >
                    <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                    />
                </button>

                {badges.length > 0 && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%] pointer-events-none">
                        {badges.map(({ text, icon: Icon, className }) => (
                            <span
                                key={text}
                                className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-sm ${className}`}
                            >
                                {Icon && <Icon className="w-3 h-3 text-bronze" aria-hidden="true" />}
                                {text}
                            </span>
                        ))}
                    </div>
                )}

                {isAdmin && onEditProduct && (
                    <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="absolute top-2 right-2 min-h-11 px-3.5 rounded-full bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-md transition"
                    >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                )}

                {product.imageCount > 1 && (
                    <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-[11px] font-semibold bg-ink/70 text-white flex items-center gap-1 pointer-events-none">
                        <Images className="w-3 h-3" aria-hidden="true" />
                        {product.imageCount}
                        <span className="sr-only"> photos</span>
                    </span>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bronze-deep truncate">
                    {product.subcategory || product.category}
                </span>

                <h3 className="font-serif text-[1.375rem] font-bold text-ink leading-tight mt-1 line-clamp-2">
                    <button
                        type="button"
                        onClick={open}
                        className="text-left min-h-11 py-1 hover:text-bronze-deep transition-colors"
                    >
                        {product.name}
                    </button>
                </h3>

                {product.description && (
                    <p className="text-sm text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}

                {(colors.length > 0 || optionSummary) && (
                    <div className="flex items-center gap-2 mt-2 -ml-2.5 min-h-11">
                        {colors.length > 0 && (
                            <div className="flex items-center" role="group" aria-label="Choose a colour">
                                {colors.slice(0, MAX_SWATCHES).map((color) => {
                                    const selected = selectedColor === color;
                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            aria-label={`${color} colour`}
                                            aria-pressed={selected}
                                            title={color}
                                            className="w-11 h-11 flex items-center justify-center rounded-full"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`w-6 h-6 rounded-full border transition ${
                                                    selected
                                                        ? 'ring-2 ring-offset-2 ring-bronze border-stone-500'
                                                        : 'border-stone-300 hover:border-stone-500'
                                                }`}
                                                style={{ backgroundColor: resolveColorHex(color, customColors) }}
                                            />
                                        </button>
                                    );
                                })}
                                {colors.length > MAX_SWATCHES && (
                                    <button
                                        type="button"
                                        onClick={open}
                                        className="min-w-11 h-11 px-1 text-xs font-semibold text-stone-600 hover:text-ink"
                                        aria-label={`See all ${colors.length} colours`}
                                    >
                                        +{colors.length - MAX_SWATCHES}
                                    </button>
                                )}
                            </div>
                        )}
                        {optionSummary && (
                            <span className="text-xs font-medium text-stone-500 truncate pl-1">{optionSummary}</span>
                        )}
                    </div>
                )}

                {/* Everything below is pinned to the bottom so cards in a row line up. */}
                <div className="mt-auto pt-4 border-t border-stone-100">
                    <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
                        {product.hasOptions && (
                            <span className="text-xs font-medium text-stone-500">From</span>
                        )}
                        <span className="text-[1.625rem] leading-none font-bold text-ink tabular-nums tracking-tight">
                            {formatGBP(product.price)}
                        </span>
                        {wasPrice && (
                            <span className="text-sm text-stone-500 line-through tabular-nums">
                                <span className="sr-only">Was </span>
                                {formatGBP(wasPrice)}
                            </span>
                        )}
                        {saving >= 1 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                                Save {formatGBP(saving).replace('.00', '')}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-stone-600 mt-2 flex items-start gap-1.5">
                        <Truck className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                        <span>{deliveryText}</span>
                    </p>

                    {lowStock && (
                        <p className="text-xs font-semibold text-amber-800 mt-1.5">Only {stock} left in stock</p>
                    )}

                    <div className="flex gap-2 mt-4">
                        {product.hasOptions ? (
                            <button
                                type="button"
                                onClick={open}
                                className="press flex-1 min-h-12 px-4 rounded-full text-sm font-semibold bg-ink hover:bg-bronze-strong text-white"
                            >
                                Choose options
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onAddToCart(product, { color: selectedColor })}
                                    className="press flex-1 min-h-12 px-4 rounded-full text-sm font-semibold bg-ink hover:bg-bronze-strong text-white"
                                >
                                    {available ? 'Add to basket' : 'Pre-order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={open}
                                    className="press min-h-12 px-5 rounded-full text-sm font-semibold border border-stone-300 hover:border-ink text-ink"
                                >
                                    Details
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
