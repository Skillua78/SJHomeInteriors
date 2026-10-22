import { useState, useEffect } from 'react';
import { X, Ruler, Check } from 'lucide-react';
import { colorMap } from '../data/products';

export default function SpecModal({ modalData, onClose, onAddToCart }) {
    const [chosenColor, setChosenColor] = useState('');

    useEffect(() => {
        if (modalData?.product) {
            setChosenColor(modalData.initialColor || modalData.product.colors[0]);
        }
    }, [modalData]);

    if (!modalData?.product) return null;

    const { product } = modalData;
    const monthly = (product.price / 12).toFixed(2);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left Image */}
                    <div className="relative bg-stone-100 h-64 md:h-auto">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1C1B18] text-white">
                            {product.badge}
                        </span>
                    </div>

                    {/* Right Specifications */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-serif text-2xl font-bold text-[#1C1B18]">
                                    {product.name}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-2xl font-bold text-[#9A7B56]">
                                    £{product.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-stone-500">
                                    0% Finance: £{monthly} / month
                                </span>
                            </div>

                            {/* Colour Selector */}
                            <div className="mt-4">
                                <span className="text-xs font-semibold text-stone-700 block mb-2">
                                    Upholstery Colour: <span className="text-[#9A7B56]">{chosenColor}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setChosenColor(color)}
                                            className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 cursor-pointer transition ${chosenColor === color
                                                    ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                    : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                }`}
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full border border-white/30"
                                                style={{ backgroundColor: colorMap[color] || '#ccc' }}
                                            />
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions Box */}
                            <div className="mt-5 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] flex items-center gap-1.5 mb-2.5">
                                    <Ruler className="w-4 h-4 text-[#9A7B56]" /> Exact Dimensions
                                </h4>
                                <ul className="space-y-1.5 text-xs text-stone-700">
                                    {product.dimensions.map((dim, i) => (
                                        <li key={i}>&bull; {dim}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Features List */}
                            <div className="mt-5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-2.5">
                                    Key Specifications & Delivery
                                </h4>
                                <ul className="space-y-1.5 text-xs text-stone-600">
                                    {product.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-1.5">
                                            <Check className="w-3.5 h-3.5 text-[#9A7B56] shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-stone-200">
                            <button
                                onClick={() => {
                                    onAddToCart(product, chosenColor);
                                    onClose();
                                }}
                                className="w-full py-3.5 px-6 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                                Add ({chosenColor}) to Showroom Enquiry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}