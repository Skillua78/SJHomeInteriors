import { Trash2, Plus, Minus } from 'lucide-react';
import { validateSafeImageUrl } from '../../utils/security';
import { formatGBP } from '../../../shared/pricing.js';
import { MAX_QTY_PER_LINE } from '../../utils/catalogModel';

export default function BasketLines({ cart, onUpdateQty, onRemoveItem }) {
    return (
        <ul className="space-y-3">
            {cart.map((item) => (
                <li
                    key={item.key}
                    className="p-4 rounded-2xl bg-white border border-stone-200 flex gap-4"
                >
                    <img
                        src={validateSafeImageUrl(item.image) || undefined}
                        alt=""
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-serif text-lg font-bold text-[#1C1B18] leading-snug">
                                    {item.name}
                                </p>
                                {item.label && item.label !== 'Standard' && (
                                    <p className="text-xs text-stone-500 mt-0.5">{item.label}</p>
                                )}
                            </div>
                            <p className="text-sm font-bold text-[#1C1B18] shrink-0">
                                {formatGBP(item.unitPrice * item.qty)}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-3">
                            <div className="flex items-center border border-stone-300 rounded-full bg-[#FAF8F5]">
                                <button
                                    type="button"
                                    onClick={() => onUpdateQty(item.key, -1)}
                                    aria-label={`Decrease quantity of ${item.name}`}
                                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:text-[#1C1B18] cursor-pointer"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center text-sm font-bold" aria-live="polite">
                                    {item.qty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onUpdateQty(item.key, 1)}
                                    disabled={item.qty >= MAX_QTY_PER_LINE}
                                    aria-label={`Increase quantity of ${item.name}`}
                                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:text-[#1C1B18] cursor-pointer disabled:opacity-30"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {item.qty > 1 && (
                                    <span className="text-xs text-stone-500">
                                        {formatGBP(item.unitPrice)} each
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.key)}
                                    aria-label={`Remove ${item.name} from basket`}
                                    className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
