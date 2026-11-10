import { useState } from 'react';
import { Upload, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { validateSafeImageUrl } from '../../../utils/security';
import { compressImageFiles } from '../../../utils/image';
import { MAX_PHOTOS } from './productFormModel';
import { inputClass, panelClass, primaryButtonClass } from '../adminUi';

/** Step 2: photo gallery. Uploads are resized and compressed in the browser first. */
export default function PhotosStep({ form, update, onError }) {
    const [busy, setBusy] = useState(false);

    const addUrl = () => {
        const url = validateSafeImageUrl(form.imageInput);
        if (!url || url.startsWith('data:')) {
            onError('Please enter a valid https:// image link.');
            return;
        }
        if (form.images.length >= MAX_PHOTOS) {
            onError(`A product can have up to ${MAX_PHOTOS} photos.`);
            return;
        }
        onError('');
        update({ images: [...form.images, url], imageInput: '' });
    };

    const addFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (form.images.length + files.length > MAX_PHOTOS) {
            onError(`A product can have up to ${MAX_PHOTOS} photos.`);
            return;
        }
        setBusy(true);
        const { images, errors } = await compressImageFiles(files, 1600);
        setBusy(false);
        onError(errors[0] || '');
        if (images.length) update((prev) => ({ images: [...prev.images, ...images].slice(0, MAX_PHOTOS) }));
    };

    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= form.images.length) return;
        const next = [...form.images];
        [next[index], next[target]] = [next[target], next[index]];
        update({ images: next });
    };

    return (
        <div className={panelClass}>
            <div>
                <h4 className="font-sans text-sm font-bold text-[#1C1B18]">
                    Photos ({form.images.length} of {MAX_PHOTOS})
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                    The first photo is the cover shown in the catalogue. Use the arrows to reorder.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <input
                    type="url"
                    value={form.imageInput}
                    onChange={(e) => update({ imageInput: e.target.value })}
                    placeholder="Paste an https:// image link…"
                    aria-label="Image link"
                    className={`${inputClass} flex-1 min-w-[180px] w-auto`}
                />
                <button type="button" onClick={addUrl} className={primaryButtonClass}>
                    Add link
                </button>
                <label className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" aria-hidden="true" />
                    )}
                    {busy ? 'Preparing…' : 'Upload photos'}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={busy}
                        onChange={addFiles}
                        className="hidden"
                    />
                </label>
            </div>

            {form.images.length > 0 ? (
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {form.images.map((src, idx) => (
                        <li
                            key={`${idx}-${src.slice(-24)}`}
                            className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
                        >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-bold">
                                {idx === 0 ? 'Cover' : idx + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => update({ images: form.images.filter((_, i) => i !== idx) })}
                                aria-label={`Remove photo ${idx + 1}`}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-1 inset-x-1 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => move(idx, -1)}
                                    disabled={idx === 0}
                                    aria-label={`Move photo ${idx + 1} earlier`}
                                    className="bg-black/70 text-white rounded-full p-1 cursor-pointer disabled:opacity-30"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(idx, 1)}
                                    disabled={idx === form.images.length - 1}
                                    aria-label={`Move photo ${idx + 1} later`}
                                    className="bg-black/70 text-white rounded-full p-1 cursor-pointer disabled:opacity-30"
                                >
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="p-8 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-stone-300 text-sm text-stone-500">
                    No photos yet. Upload files or paste an image link above.
                </p>
            )}
        </div>
    );
}
