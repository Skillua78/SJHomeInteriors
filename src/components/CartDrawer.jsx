import { X, Trash2 } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onRemoveItem }) {
    if (!isOpen) return null;

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="fixed inset-0 z-50">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between p-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <div>
                        <h3 className="font-serif text-2xl font-bold">Your Selection</h3>
                        <p className="text-xs text-stone-500">
                            Reserve online for 2–10 day delivery or showroom viewing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-stone-100 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
                    {cart.length === 0 ? (
                        <p className="text-xs text-stone-400 text-center py-12">
                            Your selection is currently empty.
                        </p>
                    ) : (
                        cart.map((item, idx) => (
                            <div
                                key={`${item.id}-${idx}`}
                                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/70"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-[#1C1B18]">{item.name}</h4>
                                    <p className="text-[11px] text-stone-600">
                                        Colour: <strong>{item.selectedColor}</strong>
                                    </p>
                                    <p className="text-xs text-[#9A7B56] font-semibold mt-0.5">
                                        £{item.price.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemoveItem(idx)}
                                    className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Summary Footer */}
                <div className="pt-4 border-t border-stone-200 space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Two-Person Room Assembly</span>
                        <span className="font-semibold text-emerald-700">Included</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total Estimate</span>
                        <span>
                            £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <button
                        onClick={() =>
                            alert(
                                `Thank you! Your SJ Home Interiors enquiry (£${total.toFixed(
                                    2
                                )}) is ready.`
                            )
                        }
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] disabled:bg-stone-300 text-white font-semibold text-sm transition shadow-lg cursor-pointer"
                    >
                        Proceed to Checkout / Book Delivery
                    </button>
                </div>
            </div>
        </div>
    );
}