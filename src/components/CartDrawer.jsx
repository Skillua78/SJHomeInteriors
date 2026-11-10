import { useEffect } from 'react';
import { X, Trash2, ArrowRight, Plus, Minus, ShoppingBag } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { cartTotals, MAX_QTY_PER_LINE } from '../utils/catalogModel';
import { formatGBP } from '../../shared/pricing.js';

export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    onUpdateQty,
    onRemoveItem,
    onGoToBasketPage,
}) {
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const totals = cartTotals(cart, 'delivery');

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your basket">
            <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
                    <h2 className="font-serif text-2xl font-bold">Your basket</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close basket"
                        className="p-2 rounded-full hover:bg-stone-100 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="text-center py-16 text-stone-500 space-y-3">
                            <ShoppingBag className="w-9 h-9 mx-auto text-stone-300" aria-hidden="true" />
                            <p className="text-sm">Your basket is empty.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.key}
                                className="flex gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/70"
                            >
                                <img
                                    src={validateSafeImageUrl(item.image) || undefined}
                                    alt=""
                                    className="w-16 h-16 rounded-xl object-cover bg-stone-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#1C1B18] leading-snug">{item.name}</p>
                                    {item.label && item.label !== 'Standard' && (
                                        <p className="text-xs text-stone-600 mt-0.5">{item.label}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onUpdateQty(item.key, -1)}
                                                aria-label={`Decrease quantity of ${item.name}`}
                                                className="w-7 h-7 rounded-full bg-white border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">
                                                {item.qty}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onUpdateQty(item.key, 1)}
                                                disabled={item.qty >= MAX_QTY_PER_LINE}
                                                aria-label={`Increase quantity of ${item.name}`}
                                                className="w-7 h-7 rounded-full bg-white border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer disabled:opacity-30"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-sm font-bold text-[#1C1B18]">
                                            {formatGBP(item.unitPrice * item.qty)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.key)}
                                    aria-label={`Remove ${item.name}`}
                                    className="text-stone-400 hover:text-red-600 p-1 self-start cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-5 py-4 border-t border-stone-200 space-y-3 bg-white">
                    {cart.length > 0 && (
                        <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-stone-600">Items</dt>
                                <dd className="font-semibold">{formatGBP(totals.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-stone-600">Delivery &amp; assembly</dt>
                                <dd className="font-semibold">{formatGBP(totals.delivery)}</dd>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-1.5 border-t border-stone-200">
                                <dt>Total</dt>
                                <dd>{formatGBP(totals.total)}</dd>
                            </div>
                            <p className="text-[11px] text-stone-500">
                                No delivery charge if you collect from our Maltby showroom.
                            </p>
                        </dl>
                    )}

                    <button
                        type="button"
                        onClick={onGoToBasketPage}
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-300 text-white font-semibold text-sm transition shadow-lg cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Checkout <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                        Continue shopping
                    </button>
                </div>
            </div>
        </div>
    );
}
