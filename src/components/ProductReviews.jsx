import { useEffect, useState } from 'react';
import { Star, CheckCircle2, CornerDownRight, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { sanitizeText } from '../utils/security';
import StarRating from './ui/StarRating';

const SHOWN = 3;

/**
 * Reviews for one product inside the product view: average, the latest
 * approved reviews and a short form. New reviews wait for approval in
 * Admin -> Reviews before they appear.
 */
export default function ProductReviews({ product }) {
    const [data, setData] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState({ author: '', location: '', rating: 5, comment: '', consent: false });
    const [status, setStatus] = useState({ sending: false, error: '', sent: false });

    useEffect(() => {
        if (!product?.id) return undefined;
        let cancelled = false;
        setData(null);
        setShowAll(false);
        setFormOpen(false);
        setStatus({ sending: false, error: '', sent: false });
        api.getProductReviews(product.id)
            .then((result) => !cancelled && setData(result))
            .catch(() => !cancelled && setData({ items: [], stats: { count: 0, average: null } }));
        return () => {
            cancelled = true;
        };
    }, [product?.id]);

    if (!product?.id) return null;

    const submit = async (e) => {
        e.preventDefault();
        const author = sanitizeText(form.author, 60);
        const comment = sanitizeText(form.comment, 1000);
        if (!author || comment.length < 3) {
            setStatus({ sending: false, error: 'Please add your name and a few words about the product.', sent: false });
            return;
        }
        if (!form.consent) {
            setStatus({ sending: false, error: 'Please agree to your review being shown on our website.', sent: false });
            return;
        }
        setStatus({ sending: true, error: '', sent: false });
        try {
            await api.submitReview({
                productId: product.id,
                author,
                location: sanitizeText(form.location, 60),
                rating: form.rating,
                comment,
            });
            setStatus({ sending: false, error: '', sent: true });
            setFormOpen(false);
            setForm({ author: '', location: '', rating: 5, comment: '', consent: false });
        } catch (err) {
            setStatus({ sending: false, error: err.message, sent: false });
        }
    };

    const items = data?.items || [];
    const visible = showAll ? items : items.slice(0, SHOWN);
    const stats = data?.stats;
    const inputClass =
        'w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-base sm:text-sm focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20';

    return (
        <section aria-labelledby="product-reviews-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="product-reviews-title" className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                    Customer reviews
                </h3>
                {stats?.count > 0 && <StarRating value={stats.average} count={stats.count} size="md" />}
            </div>

            {!data && (
                <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading reviews…
                </p>
            )}

            {data && items.length === 0 && !status.sent && (
                <p className="text-sm text-stone-600">No reviews for this piece yet.</p>
            )}

            {visible.map((rev) => (
                <article key={rev.id} className="p-4 rounded-2xl bg-cream border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <StarRating value={rev.rating} />
                        <span className="text-xs text-stone-500">{rev.date}</span>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">“{rev.comment}”</p>
                    <p className="text-xs text-stone-600 flex flex-wrap items-center gap-x-2">
                        <strong className="text-ink">{rev.author}</strong>
                        {rev.location && <span>{rev.location}</span>}
                        <span className="inline-flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Verified buyer
                        </span>
                    </p>
                    {rev.adminResponse && (
                        <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700">
                            <p className="font-semibold text-ink flex items-center gap-1 mb-0.5">
                                <CornerDownRight className="w-3.5 h-3.5 text-bronze" aria-hidden="true" /> SJ Home
                                Interiors replied
                            </p>
                            {rev.adminResponse}
                        </div>
                    )}
                </article>
            ))}

            <div className="flex flex-wrap gap-2">
                {items.length > SHOWN && (
                    <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="min-h-11 px-4 rounded-full border border-stone-300 hover:border-ink text-sm font-semibold"
                    >
                        {showAll ? 'Show fewer' : `Show all ${items.length} reviews`}
                    </button>
                )}
                {!formOpen && (
                    <button
                        type="button"
                        onClick={() => {
                            setFormOpen(true);
                            setStatus({ sending: false, error: '', sent: false });
                        }}
                        className="min-h-11 px-4 rounded-full border border-stone-300 hover:border-ink text-sm font-semibold"
                    >
                        Review this product
                    </button>
                )}
            </div>

            {status.sent && (
                <p role="status" className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    Thank you - your review will appear once our team has checked it.
                </p>
            )}

            {formOpen && (
                <form onSubmit={submit} noValidate className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                    <fieldset>
                        <legend className="text-xs font-semibold text-stone-700 mb-1">Your rating</legend>
                        <div className="flex" role="radiogroup" aria-label="Star rating">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    role="radio"
                                    aria-checked={form.rating === n}
                                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                                    onClick={() => setForm({ ...form, rating: n })}
                                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-stone-100"
                                >
                                    <Star
                                        className={`w-6 h-6 ${n <= form.rating ? 'text-amber-500 fill-current' : 'text-stone-300'}`}
                                        aria-hidden="true"
                                    />
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-stone-700">
                            Name *
                            <input
                                className={`${inputClass} mt-1`}
                                maxLength={60}
                                value={form.author}
                                onChange={(e) => setForm({ ...form, author: e.target.value })}
                            />
                        </label>
                        <label className="text-xs font-semibold text-stone-700">
                            Town (optional)
                            <input
                                className={`${inputClass} mt-1`}
                                maxLength={60}
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                            />
                        </label>
                    </div>
                    <label className="block text-xs font-semibold text-stone-700">
                        Your review *
                        <textarea
                            rows={3}
                            maxLength={1000}
                            className={`${inputClass} mt-1`}
                            value={form.comment}
                            onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        />
                    </label>
                    <label className="flex items-start gap-2 text-xs text-stone-600">
                        <input
                            type="checkbox"
                            checked={form.consent}
                            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                            className="mt-0.5 w-4 h-4 accent-ink"
                        />
                        I agree to my name, town and review being shown on this website.
                    </label>
                    {status.error && (
                        <p role="alert" className="text-sm text-red-800">
                            {status.error}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={status.sending}
                            className="press min-h-11 px-5 rounded-full bg-ink hover:bg-bronze-strong disabled:bg-stone-400 text-white text-sm font-semibold"
                        >
                            {status.sending ? 'Sending…' : 'Submit review'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormOpen(false)}
                            className="min-h-11 px-4 rounded-full text-sm font-semibold text-stone-700 hover:bg-stone-100"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
