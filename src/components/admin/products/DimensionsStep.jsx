import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { formatDualDimension } from './dimensions';
import { inputClass, labelClass, panelClass } from '../adminUi';

const FIELDS = [
    { key: 'length', label: 'Length', placeholder: 'e.g. 215 cm (7ft 1in)' },
    { key: 'width', label: 'Width', placeholder: 'e.g. 163 cm (5ft 4in)' },
    { key: 'depth', label: 'Depth / height', placeholder: 'e.g. 137 cm (4ft 6in)' },
];

/** Step 4: dimensions (default and per size) plus the key-features list. */
export default function DimensionsStep({ form, update }) {
    const [sizeKey, setSizeKey] = useState('default');
    const [calc, setCalc] = useState({ cm: '', ft: '', inches: '' });

    // The selected size may have been removed in step 3.
    const activeKey = sizeKey === 'default' || form.sizes.includes(sizeKey) ? sizeKey : 'default';
    const dims = form.structuredDimensions;
    const values = activeKey === 'default' ? dims.default : dims.bySize[activeKey] || {};

    const setDimension = (field, value) =>
        update((prev) => {
            const current = prev.structuredDimensions;
            if (activeKey === 'default') {
                return {
                    structuredDimensions: { ...current, default: { ...current.default, [field]: value } },
                };
            }
            return {
                structuredDimensions: {
                    ...current,
                    bySize: {
                        ...current.bySize,
                        [activeKey]: { ...(current.bySize[activeKey] || {}), [field]: value },
                    },
                },
            };
        });

    const applyConverted = (field) => {
        const formatted = formatDualDimension(calc.cm, calc.ft, calc.inches);
        if (!formatted) return;
        setDimension(field, formatted);
        setCalc({ cm: '', ft: '', inches: '' });
    };

    const tabClass = (active) =>
        `px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
            active ? 'bg-[#1C1B18] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }`;

    return (
        <div className="space-y-4">
            <div className={panelClass}>
                <h4 className="font-sans text-sm font-bold text-[#1C1B18] flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" /> Dimensions
                </h4>

                {form.sizes.length > 0 && (
                    <div>
                        <p className="text-xs text-stone-500 mb-1.5">
                            Set dimensions for all sizes, or pick a size to give it its own:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                aria-pressed={activeKey === 'default'}
                                onClick={() => setSizeKey('default')}
                                className={tabClass(activeKey === 'default')}
                            >
                                All sizes
                            </button>
                            {form.sizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    aria-pressed={activeKey === size}
                                    onClick={() => setSizeKey(size)}
                                    className={tabClass(activeKey === size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D6242]">
                        Unit converter - type cm or ft/in, then choose where to put it
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                        <input
                            type="number"
                            min="0"
                            value={calc.cm}
                            onChange={(e) => setCalc({ ...calc, cm: e.target.value })}
                            placeholder="cm"
                            aria-label="Centimetres"
                            className={inputClass}
                        />
                        <input
                            type="number"
                            min="0"
                            value={calc.ft}
                            onChange={(e) => setCalc({ ...calc, ft: e.target.value })}
                            placeholder="ft"
                            aria-label="Feet"
                            className={inputClass}
                        />
                        <input
                            type="number"
                            min="0"
                            value={calc.inches}
                            onChange={(e) => setCalc({ ...calc, inches: e.target.value })}
                            placeholder="in"
                            aria-label="Inches"
                            className={inputClass}
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {FIELDS.map((field) => (
                            <button
                                key={field.key}
                                type="button"
                                onClick={() => applyConverted(field.key)}
                                className="flex-1 py-2 px-2 rounded-lg bg-stone-800 hover:bg-[#9A7B56] text-white text-xs font-semibold cursor-pointer"
                            >
                                Set as {field.label.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {FIELDS.map((field) => (
                        <div key={field.key}>
                            <label htmlFor={`pf-dim-${field.key}`} className={labelClass}>
                                {field.label}
                            </label>
                            <input
                                id={`pf-dim-${field.key}`}
                                type="text"
                                maxLength={60}
                                value={values[field.key] || ''}
                                onChange={(e) => setDimension(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>

                <div>
                    <label htmlFor="pf-dim-custom" className={labelClass}>
                        Extra dimension notes
                    </label>
                    <input
                        id="pf-dim-custom"
                        type="text"
                        maxLength={200}
                        value={values.custom || ''}
                        onChange={(e) => setDimension('custom', e.target.value)}
                        placeholder="e.g. Sleeping area: 263 × 117 cm | Seat height: 45 cm"
                        className={inputClass}
                    />
                </div>
            </div>

            <div className={panelClass}>
                <label htmlFor="pf-features" className="font-sans text-sm font-bold text-[#1C1B18] block">
                    Key features (separate with commas)
                </label>
                <textarea
                    id="pf-features"
                    rows={3}
                    value={form.features}
                    onChange={(e) => update({ features: e.target.value })}
                    placeholder="e.g. Solid hardwood frame, Hydraulic gas-lift storage, High-density foam"
                    className={inputClass}
                />
            </div>
        </div>
    );
}
