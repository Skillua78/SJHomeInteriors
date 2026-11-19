import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Layers, Ruler, Loader2, Sparkles, Download, AlertTriangle } from 'lucide-react';
import { api } from '../../../utils/api';
import { buildExportFile, downloadTextFile } from './importModel';
import { emptyForm, formToPayload, productToForm } from './productFormModel';
import { usePresetLibrary } from './usePresetLibrary';
import EssentialsStep from './EssentialsStep';
import PhotosStep from './PhotosStep';
import VariationsStep from './VariationsStep';
import DimensionsStep from './DimensionsStep';
import AiImportModal from './AiImportModal';

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
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [manageMode, setManageMode] = useState(false);
    const [showAiImport, setShowAiImport] = useState(false);

    useEffect(() => {
        setError('');
        setNotice('');
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
    const defaultAssemblyFee = Number(siteSettings?.assemblyFee ?? 50);
    const dirty = Boolean(editing || form.name || form.images.length);

    /** The live product with this id, or null (ids from a JSON export update instead of duplicating). */
    const findExisting = async (id) => {
        if (!id) return null;
        try {
            return await api.getProduct(id, { fresh: true });
        } catch {
            return null;
        }
    };

    const exportCurrent = () => {
        const result = formToPayload({ ...form, isHidden: true }, editing.id);
        // Export what is in the form (including unsaved edits) in the import format.
        const product = result.ok
            ? {
                  ...result.payload,
                  isHidden: form.isHidden,
                  priceNeedsReview: form.priceNeedsReview,
                  assemblyFeeOverride: result.payload.assemblyFeeOverride,
              }
            : editing;
        const slug = (product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        downloadTextFile(`sj-product-${slug}.json`, buildExportFile([product]));
    };

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
        setNotice('');
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
        <>
            <form
                onSubmit={handleSubmit}
                className="bg-cream p-4 sm:p-5 rounded-3xl border border-stone-200 flex flex-col gap-4"
            >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3">
                    <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-bronze-deep">
                            {editing ? 'Editing' : target?.duplicate ? 'New copy' : 'New product'}
                        </span>
                        <h3 className="font-serif text-xl font-semibold text-ink truncate">
                            {form.name || 'Add a furniture item'}
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAiImport(true)}
                            className="px-3 py-1.5 rounded-full bg-bronze-strong hover:bg-bronze-strong text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> AI / JSON Import
                        </button>
                        <button
                            type="button"
                            aria-pressed={manageMode}
                            onClick={() => setManageMode(!manageMode)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition ${manageMode
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                                }`}
                        >
                            {manageMode ? 'Done removing presets' : 'Remove saved presets'}
                        </button>
                        {editing && (
                            <button
                                type="button"
                                onClick={exportCurrent}
                                title="Download this product as a JSON file you can edit and import again"
                                className="px-3 py-1.5 rounded-full bg-white text-stone-700 border border-stone-300 hover:border-stone-500 text-[11px] font-bold flex items-center gap-1.5 transition"
                            >
                                <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export JSON
                            </button>
                        )}
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
                    <div
                        role="alert"
                        className="text-sm text-red-800 bg-red-50 p-3 rounded-xl border border-red-200"
                    >
                        {error}
                    </div>
                )}

                {form.priceNeedsReview && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-sm text-amber-950 flex flex-wrap items-start gap-3">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
                        <div className="flex-1 min-w-[12rem]">
                            <p className="font-semibold">Price to check</p>
                            <p className="text-xs mt-0.5">
                                This price ({form.price ? `£${form.price}` : 'none'}) was estimated during import, so the
                                product is kept hidden. Set the real price, then confirm it.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!(parseFloat(form.price) > 0)) {
                                    setError('Enter the price first.');
                                    setStep('basics');
                                    return;
                                }
                                setError('');
                                update({ priceNeedsReview: false });
                            }}
                            className="min-h-10 px-4 rounded-xl bg-ink hover:bg-bronze-strong text-white text-xs font-semibold"
                        >
                            Price is correct
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="text-xs font-medium text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200"
                    >
                        {notice}
                    </div>
                )}

                <div
                    role="tablist"
                    aria-label="Product form steps"
                    className="grid grid-cols-4 gap-1 bg-white p-1 rounded-2xl border border-stone-200"
                >
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
                                className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${active
                                        ? 'bg-ink text-white'
                                        : 'text-stone-600 hover:bg-stone-100'
                                    }`}
                            >
                                <Icon
                                    className="w-3.5 h-3.5 shrink-0 hidden sm:block"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    {idx + 1}. {item.label}
                                    {item.id === 'photos' && form.images.length > 0
                                        ? ` (${form.images.length})`
                                        : ''}
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
                        defaultAssemblyFee={defaultAssemblyFee}
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
                    className="w-full py-3.5 rounded-full bg-ink hover:bg-bronze-strong disabled:bg-stone-400 text-white text-sm font-semibold transition cursor-pointer shadow-md flex items-center justify-center gap-2 mt-auto"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
                </button>
            </form>

            <AiImportModal
                isOpen={showAiImport}
                onClose={() => setShowAiImport(false)}
                library={library}
                onLoadIntoEditor={async (product, additions) => {
                    // Save any new category / colours first so the form's pickers include them.
                    await library.registerImported(additions);
                    const existing = await findExisting(product.id);
                    setError('');
                    setForm(productToForm({ ...product, id: existing ? product.id : undefined }));
                    setEditing(existing);
                    setStep('basics');
                    setNotice(
                        existing
                            ? `Loaded changes for “${product.name}”. Check them, then press Save changes.`
                            : `Loaded “${product.name}”. Check each step, add photos, then press Add product.`
                    );
                }}
                onSaveAll={async (products, additions) => {
                    await library.registerImported(additions);
                    setError('');
                    let created = 0;
                    let updated = 0;
                    let hidden = 0;
                    for (const product of products) {
                        // eslint-disable-next-line no-await-in-loop
                        const existing = await findExisting(product.id);
                        const converted = formToPayload(productToForm(product), existing ? product.id : null);
                        // New products keep the file's id (when free), so importing the same file
                        // again after a failure updates them instead of adding duplicates.
                        if (converted.ok && !existing && product.id) converted.payload.id = product.id;
                        const done = created + updated;
                        if (!converted.ok) {
                            throw new Error(
                                `Imported ${done} of ${products.length}. Stopped at “${product.name}”: ${converted.error}`
                            );
                        }
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            await onSave(converted.payload, existing);
                        } catch (err) {
                            throw new Error(
                                `Imported ${done} of ${products.length}. Stopped at “${product.name}”: ${err.message}${
                                    products.some((p) => p.id)
                                        ? ' Fix the problem and import the same file again: products already added will be updated, not duplicated.'
                                        : ''
                                }`
                            );
                        }
                        if (existing) updated += 1;
                        else created += 1;
                        if (converted.payload.isHidden) hidden += 1;
                    }
                    const parts = [];
                    if (created) parts.push(`added ${created}`);
                    if (updated) parts.push(`updated ${updated}`);
                    setNotice(
                        `Import done: ${parts.join(', ')}.${
                            hidden
                                ? ` ${hidden} ${hidden === 1 ? 'is' : 'are'} hidden from the website - filter the list by “Hidden from website” to review prices and publish.`
                                : ''
                        }`
                    );
                }}
            />
        </>
    );
}