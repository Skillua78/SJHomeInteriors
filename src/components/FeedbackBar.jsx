import { useState } from 'react';
import { MessageSquare, CheckCircle2, X, Star } from 'lucide-react';
import { api } from '../utils/api';

/**
 * Strip at the very bottom of the page: website feedback, plus "Write a review" when
 * the home page reviews list is switched off (renderReviewForm is then passed in).
 */
export default function FeedbackBar({ renderReviewForm }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [experienceRating, setExperienceRating] = useState('Great');

    const [sendError, setSendError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setSendError('');
        try {
            await api.sendMessage({
                kind: 'feedback',
                subject: experienceRating,
                message: feedbackText.trim(),
            });
        } catch (err) {
            setSendError(err.message);
            return;
        }
        setSubmitted(true);
        setTimeout(() => {
            setIsOpen(false);
            setSubmitted(false);
            setFeedbackText('');
        }, 2500);
    };

    return (
        <div className="bg-sand border-t border-stone-300/80 py-6 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-white text-bronze-deep shadow-2xs">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-ink">
                        Your comments help us improve our website
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {renderReviewForm && (
                        <button
                            type="button"
                            aria-expanded={reviewOpen}
                            onClick={() => {
                                setReviewOpen(!reviewOpen);
                                setIsOpen(false);
                            }}
                            className="press min-h-11 px-6 rounded-full bg-ink hover:bg-bronze-strong text-white text-sm font-semibold shadow-2xs flex items-center gap-2"
                        >
                            <Star className="w-4 h-4" aria-hidden="true" />
                            Write a review
                        </button>
                    )}
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => {
                            setIsOpen(!isOpen);
                            setReviewOpen(false);
                        }}
                        className="press min-h-11 px-6 rounded-full bg-white hover:bg-ink hover:text-white text-ink border border-stone-300 text-sm font-semibold shadow-2xs"
                    >
                        Leave feedback
                    </button>
                </div>
            </div>

            {renderReviewForm && reviewOpen && renderReviewForm(() => setReviewOpen(false))}

            {isOpen && (
                <div className="max-w-xl mx-auto mt-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-lg">
                    {submitted ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold py-4">
                            <CheckCircle2 className="w-5 h-5" /> Thank you! Your feedback helps us improve SJHomeInteriors.co.uk.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-serif text-lg font-bold">Website Feedback</h4>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {['Easy to use', 'Great design', 'Need help finding an item', 'Report an issue'].map(
                                    (tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setExperienceRating(tag)}
                                            className={`px-3 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${experienceRating === tag
                                                    ? 'bg-ink text-white border-ink'
                                                    : 'bg-cream text-stone-600 border-stone-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    )
                                )}
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Tell us what you think about our website or what furniture you'd like to see..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                            />
                            {sendError && (
                                <p role="alert" className="text-xs text-red-700">
                                    {sendError}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-full bg-bronze-strong text-white text-xs font-semibold cursor-pointer"
                            >
                                Submit Feedback
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}