import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { sanitizeText } from '../../../utils/security';
import { inputClass, primaryButtonClass, sectionTitleClass } from '../adminUi';

/** Moderate customer reviews: publish, reply, delete. */
export default function ReviewsPanel({ reviews, onToggleVerify, onRespond, onDelete }) {
    const [drafts, setDrafts] = useState({});

    return (
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
            <h3 className={sectionTitleClass}>Customer reviews ({reviews.length})</h3>
            <p className="text-xs text-stone-600 -mt-2">
                Only mark a review “Verified buyer” when you have confirmed the customer bought from you.
                Unverified reviews are not shown on the site.
            </p>

            {reviews.length === 0 && (
                <p className="p-8 text-center text-sm text-stone-500 bg-[#FAF8F5] rounded-2xl border border-dashed border-stone-300">
                    No reviews have been submitted yet.
                </p>
            )}

            {reviews.map((rev) => {
                const draft = drafts[rev.id] ?? rev.adminResponse ?? '';
                return (
                    <article key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm">
                                <strong className="text-[#1C1B18]">{rev.author}</strong>
                                <span className="text-amber-700 font-bold ml-2">★ {rev.rating}/5</span>
                                <span className="text-stone-500 ml-2 text-xs">{rev.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-pressed={rev.verified}
                                    onClick={() => onToggleVerify(rev.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                        rev.verified
                                            ? 'bg-emerald-700 text-white'
                                            : 'bg-white border border-stone-300 text-stone-700'
                                    }`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    {rev.verified ? 'Published · verified buyer' : 'Verify & publish'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(rev.id)}
                                    className="px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-stone-700 bg-white p-3 rounded-xl border border-stone-200">
                            “{rev.comment}”
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                maxLength={500}
                                value={draft}
                                onChange={(e) => setDrafts({ ...drafts, [rev.id]: e.target.value })}
                                placeholder="Write a public reply from SJ Home Interiors…"
                                aria-label={`Reply to ${rev.author}`}
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => onRespond(rev.id, sanitizeText(draft, 500))}
                                className={`${primaryButtonClass} shrink-0`}
                            >
                                Save reply
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
