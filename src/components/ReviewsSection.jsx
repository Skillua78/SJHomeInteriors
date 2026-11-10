import { useState } from 'react';
import { Star, Upload, CheckCircle2, X, ShieldCheck, CornerDownRight, AlertCircle } from 'lucide-react';
import { sanitizeText, validateSafeImageUrl } from '../utils/security';
import { compressImageFiles } from '../utils/image';

export default function ReviewsSection({
    reviews,
    stats,
    onAddReview,
    products = [],
    currentUser,
    onOpenAdmin,
}) {
    const [showForm, setShowForm] = useState(false);
    const [lightboxImg, setLightboxImg] = useState(null);
    const [author, setAuthor] = useState('');
    const [location, setLocation] = useState(''); // Default empty (no auto-filled Rotherham)
    const [rating, setRating] = useState(5);
    const [productName, setProductName] = useState(''); // Default empty ("Select a product (Optional)")
    const [comment, setComment] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [gdprConsent, setGdprConsent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [thanks, setThanks] = useState(false);

    // The headline rating is calculated from verified reviews only - never hard-coded.
    const reviewCount = stats?.count ?? reviews.filter((r) => r.verified).length;
    const average = stats?.average ?? null;
    const visibleReviews = currentUser?.role === 'admin' ? reviews : reviews.filter((r) => r.verified);

    const handleImageUpload = async (e) => {
        setErrorMsg('');
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (uploadedImages.length + files.length > 3) {
            setErrorMsg('You may attach up to 3 photos per review.');
            return;
        }
        const { images, errors } = await compressImageFiles(files, 1200);
        if (errors.length) setErrorMsg(errors[0]);
        if (images.length) setUploadedImages((prev) => [...prev, ...images].slice(0, 3));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanAuthor = sanitizeText(author, 60);
        const cleanComment = sanitizeText(comment, 1000);

        if (!cleanAuthor || cleanComment.length < 3) {
            setErrorMsg('Please enter your display name and review comment.');
            return;
        }
        if (!gdprConsent) {
            setErrorMsg('Please confirm consent to publish your review and any attached images.');
            return;
        }

        setSubmitting(true);
        const result = await onAddReview({
            author: cleanAuthor,
            location: sanitizeText(location, 60),
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            productName: sanitizeText(productName, 120),
            comment: cleanComment,
            images: uploadedImages,
        });
        setSubmitting(false);

        if (!result?.ok) {
            setErrorMsg(result?.error || 'Your review could not be submitted. Please try again.');
            return;
        }

        setAuthor('');
        setLocation('');
        setProductName('');
        setComment('');
        setUploadedImages([]);
        setGdprConsent(false);
        setShowForm(false);
        setThanks(true);
    };

    return (
        <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-stone-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        What our customers say
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                        Customer Reviews
                    </h2>
                    {reviewCount > 0 && average !== null && (
                        <div className="flex items-center gap-2 mt-2">
                            <div
                                className="flex text-amber-500"
                                role="img"
                                aria-label={`Rated ${average.toFixed(1)} out of 5`}
                            >
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                            i < Math.round(average) ? 'fill-current' : 'text-stone-300'
                                        }`}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-semibold text-stone-700">
                                {average.toFixed(1)} out of 5 · {reviewCount}{' '}
                                {reviewCount === 1 ? 'verified review' : 'verified reviews'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {currentUser?.role === 'admin' && (
                        <button
                            type="button"
                            onClick={onOpenAdmin}
                            className="px-4 py-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition cursor-pointer"
                        >
                            Moderate Reviews (Admin)
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setShowForm(!showForm);
                            setThanks(false);
                        }}
                        className="px-6 py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                    >
                        {showForm ? 'Cancel' : 'Write a review'}
                    </button>
                </div>
            </div>

            {thanks && (
                <div
                    role="status"
                    className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2"
                >
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Thank you! Your review has been sent to our team and will appear once it has been
                    checked.
                </div>
            )}

            {/* Add Review Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg mb-10 space-y-5"
                    noValidate
                >
                    <h3 className="font-serif text-2xl font-bold">Share Your Experience</h3>

                    {errorMsg && (
                        <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="rev-author" className="block text-xs font-semibold text-stone-700 mb-1">
                                Display Name *
                            </label>
                            <input
                                id="rev-author"
                                required
                                maxLength={60}
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="e.g. Emma W."
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-base sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="rev-location" className="block text-xs font-semibold text-stone-700 mb-1">
                                Town / City (Optional)
                            </label>
                            <input
                                id="rev-location"
                                maxLength={60}
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter your town or city"
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-base sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="rev-product" className="block text-xs font-semibold text-stone-700 mb-1">
                                Product Purchased (Optional)
                            </label>
                            <select
                                id="rev-product"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-base sm:text-sm bg-white"
                            >
                                <option value="">Select a product (Optional)</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Star Selector */}
                    <div>
                        <span className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Star Rating *
                        </span>
                        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    role="radio"
                                    aria-checked={rating === num}
                                    aria-label={`${num} Star${num > 1 ? 's' : ''}`}
                                    onClick={() => setRating(num)}
                                    className="p-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A7B56] rounded"
                                >
                                    <Star
                                        className={`w-6 h-6 ${num <= rating ? 'text-amber-500 fill-current' : 'text-stone-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="rev-comment" className="block text-xs font-semibold text-stone-700 mb-1">
                            Your Review *
                        </label>
                        <textarea
                            id="rev-comment"
                            required
                            maxLength={1000}
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell others about the quality, comfort, or showroom experience..."
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-base sm:text-sm"
                        />
                    </div>

                    {/* Image Attachment Upload */}
                    <div>
                        <span className="block text-xs font-semibold text-stone-700 mb-2">
                            Attach photos (optional, up to 3)
                        </span>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-[#9A7B56] bg-[#FAF8F5] text-xs font-medium text-stone-700 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" />
                            Choose Image Files
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>

                        {uploadedImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3">
                                {uploadedImages.map((src, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200">
                                        <img src={src} alt={`Upload preview ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            aria-label="Remove uploaded image"
                                            onClick={() =>
                                                setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))
                                            }
                                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* UK GDPR Explicit Publication Consent */}
                    <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={gdprConsent}
                            onChange={(e) => setGdprConsent(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            I consent to SJ Home Interiors displaying my submitted name, town, review text, and uploaded photos publicly on this website in accordance with the Privacy Policy. *
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-7 py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-400 text-white text-sm font-semibold cursor-pointer"
                    >
                        {submitting ? 'Sending…' : 'Submit review'}
                    </button>
                </form>
            )}

            {visibleReviews.length === 0 && !showForm && (
                <p className="text-sm text-stone-600 bg-white border border-stone-200 rounded-2xl p-6 max-w-xl">
                    No reviews yet. Bought from us? We would love to hear how you are getting on.
                </p>
            )}

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleReviews.map((rev) => (
                    <article
                        key={rev.id}
                        className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex text-amber-500" aria-label={`${rev.rating} out of 5 stars`}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-stone-200'}`}
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] text-stone-400">{rev.date}</span>
                            </div>

                            {rev.productName && (
                                <span className="inline-block text-[11px] font-semibold text-[#9A7B56] mb-2">
                                    Product: {rev.productName}
                                </span>
                            )}

                            <p className="text-sm text-stone-700 leading-relaxed">
                                “{rev.comment}”
                            </p>

                            {/* Attached Customer Photos */}
                            {rev.images && rev.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {rev.images.map((imgUrl, idx) => {
                                        const safeUrl = validateSafeImageUrl(imgUrl);
                                        if (!safeUrl) return null;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setLightboxImg(safeUrl)}
                                                className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-200 cursor-pointer"
                                            >
                                                <img
                                                    src={safeUrl}
                                                    alt={`Customer photo by ${rev.author}`}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Official Showroom Admin Response */}
                            {rev.adminResponse && (
                                <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-[#1C1B18] mb-1">
                                        <CornerDownRight className="w-3.5 h-3.5 text-[#9A7B56]" aria-hidden="true" />
                                        <span>Response from SJ Home Interiors</span>
                                    </div>
                                    <p className="text-stone-600 text-[11px] leading-relaxed">
                                        {rev.adminResponse}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                            <div>
                                <strong className="text-[#1C1B18] block">{rev.author}</strong>
                                {rev.location && (
                                    <span className="text-[11px] text-stone-500">{rev.location}</span>
                                )}
                            </div>
                            {rev.verified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Verified Buyer
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Awaiting moderation
                                </span>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            {/* Photo Lightbox */}
            {lightboxImg && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Customer review image preview"
                    onClick={() => setLightboxImg(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <img
                        src={lightboxImg}
                        alt="Enlarged customer review photo"
                        className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
                    />
                </div>
            )}
        </section>
    );
}