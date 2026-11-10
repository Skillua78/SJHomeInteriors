import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Layers, Ruler, Loader2 } from 'lucide-react';
import { emptyForm, formToPayload, productToForm } from './productFormModel';
import { usePresetLibrary } from './usePresetLibrary';
import EssentialsStep from './EssentialsStep';
import PhotosStep from './PhotosStep';
import VariationsStep from './VariationsStep';
import DimensionsStep from './DimensionsStep';

const STEPS = [
    { id: 'basics', label: 'Essentials', icon: FileText },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'variations', label: 'Options', icon: Layers },
    { id: 'dimensions', label: 'Dimensions', icon: Ruler },
];

/**
 * Add / edit product form. Owns the form state; each step is its own
 * component and all conversion to the API shape lives in productFormModel.
 *
 * @param target  { product, duplicate } to load into the form, or null for a blank form
 * @param onSave  async (payload, originalProduct|null) => void  (throws on failure)
 */
export default function ProductEditor({
    target,
    onSave,
    onDone,
    siteSettings,
    saveSettings,
    facets,
}) {
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null); // the product being edited, or null when adding
    const [step, setStep] = useState('basics');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [manageMode, setManageMode] = useState(false);

    useEffect(() => {
        setError('');
        setStep('basics');
        if (target?.product) {
            setForm(productToForm(target.product, { duplicate: target.duplicate }));
            setEditing(target.duplicate ? null : target.product);
        } else {
            setForm(emptyForm());
            setEditing(null);
        }
    }, [target]);

    const update = (patch) =>
        setForm((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));

    const library = usePresetLibrary({ siteSettings, saveSettings, facets, form });
    const defaultDeliveryFee = Number(siteSettings?.defaultDeliveryFee ?? 50);
    const dirty = Boolean(editing || form.name || form.images.length);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        const result = formToPayload(form, editing?.id);
        if (!result.ok) {
            setError(result.error);
            setStep(result.section);
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(result.payload, editing);
            onDone();
        } catch (err) {
            setError(err.message || 'The product could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-[#FAF8F5] p-4 sm:p-5 rounded-3xl border border-stone-200 flex flex-col gap-4"
        >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B56]">
                        {editing ? 'Editing' : target?.duplicate ? 'New copy' : 'New product'}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#1C1B18] truncate">
                        {form.name || 'Add a furniture item'}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-pressed={manageMode}
                        onClick={() => setManageMode(!manageMode)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition ${
                            manageMode
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                        }`}
                    >
                        {manageMode ? 'Done removing presets' : 'Remove saved presets'}
                    </button>
                    {dirty && (
                        <button
                            type="button"
                            onClick={onDone}
                            className="px-3 py-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold cursor-pointer"
                        >
                            {editing ? 'Cancel edit' : 'Clear'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div role="alert" className="text-sm text-red-800 bg-red-50 p-3 rounded-xl border border-red-200">
                    {error}
                </div>
            )}

            <div role="tablist" aria-label="Product form steps" className="grid grid-cols-4 gap-1 bg-white p-1 rounded-2xl border border-stone-200">
                {STEPS.map((item, idx) => {
                    const Icon = item.icon;
                    const active = step === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setStep(item.id)}
                            className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                                active ? 'bg-[#1C1B18] text-white' : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:block" aria-hidden="true" />
                            <span className="truncate">
                                {idx + 1}. {item.label}
                                {item.id === 'photos' && form.images.length > 0 ? ` (${form.images.length})` : ''}
                            </span>
                        </button>
                    );
                })}
            </div>

            {step === 'basics' && (
                <EssentialsStep
                    form={form}
                    update={update}
                    library={library}
                    manageMode={manageMode}
                    defaultDeliveryFee={defaultDeliveryFee}
                />
            )}
            {step === 'photos' && <PhotosStep form={form} update={update} onError={setError} />}
            {step === 'variations' && (
                <VariationsStep
                    form={form}
                    update={update}
                    library={library}
                    customColors={siteSettings?.customColors}
                    manageMode={manageMode}
                />
            )}
            {step === 'dimensions' && <DimensionsStep form={form} update={update} />}

            <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-400 text-white text-sm font-semibold transition cursor-pointer shadow-md flex items-center justify-center gap-2 mt-auto"
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
            </button>
        </form>
    );
}
