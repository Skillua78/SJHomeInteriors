import { useState } from 'react';
import { Star, Upload, CheckCircle2, X, ShieldCheck, CornerDownRight, AlertCircle } from 'lucide-react';
import { sanitizeText, validateImageFile, validateSafeImageUrl } from '../utils/security';

export default function ReviewsSection({ reviews, onAddReview, products, currentUser, onOpenAdmin }) {
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

    const handleImageUpload = (e) => {
        setErrorMsg('');
        const files = Array.from(e.target.files || []);
        if (uploadedImages.length + files.length > 3) {
            setErrorMsg('You may attach up to 3 photos per review.');
            return;
        }

        files.forEach((file) => {
            const check = validateImageFile(file);
            if (!check.valid) {
                setErrorMsg(check.error);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const safeDataUrl = validateSafeImageUrl(ev.target.result);
                if (safeDataUrl) {
                    setUploadedImages((prev) => [...prev, safeDataUrl]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanAuthor = sanitizeText(author, 60);
        const cleanLocation = sanitizeText(location, 60);
        const cleanComment = sanitizeText(comment, 1000);
        const cleanProduct = sanitizeText(productName, 120);

        if (!cleanAuthor || !cleanComment) {
            setErrorMsg('Please enter your display name and review comment.');
            return;
        }
        if (!gdprConsent) {
            setErrorMsg('Please confirm consent to publish your review and any attached images.');
            return;
        }

        onAddReview({
            id: `rev-${Date.now()}`,
            author: cleanAuthor,
            location: cleanLocation,
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            date: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            productName: cleanProduct, // Can be empty string if not selected
            comment: cleanComment,
            images: uploadedImages,
            verified: false, // Pending admin verification in Admin Dashboard
            adminResponse: '',
        });

        setAuthor('');
        setLocation('');
        setProductName('');
        setComment('');
        setUploadedImages([]);
        setGdprConsent(false);
        setShowForm(false);
    };

    return (
        <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Customer Photos & Testimonials
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                        Customer Reviews
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-amber-500" aria-label="Rated 4.9 out of 5 stars">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-stone-700">
                            4.9 / 5.0 ({reviews.length} Reviews)
                        </span>
                    </div>
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
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                    >
                        {showForm ? 'Cancel Review' : '+ Write a Review & Attach Photos'}
                    </button>
                </div>
            </div>

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
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs bg-white"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                        />
                    </div>

                    {/* Image Attachment Upload */}
                    <div>
                        <span className="block text-xs font-semibold text-stone-700 mb-2">
                            Attach Photos (Optional &bull; Max 3 images, JPG/PNG/WebP up to 2MB each)
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
                        className="px-7 py-3.5 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold cursor-pointer"
                    >
                        Submit Review
                    </button>
                </form>
            )}

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev) => (
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

                            <p className="text-xs text-stone-700 leading-relaxed">
                                "{rev.comment}"
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
                                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Submitted Review
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