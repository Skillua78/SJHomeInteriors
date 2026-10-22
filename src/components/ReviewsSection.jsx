import { useState } from 'react';
import { Star, Upload, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';

export default function ReviewsSection({ reviews, onAddReview, products }) {
    const [showForm, setShowForm] = useState(false);
    const [lightboxImg, setLightboxImg] = useState(null);
    const [author, setAuthor] = useState('');
    const [location, setLocation] = useState('Rotherham');
    const [rating, setRating] = useState(5);
    const [productName, setProductName] = useState(products[0]?.name || 'Luna U Shape Sofa Bed');
    const [comment, setComment] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUploadedImages((prev) => [...prev, ev.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!author.trim() || !comment.trim()) return;
        onAddReview({
            id: `rev-${Date.now()}`,
            author,
            location,
            rating,
            date: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            productName,
            comment,
            images: uploadedImages,
        });
        setAuthor('');
        setComment('');
        setUploadedImages([]);
        setShowForm(false);
    };

    return (
        <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-200">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Verified Customer Photos & Feedback
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                        Customer Reviews
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-stone-700">
                            4.9 / 5.0 Based on {reviews.length} Verified Showroom & Online Buyers
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                >
                    {showForm ? 'Cancel Review' : '+ Write a Review & Attach Photos'}
                </button>
            </div>

            {/* Add Review Form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg mb-10 space-y-5"
                >
                    <h3 className="font-serif text-2xl font-bold">Share Your Experience</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Your Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="e.g. Emma W."
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Town / City
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Maltby, Sheffield"
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Product Purchased
                            </label>
                            <select
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs bg-white"
                            >
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
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Star Rating
                        </label>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRating(num)}
                                    className="p-1 cursor-pointer"
                                >
                                    <Star
                                        className={`w-6 h-6 ${num <= rating
                                                ? 'text-amber-500 fill-current'
                                                : 'text-stone-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Your Review *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell others about the comfort, quality, and delivery service..."
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                        />
                    </div>

                    {/* Image Attachment Upload */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-2">
                            Attach Photos of Your Furniture (Optional)
                        </label>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-[#9A7B56] bg-[#FAF8F5] text-xs font-medium text-stone-700 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-[#9A7B56]" />
                            Choose Image Files
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>

                        {uploadedImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3">
                                {uploadedImages.map((src, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200">
                                        <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
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

                    <button
                        type="submit"
                        className="px-7 py-3.5 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold cursor-pointer"
                    >
                        Publish Verified Review
                    </button>
                </form>
            )}

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                    <div
                        key={rev.id}
                        className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex text-amber-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-stone-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[11px] text-stone-400">{rev.date}</span>
                            </div>

                            <span className="inline-block text-[11px] font-semibold text-[#9A7B56] mb-2">
                                Purchased: {rev.productName}
                            </span>

                            <p className="text-xs text-stone-700 leading-relaxed">
                                "{rev.comment}"
                            </p>

                            {/* Attached Customer Photos */}
                            {rev.images && rev.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {rev.images.map((imgUrl, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setLightboxImg(imgUrl)}
                                            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-200 cursor-pointer"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt="Customer attachment"
                                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                            <div>
                                <strong className="text-[#1C1B18] block">{rev.author}</strong>
                                <span className="text-[11px] text-stone-500">{rev.location}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Photo Lightbox */}
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                    <img
                        src={lightboxImg}
                        alt="Enlarged customer review"
                        className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
                    />
                </div>
            )}
        </section>
    );
}