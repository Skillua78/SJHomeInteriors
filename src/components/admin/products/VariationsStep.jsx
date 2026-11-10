import { useMemo, useState } from 'react';
import { getCategoryVariationConfig } from '../../../data/products';
import { sanitizeText } from '../../../utils/security';
import ColourPicker from './ColourPicker';
import VariationBlock from './VariationBlock';
import { formatDualDimension } from './dimensions';
import { inputClass, primaryButtonClass } from '../adminUi';

const BLOCKS = [
    { field: 'sizes', flag: 'showSizes', title: 'Sizes' },
    {
        field: 'fabrics',
        flag: 'showFabrics',
        title: 'Upholstery fabrics',
        placeholder: 'Add a fabric (e.g. Bouclé, Chenille)…',
    },
    {
        field: 'mattresses',
        flag: 'showMattresses',
        title: 'Mattress options',
        placeholder: 'Add a mattress option…',
    },
    {
        field: 'liftOptions',
        flag: 'showLiftOptions',
        title: 'Ottoman lift / storage options',
        placeholder: 'Add a lift or storage option…',
    },
];

/** Builds a size label in both units, e.g. "King — 150 cm (4ft 11in)". */
function SizeBuilder({ onAdd }) {
    const [label, setLabel] = useState('');
    const [ft, setFt] = useState('');
    const [inches, setInches] = useState('');
    const [cm, setCm] = useState('');

    const add = async () => {
        const dual = formatDualDimension(cm, ft, inches);
        const name = sanitizeText(label.trim(), 40);
        const combined = name && dual ? `${name} — ${dual}` : name || dual;
        if (!combined) return;
        await onAdd(combined);
        setLabel('');
        setFt('');
        setInches('');
        setCm('');
    };

    return (
        <div className="pt-3 border-t border-stone-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Add a custom size (enter cm, ft/in, or both - the other unit is filled in)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Name (e.g. King)"
                    aria-label="Size name"
                    className={`${inputClass} col-span-2`}
                />
                <input
                    type="number"
                    min="0"
                    value={ft}
                    onChange={(e) => setFt(e.target.value)}
                    placeholder="ft"
                    aria-label="Feet"
                    className={inputClass}
                />
                <input
                    type="number"
                    min="0"
                    value={inches}
                    onChange={(e) => setInches(e.target.value)}
                    placeholder="in"
                    aria-label="Inches"
                    className={inputClass}
                />
                <input
                    type="number"
                    min="0"
                    value={cm}
                    onChange={(e) => setCm(e.target.value)}
                    placeholder="cm"
                    aria-label="Centimetres"
                    className={`${inputClass} col-span-2 sm:col-span-1`}
                />
            </div>
            <button type="button" onClick={add} className={`${primaryButtonClass} w-full`}>
                Add size
            </button>
        </div>
    );
}

/** Step 3: colours plus the option groups relevant to the chosen category. */
export default function VariationsStep({ form, update, library, customColors, manageMode }) {
    const [showAll, setShowAll] = useState(false);
    const config = useMemo(
        () => getCategoryVariationConfig(form.category, form.subcategory),
        [form.category, form.subcategory]
    );

    const toggle = (field, value) =>
        update((prev) => ({
            [field]: prev[field].includes(value)
                ? prev[field].filter((x) => x !== value)
                : [...prev[field], value],
        }));

    const setDelta = (field, option, raw) =>
        update((prev) => {
            const group = { ...(prev.priceDeltas[field] || {}) };
            if (raw === '') delete group[option];
            else group[option] = Number.isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
            return { priceDeltas: { ...prev.priceDeltas, [field]: group } };
        });

    const addCustom = async (field, raw) => {
        const value = await library.savePreset(field, raw);
        if (!value) return;
        update((prev) => (prev[field].includes(value) ? {} : { [field]: [...prev[field], value] }));
    };

    const removePreset = async (field, value) => {
        update((prev) => ({ [field]: prev[field].filter((x) => x !== value) }));
        await library.removePreset(field, value);
    };

    return (
        <div className="space-y-4">
            <ColourPicker
                selected={form.selectedColors}
                onChange={(selectedColors) => update({ selectedColors })}
                library={library}
                customColors={customColors}
                manageMode={manageMode}
            />

            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <span>
                    Showing options for <strong>{form.category || 'all furniture'}</strong>
                </span>
                <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="font-bold text-[#7D6242] hover:underline cursor-pointer"
                >
                    {showAll ? 'Hide other option types' : 'Show every option type'}
                </button>
            </div>

            {BLOCKS.filter((block) => config[block.flag] || showAll).map((block) => (
                <VariationBlock
                    key={block.field}
                    title={block.title}
                    presets={library.presets[block.field]}
                    selected={form[block.field]}
                    deltas={form.priceDeltas[block.field] || {}}
                    onToggle={(value) => toggle(block.field, value)}
                    onDeltaChange={(option, raw) => setDelta(block.field, option, raw)}
                    onAddCustom={block.field === 'sizes' ? undefined : (raw) => addCustom(block.field, raw)}
                    onRemovePreset={(value) => removePreset(block.field, value)}
                    manageMode={manageMode}
                    placeholder={block.placeholder}
                >
                    {block.field === 'sizes' && <SizeBuilder onAdd={(value) => addCustom('sizes', value)} />}
                </VariationBlock>
            ))}
        </div>
    );
}
