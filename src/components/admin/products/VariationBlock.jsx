import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { inputClass, panelClass, primaryButtonClass } from '../adminUi';

/**
 * One option group (sizes, fabrics, mattresses or lift options): preset chips
 * to toggle, a price adjustment per selected option, and an optional
 * "add your own" input that is saved to the library.
 */
export default function VariationBlock({
    title,
    presets,
    selected,
    deltas,
    onToggle,
    onDeltaChange,
    onAddCustom,
    onRemovePreset,
    manageMode,
    placeholder,
    children,
}) {
    const [custom, setCustom] = useState('');

    const addCustom = async () => {
        if (!custom.trim()) return;
        await onAddCustom(custom);
        setCustom('');
    };

    return (
        <div className={panelClass}>
            <h4 className="font-sans text-sm font-bold text-[#1C1B18]">
                {title} <span className="text-[#7D6242] font-normal">({selected.length} selected)</span>
            </h4>

            <div className="flex flex-wrap gap-1.5">
                {presets.map((item) => {
                    const active = selected.includes(item);
                    return (
                        <span key={item} className="inline-flex items-center">
                            <button
                                type="button"
                                aria-pressed={active}
                                onClick={() => onToggle(item)}
                                className={`px-2.5 py-1.5 text-xs border cursor-pointer transition flex items-center gap-1 ${
                                    manageMode ? 'rounded-l-lg border-r-0' : 'rounded-lg'
                                } ${
                                    active
                                        ? 'bg-[#1C1B18] text-white border-[#1C1B18] font-semibold'
                                        : 'bg-[#FAF8F5] text-stone-700 border-stone-300 hover:border-[#9A7B56]'
                                }`}
                            >
                                {active && <Check className="w-3 h-3 text-[#D4B895]" aria-hidden="true" />}
                                {item}
                            </button>
                            {manageMode && (
                                <button
                                    type="button"
                                    onClick={() => onRemovePreset(item)}
                                    aria-label={`Delete ${item} from saved presets`}
                                    className="px-1.5 py-1.5 rounded-r-lg bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </span>
                    );
                })}
            </div>

            {selected.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Price adjustment vs base price (£, may be negative)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selected.map((item) => (
                            <label
                                key={item}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                            >
                                <span className="font-semibold text-stone-700 truncate" title={item}>
                                    {item}
                                </span>
                                <span className="flex items-center gap-1 shrink-0">
                                    <span className="text-stone-500 font-bold">£</span>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="0"
                                        value={deltas[item] ?? ''}
                                        onChange={(e) => onDeltaChange(item, e.target.value)}
                                        aria-label={`Price adjustment for ${item}`}
                                        className="w-20 px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-sm font-bold text-right"
                                    />
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {onAddCustom && (
                <div className="flex gap-1.5">
                    <input
                        type="text"
                        value={custom}
                        maxLength={80}
                        onChange={(e) => setCustom(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustom();
                            }
                        }}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className={inputClass}
                    />
                    <button type="button" onClick={addCustom} disabled={!custom.trim()} className={primaryButtonClass}>
                        Add
                    </button>
                </div>
            )}

            {children}
        </div>
    );
}
