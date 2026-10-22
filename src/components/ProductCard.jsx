import { useState } from 'react';
import {
    Maximize2,
    Flame,
    Sparkles,
    Package,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { colorMap } from '../data/products';
import { validateSafeImageUrl } from '../utils/security';

export default function ProductCard({ product, onOpenModal, onAddToCart }) {
    const colorsList = product.colors?.length ? product.colors : ['Standard'];
    const [selectedColor, setSelectedColor] = useState(colorsList[0]);
    const [imgIndex, setImgIndex] = useState(0);

    // Build validated image gallery array
    const rawGallery =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];

    const gallery = rawGallery
        .map((u) => validateSafeImageUrl(u))
        .filter(Boolean);

    if (gallery.length === 0) {
        gallery.push(
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85'
        );
    }

    const currentImg = gallery[imgIndex % gallery.length];

    // Stock logic: null/undefined/'' means untracked (available & badge hidden)
    const hasStockTracking =
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock !== '';
    const numericStock = hasStockTracking ? Number(product.stock) : null;
    const isAvailable = !hasStockTracking || numericStock > 0;

    const hasPreviousPrice =
        product.previousPrice !== null &&
        product.previousPrice !== undefined &&
        Number(product.previousPrice) > Number(product.price);

    const handlePrevImg = (e) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    };

    const handleNextImg = (e) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev + 1) % gallery.length);
    };

    return (
        <article
            aria-label={product.name}
            className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:shadow-xl transition duration-300 flex flex-col justify-between"
        >
            <div>
                {/* Image Header with Multi-Image Carousel */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 select-none">
                    <img
                        src={currentImg}
                        alt={`${product.name} - Image ${imgIndex + 1} of ${gallery.length}`}
                        loading="lazy"
                        onClick={() => onOpenModal(product, selectedColor)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 cursor-pointer"
                    />

                    {/* Left / Right Image Carousel Controls (shown if multiple images exist) */}
                    {gallery.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrevImg}
                                aria-label="Previous product image"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextImg}
                                aria-label="Next product image"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Image Dots Indicator */}
                            <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 bg-black/45 backdrop-blur-xs px-2.5 py-1 rounded-full">
                                {gallery.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImgIndex(idx);
                                        }}
                                        aria-label={`View image ${idx + 1}`}
                                        className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === imgIndex % gallery.length
                                                ? 'w-4 bg-white'
                                                : 'w-1.5 bg-white/50 hover:bg-white/80'
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Top Left Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 max-w-[70%]">
                        {!isAvailable ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-red-800 text-white shadow-xs">
                                Out of Stock / Pre-Order
                            </span>
                        ) : product.badge ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#1C1B18] text-white shadow-xs">
                                {product.badge}
                            </span>
                        ) : null}

                        {product.isTrending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-xs">
                                <Flame className="w-3 h-3" aria-hidden="true" /> Trending
                            </span>
                        )}
                        {product.isPopular && !product.isTrending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#9A7B56] text-white flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-3 h-3" aria-hidden="true" /> Popular
                            </span>
                        )}
                    </div>

                    {/* Stock Indicator Pill — ONLY rendered if stock was explicitly set */}
                    {hasStockTracking && (
                        <span
                            className={`absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs ${numericStock > 3
                                    ? 'bg-emerald-900/90 text-emerald-100'
                                    : numericStock > 0
                                        ? 'bg-amber-700/95 text-white'
                                        : 'bg-stone-800/90 text-stone-300'
                                }`}
                        >
                            <Package className="w-3 h-3" aria-hidden="true" />
                            {numericStock > 0 ? `${numericStock} in stock` : '0 in stock'}
                        </span>
                    )}

                    {product.delivery && (
                        <span className="absolute bottom-3 right-3.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/90 backdrop-blur-xs text-[#1C1B18] shadow-xs">
                            Delivery: {product.delivery}
                        </span>
                    )}
                </div>

                {/* Details Body */}
                <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7B56] truncate">
                            {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
                        </span>

                        {/* Interactive Colour Swatches */}
                        {product.colors?.length > 0 && (
                            <div
                                className="flex items-center space-x-1.5 shrink-0"
                                role="group"
                                aria-label="Available finishes"
                            >
                                {product.colors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        aria-label={`Select ${color} finish`}
                                        aria-pressed={selectedColor === color}
                                        title={`Select ${color}`}
                                        className={`w-4 h-4 rounded-full border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A7B56] ${selectedColor === color
                                                ? 'ring-2 ring-offset-1 ring-[#9A7B56] border-stone-600'
                                                : 'border-stone-300 opacity-80 hover:opacity-100'
                                            }`}
                                        style={{ backgroundColor: colorMap[color] || '#ccc' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] group-hover:text-[#9A7B56] transition">
                        {product.name}
                    </h3>

                    {product.description && (
                        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    {product.colors?.length > 0 && (
                        <p className="text-[11px] text-stone-500 mt-1.5">
                            Finish: <strong className="text-stone-700">{selectedColor}</strong>
                        </p>
                    )}

                    {product.dimensions?.[0] && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                            {product.dimensions[0]}
                        </p>
                    )}

                    {/* Price & Previous Strikethrough Price */}
                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                            {hasPreviousPrice && (
                                <span
                                    className="text-sm sm:text-base font-medium text-stone-400 line-through"
                                    aria-label={`Previous price £${Number(product.previousPrice).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                                >
                                    £{Number(product.previousPrice).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                            )}
                            <span className="text-2xl font-bold text-[#1C1B18]">
                                £{Number(product.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpenModal(product, selectedColor)}
                            className="text-xs font-semibold text-[#7D6242] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A7B56] rounded"
                        >
                            Details & Photos ({gallery.length}) &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex gap-2">
                <button
                    type="button"
                    onClick={() => onAddToCart(product, selectedColor)}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A7B56] ${isAvailable
                            ? 'bg-[#1C1B18] hover:bg-[#9A7B56] text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                >
                    {isAvailable ? 'Add to Basket' : 'Pre-Order in Basket'}
                </button>
                <button
                    type="button"
                    onClick={() => onOpenModal(product, selectedColor)}
                    aria-label={`View full details and gallery for ${product.name}`}
                    className="p-3 rounded-full border border-stone-200 hover:border-[#9A7B56] text-stone-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A7B56]"
                    title="View Gallery & Specifications"
                >
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>
        </article>
    );
}