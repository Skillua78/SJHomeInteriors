import { useState } from 'react';
import {
    Maximize2,
    Flame,
    Sparkles,
    Package,
    ChevronLeft,
    ChevronRight,
    Edit3,
} from 'lucide-react';
import { colorMap } from '../data/products';
import { validateSafeImageUrl } from '../utils/security';

export function resolveColorHex(colorName, customColors = {}) {
    if (!colorName) return '#D6D3CD';
    if (customColors[colorName]) return customColors[colorName];
    if (colorMap[colorName]) return colorMap[colorName];

    const lower = colorName.toLowerCase();
    const foundKey = Object.keys(colorMap).find((k) => k.toLowerCase() === lower);
    if (foundKey) return colorMap[foundKey];

    // Fallback keyword matching
    if (lower.includes('black')) return '#1C1B18';
    if (lower.includes('navy')) return '#1B2A4A';
    if (lower.includes('blue')) return '#2B547E';
    if (lower.includes('green') || lower.includes('sage') || lower.includes('olive')) return '#3B5249';
    if (lower.includes('charcoal') || lower.includes('dark grey')) return '#3E4042';
    if (lower.includes('grey') || lower.includes('silver')) return '#8C8C8C';
    if (lower.includes('white') || lower.includes('ivory')) return '#F5F5F2';
    if (lower.includes('cream') || lower.includes('beige') || lower.includes('champagne')) return '#E6DEC8';
    if (lower.includes('taupe') || lower.includes('mink')) return '#9E9082';
    if (lower.includes('brown') || lower.includes('walnut') || lower.includes('tan')) return '#6B4C35';
    if (lower.includes('oak') || lower.includes('wood') || lower.includes('gold')) return '#C8A165';
    if (lower.includes('pink') || lower.includes('blush')) return '#E3BCBC';
    return '#C2B9AC';
}

export default function ProductCard({
    product,
    onOpenModal,
    onAddToCart,
    isAdmin,
    onEditProduct,
    customColors,
}) {
    const colorsList = product.colors?.length ? product.colors : [];
    const [selectedColor, setSelectedColor] = useState(colorsList[0] || 'Standard');
    const [imgIndex, setImgIndex] = useState(0);

    const rawGallery =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];

    const gallery = rawGallery.map((u) => validateSafeImageUrl(u)).filter(Boolean);
    if (gallery.length === 0) {
        gallery.push(
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85'
        );
    }

    const currentImg = gallery[imgIndex % gallery.length];

    const hasStockTracking =
        product.stock !== null && product.stock !== undefined && product.stock !== '';
    const numericStock = hasStockTracking ? Number(product.stock) : null;
    const isAvailable = !hasStockTracking || numericStock > 0;

    const hasPreviousPrice =
        product.previousPrice !== null &&
        product.previousPrice !== undefined &&
        Number(product.previousPrice) > Number(product.price);

    const v = product.variations || {};
    const fabricCount = Array.isArray(v.fabrics) ? v.fabrics.length : 0;
    const sizeCount = Array.isArray(v.sizes) ? v.sizes.length : 0;

    // Format primary dimension line from structuredDimensions or legacy dimensions
    const defaultDim = v.structuredDimensions?.default;
    const structuredDimSummary = defaultDim
        ? [
            defaultDim.length ? `L: ${defaultDim.length}` : '',
            defaultDim.width ? `W: ${defaultDim.width}` : '',
            defaultDim.depth ? `D: ${defaultDim.depth}` : '',
        ]
            .filter(Boolean)
            .join(' × ')
        : '';
    const primaryDimText = structuredDimSummary || product.dimensions?.[0] || '';

    return (
        <article
            aria-label={product.name}
            className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:shadow-xl transition duration-300 flex flex-col justify-between"
        >
            <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 select-none">
                    <img
                        src={currentImg}
                        alt={`${product.name} - Image ${imgIndex + 1} of ${gallery.length}`}
                        loading="lazy"
                        onClick={() => onOpenModal(product, selectedColor)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 cursor-pointer"
                    />

                    {gallery.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                                }}
                                aria-label="Previous product image"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImgIndex((prev) => (prev + 1) % gallery.length);
                                }}
                                aria-label="Next product image"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

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
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 max-w-[65%]">
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
                                <Flame className="w-3 h-3" /> Trending
                            </span>
                        )}
                        {product.isPopular && !product.isTrending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#9A7B56] text-white flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-3 h-3" /> Popular
                            </span>
                        )}
                    </div>

                    {/* Top Right: Admin Direct Edit Button + Optional Stock Pill */}
                    <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1.5">
                        {isAdmin && onEditProduct && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditProduct(product);
                                }}
                                className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer transition"
                                title="Edit this product in Admin Dashboard"
                            >
                                <Edit3 className="w-3 h-3" /> Edit Item
                            </button>
                        )}

                        {hasStockTracking && (
                            <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs ${numericStock > 3
                                        ? 'bg-emerald-900/90 text-emerald-100'
                                        : numericStock > 0
                                            ? 'bg-amber-700/95 text-white'
                                            : 'bg-stone-800/90 text-stone-300'
                                    }`}
                            >
                                <Package className="w-3 h-3" />
                                {numericStock > 0 ? `${numericStock} in stock` : '0 in stock'}
                            </span>
                        )}
                    </div>

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

                        {colorsList.length > 0 && (
                            <div
                                className="flex items-center space-x-1.5 shrink-0"
                                role="group"
                                aria-label="Available finishes"
                            >
                                {colorsList.slice(0, 6).map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        aria-label={`Select ${color} finish`}
                                        aria-pressed={selectedColor === color}
                                        title={color}
                                        className={`w-4 h-4 rounded-full border transition cursor-pointer ${selectedColor === color
                                                ? 'ring-2 ring-offset-1 ring-[#9A7B56] border-stone-700 scale-110'
                                                : 'border-stone-300 opacity-85 hover:opacity-100'
                                            }`}
                                        style={{ backgroundColor: resolveColorHex(color, customColors) }}
                                    />
                                ))}
                                {colorsList.length > 6 && (
                                    <span className="text-[10px] font-bold text-stone-400">
                                        +{colorsList.length - 6}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <h3
                        onClick={() => onOpenModal(product, selectedColor)}
                        className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] group-hover:text-[#9A7B56] transition cursor-pointer"
                    >
                        {product.name}
                    </h3>

                    {product.description && (
                        <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {colorsList.length > 0 && (
                            <span className="text-[11px] text-stone-500">
                                Finish: <strong className="text-stone-700">{selectedColor}</strong>
                            </span>
                        )}
                        {(fabricCount > 0 || sizeCount > 0) && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-stone-200 text-[#9A7B56]">
                                {[
                                    sizeCount > 0 ? `${sizeCount} Sizes` : '',
                                    fabricCount > 0 ? `${fabricCount} Fabrics` : '',
                                ]
                                    .filter(Boolean)
                                    .join(' • ')}
                            </span>
                        )}
                    </div>

                    {primaryDimText && (
                        <p className="text-xs text-stone-500 mt-1.5 line-clamp-1">{primaryDimText}</p>
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
                            className="text-xs font-semibold text-[#7D6242] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            Options & Photos ({gallery.length}) &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex gap-2">
                <button
                    type="button"
                    onClick={() => onAddToCart(product, selectedColor)}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition cursor-pointer ${isAvailable
                            ? 'bg-[#1C1B18] hover:bg-[#9A7B56] text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                >
                    {isAvailable ? 'Add to Basket' : 'Pre-Order in Basket'}
                </button>
                {isAdmin && onEditProduct && (
                    <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        aria-label={`Edit ${product.name}`}
                        className="p-3 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                        title="Edit Product"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onOpenModal(product, selectedColor)}
                    aria-label={`View full details and gallery for ${product.name}`}
                    className="p-3 rounded-full border border-stone-200 hover:border-[#9A7B56] text-stone-700 transition cursor-pointer"
                    title="View Gallery & Variations"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
}