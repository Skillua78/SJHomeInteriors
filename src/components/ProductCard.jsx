import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { colorMap } from '../data/products';

export default function ProductCard({ product, onOpenModal, onAddToCart }) {
    const [selectedColor, setSelectedColor] = useState(product.colors[0]);
    const monthlyPrice = (product.price / 12).toFixed(2);

    return (
        <div className="group bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:shadow-xl transition duration-300 flex flex-col justify-between">
            <div>
                {/* Image Header */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span
                        className={`absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-semibold ${product.inStock
                                ? 'bg-[#1C1B18] text-white'
                                : 'bg-red-800 text-white'
                            }`}
                    >
                        {product.badge}
                    </span>
                    <span className="absolute bottom-3.5 right-3.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/90 backdrop-blur-xs text-[#1C1B18] shadow-xs">
                        Delivery: {product.delivery}
                    </span>
                </div>

                {/* Details Body */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7B56]">
                            {product.category}
                        </span>

                        {/* Interactive Colour Swatches */}
                        <div className="flex items-center space-x-1.5">
                            {product.colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    title={`Select ${color}`}
                                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${selectedColor === color
                                            ? 'ring-2 ring-offset-1 ring-[#9A7B56] border-stone-600'
                                            : 'border-stone-300 opacity-80 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: colorMap[color] || '#ccc' }}
                                />
                            ))}
                        </div>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-[#1C1B18] group-hover:text-[#9A7B56] transition">
                        {product.name}
                    </h3>

                    <p className="text-[11px] text-stone-500 mt-1">
                        Selected Finish: <strong className="text-stone-700">{selectedColor}</strong>
                    </p>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                        {product.dimensions[0]}
                    </p>

                    {/* Price & Finance */}
                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-baseline justify-between">
                        <div>
                            <span className="text-2xl font-bold text-[#1C1B18]">
                                £{product.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[11px] text-stone-500">
                                or £{monthlyPrice}/mo at 0% APR
                            </span>
                        </div>
                        <button
                            onClick={() => onOpenModal(product, selectedColor)}
                            className="text-xs font-semibold text-[#9A7B56] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            Dimensions & Specs &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 pb-6 pt-2 flex gap-2">
                <button
                    onClick={() => onAddToCart(product, selectedColor)}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition cursor-pointer ${product.inStock
                            ? 'bg-[#1C1B18] hover:bg-[#9A7B56] text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                >
                    {product.inStock ? 'Add to Selection' : 'Enquire Pre-Order'}
                </button>
                <button
                    onClick={() => onOpenModal(product, selectedColor)}
                    className="p-3 rounded-full border border-stone-200 hover:border-[#9A7B56] text-stone-700 transition cursor-pointer"
                    title="Quick View Specifications"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}