import { useMemo, useState } from 'react';
import { Palette, X } from 'lucide-react';
import { resolveColorHex } from '../../../utils/colors';
import { inputClass, panelClass, primaryButtonClass } from '../adminUi';

/** Colours & finishes: pick from the library, or type a new one and save it for reuse. */
export default function ColourPicker({ selected, onChange, library, customColors, manageMode }) {
    const [query, setQuery] = useState('');
    const [hex, setHex] = useState('#8C8C8C');

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return library.colorNames;
        const starts = library.colorNames.filter((c) => c.toLowerCase().startsWith(q));
        const contains = library.colorNames.filter(
            (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q)
        );
        return [...starts, ...contains];
    }, [query, library.colorNames]);

    const toggle = (name) =>
        onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);

    const saveNew = async () => {
        const name = await library.saveColor(query, hex);
        if (!name) return;
        if (!selected.includes(name)) onChange([...selected, name]);
        setQuery('');
    };

    const removeFromLibrary = async (name) => {
        onChange(selected.filter((c) => c !== name));
        await library.removeColor(name);
    };

    const swatch = (name) => ({ backgroundColor: resolveColorHex(name, customColors) });

    return (
        <div className={panelClass}>
            <h4 className="font-sans text-sm font-bold text-[#1C1B18] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" />
                Colours &amp; finishes ({selected.length} selected)
            </h4>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-3 border-b border-stone-100">
                    {selected.map((name) => (
                        <span
                            key={name}
                            className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-[#1C1B18] text-white text-xs font-semibold"
                        >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/40" style={swatch(name)} />
                            {name}
                            <button
                                type="button"
                                onClick={() => toggle(name)}
                                aria-label={`Remove ${name}`}
                                className="hover:text-red-300 cursor-pointer p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveNew();
                        }
                    }}
                    placeholder="Filter, or type a new finish name…"
                    aria-label="Filter or add a colour"
                    className={`${inputClass} flex-1 min-w-[180px] w-auto`}
                />
                <input
                    type="color"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    aria-label="Swatch colour for a new finish"
                    className="w-10 h-10 rounded-lg border border-stone-300 cursor-pointer bg-white p-0.5"
                />
                <button type="button" onClick={saveNew} disabled={!query.trim()} className={primaryButtonClass}>
                    Save finish
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-0.5 custom-scrollbar">
                {suggestions.map((name) => {
                    const active = selected.includes(name);
                    return (
                        <span key={name} className="inline-flex items-center">
                            <button
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggle(name)}
                                className={`pl-2 pr-2.5 py-1 text-xs border flex items-center gap-1.5 cursor-pointer transition ${
                                    manageMode ? 'rounded-l-full border-r-0' : 'rounded-full'
                                } ${
                                    active
                                        ? 'border-[#9A7B56] bg-[#9A7B56]/15 text-[#1C1B18] font-bold'
                                        : 'border-stone-300 bg-[#FAF8F5] text-stone-700 hover:border-[#9A7B56]'
                                }`}
                            >
                                <span
                                    className="w-3.5 h-3.5 rounded-full border border-stone-400 shrink-0"
                                    style={swatch(name)}
                                />
                                {name}
                            </button>
                            {manageMode && (
                                <button
                                    type="button"
                                    onClick={() => removeFromLibrary(name)}
                                    aria-label={`Delete ${name} from the colour library`}
                                    className="px-1.5 py-1 rounded-r-full bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
