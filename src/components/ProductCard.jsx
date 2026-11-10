import { useState } from 'react';
import { Flame, Sparkles, Edit3, Images, Truck } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { resolveColorHex } from '../utils/colors';
import { formatGBP } from '../../shared/pricing.js';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85';

export default function ProductCard({
    product,
    onOpenModal,
    onAddToCart,
    isAdmin,
    onEditProduct,
    customColors,
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
        colors.length > 1 ? `${colors.length} colours` : '',
    ]
        .filter(Boolean)
        .join(' · ');

    const open = () => onOpenModal(product, selectedColor);

    return (
        <article
            aria-label={product.name}
            className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:shadow-xl hover:-translate-y-0.5 transition duration-300 flex flex-col h-full"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <button
                    type="button"
                    onClick={open}
                    aria-label={`View ${product.name}`}
                    className="block w-full h-full cursor-pointer"
                >
                    <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                </button>

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%] pointer-events-none">
                    {!available ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-stone-900 text-white shadow-xs">
                            Pre-order
                        </span>
                    ) : (
                        product.badge && (
                            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#1C1B18] text-white shadow-xs">
                                {product.badge}
                            </span>
                        )
                    )}
                    {saving >= 1 && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-700 text-white shadow-xs">
                            Save {formatGBP(saving).replace('.00', '')}
                        </span>
                    )}
                    {product.isTrending && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-xs">
                            <Flame className="w-3 h-3" aria-hidden="true" /> Trending
                        </span>
                    )}
                    {product.isPopular && !product.isTrending && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#9A7B56] text-white flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3 h-3" aria-hidden="true" /> Popular
                        </span>
                    )}
                </div>

                {isAdmin && onEditProduct && (
                    <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer transition"
                    >
                        <Edit3 className="w-3 h-3" aria-hidden="true" /> Edit
                    </button>
                )}

                {product.imageCount > 1 && (
                    <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-[11px] font-semibold bg-black/60 text-white flex items-center gap-1 pointer-events-none">
                        <Images className="w-3 h-3" aria-hidden="true" /> {product.imageCount}
                    </span>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7B56] truncate">
                        {product.subcategory || product.category}
                    </span>
                    {colors.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label="Colours">
                            {colors.slice(0, 5).map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    aria-label={`${color} colour`}
                                    aria-pressed={selectedColor === color}
                                    title={color}
                                    className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                                        selectedColor === color
                                            ? 'ring-2 ring-offset-1 ring-[#9A7B56] border-stone-600'
                                            : 'border-stone-300 hover:border-stone-500'
                                    }`}
                                    style={{ backgroundColor: resolveColorHex(color, customColors) }}
                                />
                            ))}
                            {colors.length > 5 && (
                                <span className="text-[11px] font-semibold text-stone-500">
                                    +{colors.length - 5}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <h3 className="font-serif text-xl font-bold text-[#1C1B18] leading-snug mt-1.5 line-clamp-2">
                    <button
                        type="button"
                        onClick={open}
                        className="text-left hover:text-[#9A7B56] transition cursor-pointer"
                    >
                        {product.name}
                    </button>
                </h3>

                {product.description && (
                    <p className="text-sm text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}

                {optionSummary && (
                    <p className="text-xs font-medium text-stone-500 mt-2">{optionSummary}</p>
                )}

                {/* Everything below is pinned to the bottom so cards in a row line up. */}
                <div className="mt-auto pt-4">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-bold text-[#1C1B18]">
                            {product.hasOptions && (
                                <span className="text-sm font-medium text-stone-500 mr-1">From</span>
                            )}
                            {formatGBP(product.price)}
                        </span>
                        {wasPrice && (
                            <span className="text-sm text-stone-400 line-through">
                                <span className="sr-only">Was </span>
                                {formatGBP(wasPrice)}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" aria-hidden="true" />
                        <span>
                            {product.deliveryFee > 0
                                ? `Delivery & assembly ${formatGBP(product.deliveryFee)}`
                                : 'Delivery & assembly included'}
                            {product.delivery ? ` · ${product.delivery}` : ''}
                        </span>
                    </p>

                    {lowStock && (
                        <p className="text-xs font-semibold text-amber-700 mt-1">Only {stock} left in stock</p>
                    )}

                    <div className="flex gap-2 mt-4">
                        {product.hasOptions ? (
                            <button
                                type="button"
                                onClick={open}
                                className="flex-1 py-3 px-4 rounded-full text-sm font-semibold bg-[#1C1B18] hover:bg-[#9A7B56] text-white transition cursor-pointer"
                            >
                                Choose options
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onAddToCart(product, { color: selectedColor })}
                                    className="flex-1 py-3 px-4 rounded-full text-sm font-semibold bg-[#1C1B18] hover:bg-[#9A7B56] text-white transition cursor-pointer"
                                >
                                    {available ? 'Add to basket' : 'Pre-order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={open}
                                    className="py-3 px-4 rounded-full text-sm font-semibold border border-stone-300 hover:border-[#9A7B56] text-stone-700 transition cursor-pointer"
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
