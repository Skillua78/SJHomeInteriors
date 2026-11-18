import { useMemo, useState } from 'react';
import { X, Copy, Check, Upload, Sparkles, FileJson, PlusCircle, Layers, Loader2 } from 'lucide-react';
import { buildAiPrompt, describeAdditions, prepareImport } from './importModel';

/**
 * Import products from AI-formatted JSON. New categories, subcategories,
 * colours and finishes found in the import are added to the shop's library
 * automatically (the summary under the text box shows what will be added).
 *
 * @param library            from usePresetLibrary (taxonomy, colorNames)
 * @param onLoadIntoEditor   async (product, additions) => void
 * @param onSaveAll          async (products, additions) => void   (throws with a clear message)
 */
export default function AiImportModal({ isOpen, onClose, library, onLoadIntoEditor, onSaveAll }) {
    const [jsonText, setJsonText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const prompt = useMemo(
        () => buildAiPrompt({ categories: Object.keys(library.taxonomy), colours: library.colorNames }),
        [library.taxonomy, library.colorNames]
    );

    // Live preview of what the pasted JSON contains.
    const preview = useMemo(
        () => (jsonText.trim() ? prepareImport(jsonText, library) : null),
        [jsonText, library]
    );

    if (!isOpen) return null;

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            setError('Your browser blocked copying. Select the prompt text manually instead.');
        }
    };

    const readFile = (e) => {
        setError('');
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('That file is too large (2 MB maximum).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setJsonText(String(ev.target?.result || ''));
        reader.onerror = () => setError('The file could not be read.');
        reader.readAsText(file);
    };

    const run = async (action) => {
        const result = prepareImport(jsonText, library);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        setBusy(true);
        setError('');
        try {
            await action(result);
            setJsonText('');
            onClose();
        } catch (err) {
            setError(err.message || 'The import could not be completed.');
        } finally {
            setBusy(false);
        }
    };

    const additionsText = preview?.ok ? describeAdditions(preview.additions, library.taxonomy) : '';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Import products from AI or JSON"
            onClick={busy ? undefined : onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-bronze-deep flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Quick import
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-ink mt-0.5">
                            Import products with AI or a JSON file
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close import"
                        className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-cream border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-sans text-sm font-bold text-ink">1. Copy the AI prompt</h4>
                        <p className="text-xs text-stone-600 mt-0.5">
                            Paste it into ChatGPT, Claude or Gemini with your supplier notes. It already
                            lists your current categories and colours, and tells the AI how to add new
                            categories, colours and finishes.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={copyPrompt}
                        className="px-3.5 py-2.5 rounded-xl bg-ink hover:bg-bronze-strong text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {copied ? 'Copied' : 'Copy AI prompt & schema'}
                    </button>
                </div>

                <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="import-json" className="text-sm font-bold text-ink flex items-center gap-1.5">
                            <FileJson className="w-4 h-4 text-bronze" aria-hidden="true" />
                            2. Paste the AI's answer, or upload a .json file
                        </label>
                        <label className="px-3.5 py-2 rounded-xl bg-cream border border-stone-300 hover:border-bronze text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-bronze" aria-hidden="true" /> Upload .json
                            <input type="file" accept=".json,application/json" onChange={readFile} className="hidden" />
                        </label>
                    </div>

                    <textarea
                        id="import-json"
                        rows={8}
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            setError('');
                        }}
                        placeholder="Paste the JSON here…"
                        className="w-full p-3.5 rounded-2xl bg-cream border border-stone-300 font-mono text-xs text-stone-800 focus:outline-none focus:border-bronze"
                    />

                    {preview?.ok && (
                        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                            <p className="font-semibold">
                                Ready to import {preview.products.length}{' '}
                                {preview.products.length === 1 ? 'product' : 'products'}:{' '}
                                {preview.products
                                    .slice(0, 4)
                                    .map((p) => p.name)
                                    .join(', ')}
                                {preview.products.length > 4 ? '…' : ''}
                            </p>
                            {additionsText && <p>Will also add to your library — {additionsText}.</p>}
                        </div>
                    )}
                    {preview && !preview.ok && !error && (
                        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            {preview.error}
                        </p>
                    )}

                    <p className="text-xs text-stone-500">
                        Products without photos show a placeholder picture until you add your own in the
                        Photos step.
                    </p>
                </div>

                {error && (
                    <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                    <button
                        type="button"
                        onClick={() => run((r) => onLoadIntoEditor(r.products[0], r.additions))}
                        disabled={busy || !preview?.ok}
                        className="py-3 px-4 rounded-2xl bg-cream hover:bg-stone-200/70 border border-stone-300 text-ink text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusCircle className="w-4 h-4 text-bronze" aria-hidden="true" />
                        Review {preview?.ok && preview.products.length > 1 ? 'the first one ' : ''}in the form
                    </button>
                    <button
                        type="button"
                        onClick={() => run((r) => onSaveAll(r.products, r.additions))}
                        disabled={busy || !preview?.ok}
                        className="py-3 px-4 rounded-2xl bg-ink hover:bg-bronze-strong text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md disabled:bg-stone-400 disabled:cursor-not-allowed"
                    >
                        {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Layers className="w-4 h-4" aria-hidden="true" />
                        )}
                        {busy
                            ? 'Importing…'
                            : `Save ${preview?.ok ? preview.products.length : ''} straight to the catalogue`}
                    </button>
                </div>
            </div>
        </div>
    );
}
